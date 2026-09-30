const {
    ReportCard, Student, Period, AcademicYear, Class, Enrollment,
    Grade, Assessment, TeacherAssignment, Subject, Attendance
} = require("../models")
const { Op } = require("sequelize");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");
const { isParent, getChildStudentIds, assertParentCanAccessStudent } = require("../utils/parentAccess");
const {
    DEVOIR_WEIGHT, COMPOSITION_WEIGHT, subjectAppreciation, workAppreciation, distinction
} = require("../constants/grading");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class ReportCardService extends BaseService {
    constructor() {
        super(ReportCard);
    }

    async _assertSchoolAccess(schoolId, currentUser) {
        if (isSuperAdmin(currentUser)) return;
        if (schoolId !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }
    }

    async _schoolIdForReportCard(reportCard) {
        const classRecord = await Class.findByPk(reportCard.class_id);
        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        return academicYear.school_id;
    }

    async _assertClassAccess(classId, currentUser) {
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
            throw new HttpError("Classe introuvable", 404);
        }

        if (isParent(currentUser)) {
            const childIds = await getChildStudentIds(currentUser);
            const hasChildInClass = await Enrollment.findOne({
                where: { class_id: classId, student_id: childIds, status: 'ACTIVE' }
            });
            if (!hasChildInClass) {
                throw new HttpError("Accès refusé", 403);
            }
            return;
        }

        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        await this._assertSchoolAccess(academicYear.school_id, currentUser);
    }

    async create(data, currentUser) {
        const { student_id, period_id } = data;

        if (!student_id || !period_id) {
            throw new HttpError("student_id et period_id sont requis.", 400);
        }

        const student = await Student.findByPk(student_id);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }
        await this._assertSchoolAccess(student.school_id, currentUser);

        const period = await Period.findByPk(period_id);
        if (!period) {
            throw new HttpError("Période introuvable", 404);
        }

        const enrollment = await Enrollment.findOne({
            where: { student_id, academic_year_id: period.academic_year_id, status: 'ACTIVE' }
        });
        if (!enrollment) {
            throw new HttpError("Aucune inscription active pour cet élève sur cette année scolaire.", 400);
        }

        const existing = await this.model.findOne({ where: { student_id, period_id } });
        if (existing) {
            throw new HttpError("Un bulletin existe déjà pour cet élève sur cette période.", 400);
        }

        return super.create({
            student_id,
            class_id: enrollment.class_id,
            period_id,
            status: 'DRAFT',
            generated_at: new Date()
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.student_id) {
            where.student_id = query.student_id;
            if (isParent(currentUser)) {
                await assertParentCanAccessStudent(query.student_id, currentUser);
            } else {
                const student = await Student.findByPk(query.student_id);
                if (student) {
                    await this._assertSchoolAccess(student.school_id, currentUser);
                }
            }
        } else if (query.class_id) {
            where.class_id = query.class_id;
            await this._assertClassAccess(query.class_id, currentUser);
        } else if (isParent(currentUser)) {
            where.student_id = await getChildStudentIds(currentUser);
        } else if (!isSuperAdmin(currentUser)) {
            const academicYears = await AcademicYear.findAll({
                where: { school_id: currentUser.school_id },
                attributes: ["id"]
            });
            const classes = await Class.findAll({
                where: { academic_year_id: academicYears.map((a) => a.id) },
                attributes: ["id"]
            });
            where.class_id = classes.map((c) => c.id);
        }

        // Filtre indépendant, combinable avec le scoping ci-dessus (ex: classe X
        // pour l'école courante ET période Y) — jamais utilisé seul pour le scoping
        // multi-tenant, qui reste porté par student_id/class_id.
        if (query.period_id) {
            where.period_id = query.period_id;
        }

        return this.model.findAll({
            where,
            order: [["id", "DESC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const reportCard = await this.model.findByPk(id);

        if (!reportCard) {
            throw new HttpError("Bulletin introuvable", 404);
        }

        const schoolId = await this._schoolIdForReportCard(reportCard);
        await this._assertSchoolAccess(schoolId, currentUser);

        return reportCard;
    }

    async _findReadable(id, currentUser) {
        if (isParent(currentUser)) {
            const reportCard = await this.model.findByPk(id);
            if (!reportCard) {
                throw new HttpError("Bulletin introuvable", 404);
            }
            await assertParentCanAccessStudent(reportCard.student_id, currentUser);
            return reportCard;
        }
        return this._findWithAccess(id, currentUser);
    }

    // Calcul malien, par matière enseignée dans la classe :
    //   Devoir  = moyenne simple des devoirs (somme / nombre), ramenés sur 20
    //   Comp    = note de composition (COMPOSITION), ramenée sur 20
    //   Moy/20  = (Devoir × poids + Comp × poids) / somme des poids (constants/grading.js)
    //   Moy Gen = Moy/20 × coefficient de la matière
    // Moyenne générale = Σ Moy Gen / Σ coefficients des matières notées. Les
    // valeurs intermédiaires ne sont pas arrondies : seul l'affichage l'est,
    // comme sur les bulletins papier (280 / 27 affiché 10,38 et non 10,37).
    async _computeAverages(studentId, classId, periodId) {
        const assignments = await TeacherAssignment.findAll({
            where: { class_id: classId },
            include: [{ model: Subject, as: 'Subject' }],
            order: [["id", "ASC"]]
        });

        const grades = await Grade.findAll({
            where: { student_id: studentId },
            include: [{
                model: Assessment,
                as: 'Assessment',
                where: { period_id: periodId },
                include: [{
                    model: TeacherAssignment,
                    as: 'TeacherAssignment',
                    where: { class_id: classId },
                    include: [{ model: Subject, as: 'Subject' }]
                }]
            }]
        });

        // Toutes les matières de la classe apparaissent, même sans note encore
        // (lignes vides sur le bulletin, exclues des totaux).
        const bySubject = new Map();
        const ensureSubject = (subject) => {
            if (!bySubject.has(subject.id)) {
                bySubject.set(subject.id, {
                    subject_id: subject.id,
                    subject_name: subject.name,
                    coefficient: subject.coefficient_default,
                    devoirs: [],
                    compositions: []
                });
            }
            return bySubject.get(subject.id);
        };
        for (const assignment of assignments) {
            if (assignment.Subject) ensureSubject(assignment.Subject);
        }

        for (const grade of grades) {
            const assessment = grade.Assessment;
            const entry = ensureSubject(assessment.TeacherAssignment.Subject);
            const normalized = (grade.score / assessment.max_score) * 20;
            (assessment.type === 'COMPOSITION' ? entry.compositions : entry.devoirs).push(normalized);
        }

        const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);
        const round2 = (value) => (value === null ? null : Number(value.toFixed(2)));

        let totalCoefficient = 0;
        let totalWeighted = 0;
        const subjects = Array.from(bySubject.values()).map((s) => {
            const devoir = mean(s.devoirs);
            const composition = mean(s.compositions);

            let average = null;
            if (devoir !== null && composition !== null) {
                average = (devoir * DEVOIR_WEIGHT + composition * COMPOSITION_WEIGHT) / (DEVOIR_WEIGHT + COMPOSITION_WEIGHT);
            } else {
                average = devoir ?? composition;
            }

            const weighted = average === null ? null : average * s.coefficient;
            if (weighted !== null) {
                totalCoefficient += s.coefficient;
                totalWeighted += weighted;
            }

            return {
                subject_id: s.subject_id,
                subject_name: s.subject_name,
                coefficient: s.coefficient,
                devoir_average: round2(devoir),
                devoir_count: s.devoirs.length,
                composition_average: round2(composition),
                average: round2(average),
                weighted_average: round2(weighted),
                appreciation: subjectAppreciation(average)
            };
        });

        const overall_average = totalCoefficient ? round2(totalWeighted / totalCoefficient) : null;

        return {
            subjects,
            overall_average,
            total_coefficient: totalCoefficient,
            total_weighted: round2(totalWeighted)
        };
    }

    async _rankClass(classId, periodId, currentUser) {
        await this._assertClassAccess(classId, currentUser);

        const enrollments = await Enrollment.findAll({
            where: { class_id: classId, status: 'ACTIVE' },
            include: [{ model: Student }]
        });

        const entries = [];
        for (const enrollment of enrollments) {
            const student = enrollment.Student;
            const { overall_average } = await this._computeAverages(student.id, classId, periodId);
            entries.push({
                student_id: student.id,
                student_name: `${student.first_name} ${student.last_name}`,
                overall_average,
                rank: null
            });
        }

        // Élèves sans moyenne (pas encore de notes) en fin de liste, non classés.
        entries.sort((a, b) => {
            if (a.overall_average === null && b.overall_average === null) return 0;
            if (a.overall_average === null) return 1;
            if (b.overall_average === null) return -1;
            return b.overall_average - a.overall_average;
        });

        // Classement "1224" : deux moyennes égales partagent le même rang, le
        // rang suivant saute en conséquence (pas de rang consécutif artificiel).
        let rank = 0;
        let previousAverage = null;
        entries.forEach((entry, index) => {
            if (entry.overall_average === null) {
                return;
            }
            if (entry.overall_average !== previousAverage) {
                rank = index + 1;
                previousAverage = entry.overall_average;
            }
            entry.rank = rank;
        });

        return { class_id: classId, period_id: periodId, total_students: entries.length, ranking: entries };
    }

    async getClassRanking(classId, periodId, currentUser) {
        if (!classId || !periodId) {
            throw new HttpError("class_id et period_id sont requis.", 400);
        }

        return this._rankClass(Number(classId), Number(periodId), currentUser);
    }

    async getById(id, currentUser) {
        const reportCard = await this._findReadable(id, currentUser);
        const classRanking = await this._rankClass(reportCard.class_id, reportCard.period_id, currentUser);
        return this._buildDetail(reportCard, classRanking);
    }

    // Tous les bulletins d'une classe pour une période (impression groupée),
    // triés par nom d'élève. Le classement n'est calculé qu'une fois pour tous.
    async getClassDetails(classId, periodId, currentUser) {
        if (!classId || !periodId) {
            throw new HttpError("class_id et period_id sont requis.", 400);
        }
        // Un parent ne peut pas imprimer les bulletins des autres élèves.
        if (isParent(currentUser)) {
            throw new HttpError("Accès refusé", 403);
        }

        const classRanking = await this._rankClass(Number(classId), Number(periodId), currentUser);
        const reportCards = await this.model.findAll({
            where: { class_id: classId, period_id: periodId },
            include: [{ model: Student, as: "Student" }]
        });
        if (reportCards.length === 0) {
            throw new HttpError("Aucun bulletin n'a encore été créé pour cette classe sur cette période.", 404);
        }

        reportCards.sort((a, b) =>
            `${a.Student?.last_name} ${a.Student?.first_name}`.localeCompare(`${b.Student?.last_name} ${b.Student?.first_name}`, "fr"));

        const details = [];
        for (const reportCard of reportCards) {
            details.push(await this._buildDetail(reportCard, classRanking));
        }
        return details;
    }

    async _buildDetail(reportCard, { ranking, total_students }) {
        const { subjects, overall_average, total_coefficient, total_weighted } = await this._computeAverages(
            reportCard.student_id, reportCard.class_id, reportCard.period_id
        );
        const rankEntry = ranking.find((e) => e.student_id === reportCard.student_id);

        const { late_count, absence_count } = await this._attendanceCounts(reportCard);

        return {
            ...reportCard.toJSON(),
            subjects,
            overall_average,
            total_coefficient,
            total_weighted,
            rank: rankEntry ? rankEntry.rank : null,
            total_students,
            late_count,
            absence_count,
            work_appreciation: workAppreciation(overall_average),
            distinction: distinction(overall_average)
        };
    }

    // Retards et absences de l'élève sur la période, comptés en demi-journées
    // (une ligne de présence = une matinée ou un après-midi), justifiés compris.
    async _attendanceCounts(reportCard) {
        const period = await Period.findByPk(reportCard.period_id);
        const where = { student_id: reportCard.student_id, class_id: reportCard.class_id };
        if (period?.start_date && period?.end_date) {
            where.date = { [Op.between]: [period.start_date, period.end_date] };
        }
        const [late_count, absence_count] = await Promise.all([
            Attendance.count({ where: { ...where, status: 'LATE' } }),
            Attendance.count({ where: { ...where, status: 'ABSENT' } })
        ]);
        return { late_count, absence_count };
    }

    async validate(id, currentUser) {
        const reportCard = await this._findWithAccess(id, currentUser);

        if (reportCard.status === 'VALIDATED') {
            throw new HttpError("Ce bulletin est déjà validé.", 400);
        }

        await reportCard.update({
            status: 'VALIDATED',
            validated_at: new Date(),
            validated_by: currentUser.id
        });

        return reportCard;
    }

    async delete(id, currentUser) {
        const reportCard = await this._findWithAccess(id, currentUser);
        await reportCard.destroy();
    }
}

module.exports = new ReportCardService();
