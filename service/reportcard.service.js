const {
    ReportCard, Student, Period, AcademicYear, Class, Enrollment,
    Grade, Assessment, TeacherAssignment, Subject
} = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

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
            const student = await Student.findByPk(query.student_id);
            if (student) {
                await this._assertSchoolAccess(student.school_id, currentUser);
            }
        } else if (query.class_id) {
            where.class_id = query.class_id;
            await this._assertClassAccess(query.class_id, currentUser);
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

    async getById(id, currentUser) {
        const reportCard = await this._findWithAccess(id, currentUser);

        const grades = await Grade.findAll({
            where: { student_id: reportCard.student_id },
            include: [{
                model: Assessment,
                as: 'Assessment',
                where: { period_id: reportCard.period_id },
                include: [{
                    model: TeacherAssignment,
                    as: 'TeacherAssignment',
                    where: { class_id: reportCard.class_id },
                    include: [{ model: Subject, as: 'Subject' }]
                }]
            }]
        });

        const bySubject = new Map();
        for (const grade of grades) {
            const assessment = grade.Assessment;
            const subject = assessment.TeacherAssignment.Subject;
            const normalized = (grade.score / assessment.max_score) * 20;
            const weight = assessment.coefficient;

            if (!bySubject.has(subject.id)) {
                bySubject.set(subject.id, {
                    subject_id: subject.id,
                    subject_name: subject.name,
                    coefficient: subject.coefficient_default,
                    weightedSum: 0,
                    weightTotal: 0
                });
            }
            const entry = bySubject.get(subject.id);
            entry.weightedSum += normalized * weight;
            entry.weightTotal += weight;
        }

        const subjects = Array.from(bySubject.values()).map((s) => ({
            subject_id: s.subject_id,
            subject_name: s.subject_name,
            coefficient: s.coefficient,
            average: s.weightTotal ? Number((s.weightedSum / s.weightTotal).toFixed(2)) : null
        }));

        // Moyenne générale pondérée par le coefficient de chaque matière (pas une
        // simple moyenne des moyennes) — c'est tout l'intérêt d'avoir un coefficient.
        const gradedSubjects = subjects.filter((s) => s.average !== null);
        const overallWeightTotal = gradedSubjects.reduce((sum, s) => sum + s.coefficient, 0);
        const overall_average = overallWeightTotal
            ? Number(
                (gradedSubjects.reduce((sum, s) => sum + s.average * s.coefficient, 0) / overallWeightTotal).toFixed(2)
            )
            : null;

        return {
            ...reportCard.toJSON(),
            subjects,
            overall_average
        };
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
