const {
    ReportCard, Student, Period, AcademicYear, Class, Enrollment,
    Grade, Assessment, TeacherAssignment, Subject, Attendance
} = require("../models")
const { Op } = require("sequelize");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");
const { isParent, getChildStudentIds, assertParentCanAccessStudent } = require("../utils/parentAccess");
const { workAppreciation, distinction } = require("../constants/grading");
const { toTwenty, termAverages, annualAverages, rankEntries } = require("../utils/averages");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

// Un redoublant (REPEATING) est dans la classe comme un élève actif.
const IN_CLASS = ['ACTIVE', 'REPEATING'];
const ANNUAL = 'ANNUAL';
const TRIMESTER = 'TRIMESTER';

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
                where: { class_id: classId, student_id: childIds, status: IN_CLASS }
            });
            if (!hasChildInClass) {
                throw new HttpError("Accès refusé", 403);
            }
            return classRecord;
        }

        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        await this._assertSchoolAccess(academicYear.school_id, currentUser);
        return classRecord;
    }

    // Trimestres de l'année, dans l'ordre (position, puis date de début).
    async _yearPeriods(academicYearId) {
        return Period.findAll({
            where: { academic_year_id: academicYearId },
            order: [["position", "ASC"], ["start_date", "ASC"], ["id", "ASC"]]
        });
    }

    // Bulletin trimestriel : student_id + period_id.
    // Bulletin annuel : student_id + academic_year_id + type ANNUAL, possible
    // seulement une fois le bulletin du dernier trimestre de l'élève créé.
    async create(data, currentUser) {
        const { student_id, type = TRIMESTER } = data;

        if (!student_id) {
            throw new HttpError("student_id est requis.", 400);
        }

        const student = await Student.findByPk(student_id);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }
        await this._assertSchoolAccess(student.school_id, currentUser);

        if (type === ANNUAL) {
            return this._createAnnual(student, data.academic_year_id);
        }

        const { period_id } = data;
        if (!period_id) {
            throw new HttpError("period_id est requis pour un bulletin trimestriel.", 400);
        }

        const period = await Period.findByPk(period_id);
        if (!period) {
            throw new HttpError("Période introuvable", 404);
        }

        const enrollment = await Enrollment.findOne({
            where: { student_id, academic_year_id: period.academic_year_id, status: IN_CLASS }
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
            academic_year_id: period.academic_year_id,
            type: TRIMESTER,
            status: 'DRAFT',
            generated_at: new Date()
        });
    }

    async _createAnnual(student, academicYearId) {
        if (!academicYearId) {
            throw new HttpError("academic_year_id est requis pour un bulletin annuel.", 400);
        }

        const academicYear = await AcademicYear.findByPk(academicYearId);
        if (!academicYear) {
            throw new HttpError("Année scolaire introuvable", 404);
        }
        if (academicYear.school_id !== student.school_id) {
            throw new HttpError("Cette année scolaire n'appartient pas à l'école de l'élève.", 400);
        }

        const enrollment = await Enrollment.findOne({
            where: { student_id: student.id, academic_year_id: academicYear.id, status: IN_CLASS }
        });
        if (!enrollment) {
            throw new HttpError("Aucune inscription active pour cet élève sur cette année scolaire.", 400);
        }

        const existing = await this.model.findOne({
            where: { student_id: student.id, academic_year_id: academicYear.id, type: ANNUAL }
        });
        if (existing) {
            throw new HttpError("Un bulletin annuel existe déjà pour cet élève sur cette année scolaire.", 400);
        }

        const periods = await this._yearPeriods(academicYear.id);
        const lastPeriod = periods[periods.length - 1];
        if (!lastPeriod) {
            throw new HttpError("Aucun trimestre n'est défini pour cette année scolaire.", 400);
        }
        const lastBulletin = await this.model.findOne({
            where: { student_id: student.id, period_id: lastPeriod.id }
        });
        if (!lastBulletin) {
            throw new HttpError(`Le bulletin du dernier trimestre (${lastPeriod.label}) doit être créé avant le bulletin annuel.`, 400);
        }

        return super.create({
            student_id: student.id,
            class_id: enrollment.class_id,
            period_id: null,
            academic_year_id: academicYear.id,
            type: ANNUAL,
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

        // Filtres indépendants, combinables avec le scoping ci-dessus (ex: classe X
        // pour l'école courante ET période Y) — jamais utilisés seuls pour le scoping
        // multi-tenant, qui reste porté par student_id/class_id.
        if (query.period_id) {
            where.period_id = query.period_id;
        }
        if (query.academic_year_id) {
            where.academic_year_id = query.academic_year_id;
        }
        if (query.type === ANNUAL || query.type === TRIMESTER) {
            where.type = query.type;
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

    // Notes de l'élève ramenées sur 20, par période puis par matière. Toutes
    // les matières de la classe sont présentes, même sans note (lignes vides
    // sur le bulletin, exclues des totaux). Renvoie Map(period_id → matières).
    async _subjectInputs(studentId, classId, periodIds) {
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
                where: { period_id: periodIds },
                include: [{
                    model: TeacherAssignment,
                    as: 'TeacherAssignment',
                    where: { class_id: classId },
                    include: [{ model: Subject, as: 'Subject' }]
                }]
            }]
        });

        const byPeriod = new Map();
        const ensureSubject = (periodId, subject) => {
            const subjects = byPeriod.get(periodId);
            if (!subjects.has(subject.id)) {
                subjects.set(subject.id, {
                    subject_id: subject.id,
                    subject_name: subject.name,
                    coefficient: subject.coefficient_default,
                    devoirs: [],
                    compositions: []
                });
            }
            return subjects.get(subject.id);
        };
        for (const periodId of periodIds) {
            byPeriod.set(periodId, new Map());
            for (const assignment of assignments) {
                if (assignment.Subject) ensureSubject(periodId, assignment.Subject);
            }
        }

        for (const grade of grades) {
            const assessment = grade.Assessment;
            const entry = ensureSubject(assessment.period_id, assessment.TeacherAssignment.Subject);
            const normalized = toTwenty(grade.score, assessment.max_score);
            (assessment.type === 'COMPOSITION' ? entry.compositions : entry.devoirs).push(normalized);
        }

        return new Map(Array.from(byPeriod, ([periodId, subjects]) => [periodId, Array.from(subjects.values())]));
    }

    // Moyennes d'un trimestre (règles : utils/averages.js).
    async _computeAverages(studentId, classId, periodId) {
        const inputs = await this._subjectInputs(studentId, classId, [periodId]);
        // eslint-disable-next-line no-unused-vars -- _exact ne sert qu'au calcul annuel
        const { _exact, ...result } = termAverages(inputs.get(periodId));
        return result;
    }

    // Moyennes de l'année : chaque trimestre, puis moyenne annuelle par matière
    // et moyenne annuelle générale (règles : utils/averages.js).
    async _computeAnnual(studentId, classId, periods) {
        const periodIds = periods.map((p) => p.id);
        const inputs = await this._subjectInputs(studentId, classId, periodIds);
        return annualAverages(periods.map((p) => ({
            period_id: p.id,
            label: p.label,
            result: termAverages(inputs.get(p.id))
        })));
    }

    // Classement de la classe sur un trimestre (periodId) ou sur l'année
    // (periodId null : moyenne annuelle).
    async _rankClass(classId, periodId, currentUser) {
        const classRecord = await this._assertClassAccess(classId, currentUser);
        const periods = periodId ? null : await this._yearPeriods(classRecord.academic_year_id);

        const enrollments = await Enrollment.findAll({
            where: { class_id: classId, status: IN_CLASS },
            include: [{ model: Student }]
        });

        const entries = [];
        for (const enrollment of enrollments) {
            const student = enrollment.Student;
            const { overall_average } = periodId
                ? await this._computeAverages(student.id, classId, periodId)
                : await this._computeAnnual(student.id, classId, periods);
            entries.push({
                student_id: student.id,
                student_name: `${student.first_name} ${student.last_name}`,
                overall_average
            });
        }

        const ranking = rankEntries(entries);
        return { class_id: classId, period_id: periodId, total_students: ranking.length, ranking };
    }

    // type ANNUAL : classement sur la moyenne annuelle, period_id inutile.
    async getClassRanking(classId, periodId, currentUser, type = TRIMESTER) {
        if (type === ANNUAL) {
            if (!classId) {
                throw new HttpError("class_id est requis.", 400);
            }
            return this._rankClass(Number(classId), null, currentUser);
        }
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

    // Tous les bulletins d'une classe pour une période, ou tous ses bulletins
    // annuels (type ANNUAL), pour l'impression groupée, triés par nom d'élève.
    // Le classement n'est calculé qu'une fois pour tous.
    async getClassDetails(classId, periodId, currentUser, type = TRIMESTER) {
        const annual = type === ANNUAL;
        if (!classId || (!annual && !periodId)) {
            throw new HttpError("class_id et period_id sont requis.", 400);
        }
        // Un parent ne peut pas imprimer les bulletins des autres élèves.
        if (isParent(currentUser)) {
            throw new HttpError("Accès refusé", 403);
        }

        const classRanking = await this._rankClass(Number(classId), annual ? null : Number(periodId), currentUser);
        const reportCards = await this.model.findAll({
            where: annual
                ? { class_id: classId, type: ANNUAL }
                : { class_id: classId, period_id: periodId },
            include: [{ model: Student, as: "Student" }]
        });
        if (reportCards.length === 0) {
            throw new HttpError(annual
                ? "Aucun bulletin annuel n'a encore été créé pour cette classe."
                : "Aucun bulletin n'a encore été créé pour cette classe sur cette période.", 404);
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
        const annual = reportCard.type === ANNUAL;
        let averages;
        if (annual) {
            const classRecord = await Class.findByPk(reportCard.class_id);
            const periods = await this._yearPeriods(classRecord.academic_year_id);
            averages = await this._computeAnnual(reportCard.student_id, reportCard.class_id, periods);
        } else {
            averages = await this._computeAverages(reportCard.student_id, reportCard.class_id, reportCard.period_id);
        }
        const rankEntry = ranking.find((e) => e.student_id === reportCard.student_id);

        const { late_count, absence_count } = await this._attendanceCounts(reportCard);

        return {
            ...reportCard.toJSON(),
            ...averages,
            rank: rankEntry ? rankEntry.rank : null,
            total_students,
            late_count,
            absence_count,
            work_appreciation: workAppreciation(averages.overall_average),
            distinction: distinction(averages.overall_average)
        };
    }

    // Retards et absences de l'élève, comptés en demi-journées (une ligne de
    // présence = une matinée ou un après-midi), justifiés compris : sur la
    // période pour un bulletin trimestriel, sur toute l'année (la classe est
    // propre à l'année) pour un bulletin annuel.
    async _attendanceCounts(reportCard) {
        const where = { student_id: reportCard.student_id, class_id: reportCard.class_id };
        if (reportCard.period_id) {
            const period = await Period.findByPk(reportCard.period_id);
            if (period?.start_date && period?.end_date) {
                where.date = { [Op.between]: [period.start_date, period.end_date] };
            }
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
