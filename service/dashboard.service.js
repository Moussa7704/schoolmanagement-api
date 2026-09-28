const {
    School, AcademicYear, Class, Student, Teacher, Enrollment,
    TeacherAssignment, Assessment, Attendance, TuitionFee, Payment,
    Period, ReportCard
} = require("../models")
const roles = require("../constants/roles");
const { getChildStudentIds } = require("../utils/parentAccess");

// Résume une liste d'échéances (avec leurs paiements déjà inclus) en agrégats
// financiers — même règle de statut que TuitionFeeService._enrich, mais sur
// tout un lot plutôt que ligne par ligne pour un seul appelant.
function summarizeTuitionFees(tuitionFees) {
    const now = new Date();
    let total_due = 0;
    let total_paid = 0;
    let overdue_amount = 0;
    let overdue_count = 0;
    let pending_count = 0;

    for (const tf of tuitionFees) {
        const paid = (tf.Payments || []).reduce((sum, p) => sum + p.amount, 0);
        const balance = Number((tf.amount - paid).toFixed(2));
        total_due += tf.amount;
        total_paid += paid;

        if (balance > 0) {
            if (tf.due_date && new Date(tf.due_date) < now) {
                overdue_amount += balance;
                overdue_count += 1;
            } else {
                pending_count += 1;
            }
        }
    }

    return {
        total_due: Number(total_due.toFixed(2)),
        total_paid: Number(total_paid.toFixed(2)),
        overdue_amount: Number(overdue_amount.toFixed(2)),
        overdue_count,
        pending_count
    };
}

async function attendanceCounts(classIds) {
    if (!classIds.length) {
        return { total: 0, absent: 0 };
    }
    const [total, absent] = await Promise.all([
        Attendance.count({ where: { class_id: classIds } }),
        Attendance.count({ where: { class_id: classIds, status: 'ABSENT' } })
    ]);
    return { total, absent };
}

function rateFromCounts({ total, absent }) {
    return total ? Number((1 - absent / total).toFixed(2)) : null;
}

async function attendanceRate(classIds) {
    return rateFromCounts(await attendanceCounts(classIds));
}

// Agrégat par cycle (Préscolaire/Primaire/Collège/Lycée/Supérieur) — une classe
// sans cycle renseigné est regroupée sous `null` plutôt qu'exclue, pour rester
// visible tant que les classes existantes n'ont pas toutes été reclassées.
async function cycleBreakdown(classRecords) {
    const groups = new Map();
    for (const c of classRecords) {
        const key = c.cycle ?? null;
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(c.id);
    }

    return Promise.all(Array.from(groups.entries()).map(async ([cycle, ids]) => {
        const [students_count, counts] = await Promise.all([
            Enrollment.count({ where: { class_id: ids, status: 'ACTIVE' } }),
            attendanceCounts(ids)
        ]);

        return {
            cycle,
            classes_count: ids.length,
            students_count,
            attendance_rate: rateFromCounts(counts),
            // Comptes bruts, pas seulement le taux déjà arrondi — nécessaires pour
            // recombiner correctement plusieurs écoles au niveau plateforme (on ne
            // peut pas faire la moyenne de taux déjà calculés sans biaiser le résultat).
            total_sessions: counts.total,
            absent_count: counts.absent
        };
    }));
}

// Détail classe par classe — une seule moyenne pour toute une école masque les
// écarts réels (une classe à 60% de présence noyée dans une moyenne à 95%).
async function classBreakdown(classIds) {
    if (!classIds.length) {
        return [];
    }

    const classes = await Class.findAll({ where: { id: classIds } });

    return Promise.all(classes.map(async (classRecord) => {
        const [students_count, attendance, validated_count, draft_count] = await Promise.all([
            Enrollment.count({ where: { class_id: classRecord.id, status: 'ACTIVE' } }),
            attendanceRate([classRecord.id]),
            ReportCard.count({ where: { class_id: classRecord.id, status: 'VALIDATED' } }),
            ReportCard.count({ where: { class_id: classRecord.id, status: 'DRAFT' } })
        ]);

        return {
            class_id: classRecord.id,
            class_name: classRecord.name,
            level: classRecord.level,
            students_count,
            attendance_rate: attendance,
            report_cards: { validated_count, draft_count }
        };
    }));
}

class DashboardService {
    async _schoolStats(schoolId) {
        const school = await School.findByPk(schoolId);
        // Repli sur l'année la plus récente si aucune n'est explicitement marquée
        // "courante" (PATCH /academic-years/:id/set-current) — mieux vaut estimer
        // que le tableau de bord affiche un mur de zéros à une école qui a
        // simplement oublié cette étape de configuration.
        const currentAcademicYear = (await AcademicYear.findOne({ where: { school_id: schoolId, is_current: true } }))
            ?? (await AcademicYear.findOne({ where: { school_id: schoolId }, order: [["start_date", "DESC"]] }));

        const [students_count, teachers_count] = await Promise.all([
            Student.count({ where: { school_id: schoolId } }),
            Teacher.count({ where: { school_id: schoolId } })
        ]);

        let classes_count = 0;
        let active_enrollments_count = 0;
        let attendance_rate = null;
        let tuition = summarizeTuitionFees([]);
        let report_cards = { validated_count: 0, draft_count: 0 };
        let classes = [];
        let cycles = [];

        if (currentAcademicYear) {
            const classRecords = await Class.findAll({ where: { academic_year_id: currentAcademicYear.id }, attributes: ["id", "cycle"] });
            const classIds = classRecords.map((c) => c.id);
            classes_count = classIds.length;

            active_enrollments_count = await Enrollment.count({ where: { class_id: classIds, status: 'ACTIVE' } });
            attendance_rate = await attendanceRate(classIds);
            classes = await classBreakdown(classIds);
            cycles = await cycleBreakdown(classRecords);

            const tuitionFees = await TuitionFee.findAll({
                where: { academic_year_id: currentAcademicYear.id },
                include: [{ model: Payment, as: "Payments" }]
            });
            tuition = summarizeTuitionFees(tuitionFees);

            const periods = await Period.findAll({ where: { academic_year_id: currentAcademicYear.id }, attributes: ["id"] });
            const periodIds = periods.map((p) => p.id);
            const [validated_count, draft_count] = await Promise.all([
                ReportCard.count({ where: { period_id: periodIds, status: 'VALIDATED' } }),
                ReportCard.count({ where: { period_id: periodIds, status: 'DRAFT' } })
            ]);
            report_cards = { validated_count, draft_count };
        }

        return {
            scope: "school",
            school: school ? { id: school.id, name: school.name } : null,
            academic_year: currentAcademicYear ? { id: currentAcademicYear.id, label: currentAcademicYear.label } : null,
            students_count,
            teachers_count,
            classes_count,
            active_enrollments_count,
            attendance_rate,
            tuition,
            report_cards,
            classes,
            cycles
        };
    }

    async _platformStats() {
        const schools = await School.findAll();

        const perSchool = await Promise.all(schools.map(async (school) => {
            const stats = await this._schoolStats(school.id);
            return { school_id: school.id, school_name: school.name, ...stats };
        }));

        const totals = perSchool.reduce((acc, s) => ({
            students_count: acc.students_count + s.students_count,
            teachers_count: acc.teachers_count + s.teachers_count,
            classes_count: acc.classes_count + s.classes_count,
            total_due: acc.total_due + s.tuition.total_due,
            total_paid: acc.total_paid + s.tuition.total_paid,
            overdue_amount: acc.overdue_amount + s.tuition.overdue_amount,
            overdue_count: acc.overdue_count + s.tuition.overdue_count
        }), { students_count: 0, teachers_count: 0, classes_count: 0, total_due: 0, total_paid: 0, overdue_amount: 0, overdue_count: 0 });

        // Même regroupement par cycle que _schoolStats, mais fusionné à travers
        // toutes les écoles — recombine les comptes bruts de présence plutôt que
        // de moyenner des taux déjà arrondis, pour rester exact.
        const cycleTotals = new Map();
        for (const s of perSchool) {
            for (const c of s.cycles) {
                const key = c.cycle ?? "__none__";
                if (!cycleTotals.has(key)) {
                    cycleTotals.set(key, { cycle: c.cycle, classes_count: 0, students_count: 0, total_sessions: 0, absent_count: 0 });
                }
                const entry = cycleTotals.get(key);
                entry.classes_count += c.classes_count;
                entry.students_count += c.students_count;
                entry.total_sessions += c.total_sessions;
                entry.absent_count += c.absent_count;
            }
        }
        const cycles = Array.from(cycleTotals.values()).map((c) => ({
            cycle: c.cycle,
            classes_count: c.classes_count,
            students_count: c.students_count,
            attendance_rate: rateFromCounts({ total: c.total_sessions, absent: c.absent_count })
        }));

        return {
            scope: "platform",
            schools_count: schools.length,
            ...totals,
            cycles,
            schools: perSchool.map((s) => ({
                school_id: s.school_id,
                school_name: s.school_name,
                students_count: s.students_count,
                teachers_count: s.teachers_count,
                classes_count: s.classes_count,
                attendance_rate: s.attendance_rate,
                tuition: s.tuition
            }))
        };
    }

    async _teacherStats(currentUser) {
        const teacherId = currentUser?.Teacher?.id;
        if (!teacherId) {
            return { scope: "teacher", classes_count: 0, students_count: 0, assessments_count: 0, attendance_rate: null };
        }

        const assignments = await TeacherAssignment.findAll({ where: { teacher_id: teacherId } });
        const assignmentIds = assignments.map((a) => a.id);
        const classIds = [...new Set(assignments.map((a) => a.class_id))];

        const [students_count, assessments_count, attendance_rate, classes] = await Promise.all([
            Enrollment.count({ where: { class_id: classIds, status: 'ACTIVE' } }),
            Assessment.count({ where: { teacher_assignment_id: assignmentIds } }),
            attendanceRate(classIds),
            classBreakdown(classIds)
        ]);

        return {
            scope: "teacher",
            classes_count: classIds.length,
            students_count,
            assessments_count,
            attendance_rate,
            classes
        };
    }

    async _parentStats(currentUser) {
        const childIds = await getChildStudentIds(currentUser);

        if (!childIds.length) {
            return { scope: "parent", children_count: 0, total_balance_due: 0, next_due_date: null };
        }

        const tuitionFees = await TuitionFee.findAll({
            where: { student_id: childIds },
            include: [{ model: Payment, as: "Payments" }]
        });

        let total_balance_due = 0;
        let next_due_date = null;
        for (const tf of tuitionFees) {
            const paid = (tf.Payments || []).reduce((sum, p) => sum + p.amount, 0);
            const balance = Number((tf.amount - paid).toFixed(2));
            if (balance > 0) {
                total_balance_due += balance;
                if (tf.due_date && (!next_due_date || tf.due_date < next_due_date)) {
                    next_due_date = tf.due_date;
                }
            }
        }

        return {
            scope: "parent",
            children_count: childIds.length,
            total_balance_due: Number(total_balance_due.toFixed(2)),
            next_due_date
        };
    }

    async getStats(currentUser) {
        const roleName = currentUser?.Role?.name;

        if (roleName === roles.SUPER_ADMIN) {
            return this._platformStats();
        }
        if (roleName === roles.TEACHER) {
            return this._teacherStats(currentUser);
        }
        if (roleName === roles.PARENT) {
            return this._parentStats(currentUser);
        }
        if (currentUser?.school_id) {
            return this._schoolStats(currentUser.school_id);
        }

        return { scope: "none" };
    }
}

module.exports = new DashboardService();
