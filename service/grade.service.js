const { Grade, Assessment, TeacherAssignment, Enrollment, Student, Subject } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const assessmentService = require("./assessment.service");
const roles = require("../constants/roles");
const { isParent, getChildStudentIds, assertParentCanAccessStudent } = require("../utils/parentAccess");

class GradeService extends BaseService {
    constructor() {
        super(Grade);
    }

    async _assertAssessmentAccess(assessmentId, currentUser) {
        const assessment = await Assessment.findByPk(assessmentId);
        if (!assessment) {
            throw new HttpError("Évaluation introuvable", 404);
        }

        await assessmentService._assertTeacherAssignmentAccess(assessment.teacher_assignment_id, currentUser);

        return assessment;
    }

    async _assertScoreValid(assessment, score) {
        if (score === undefined || score === null || Number.isNaN(Number(score))) {
            throw new HttpError("score est requis.", 400);
        }
        if (score < 0 || score > assessment.max_score) {
            throw new HttpError(`La note doit être comprise entre 0 et ${assessment.max_score}.`, 400);
        }
    }

    async create(data, currentUser) {
        const { assessment_id, student_id, score } = data;

        if (!assessment_id || !student_id) {
            throw new HttpError("assessment_id et student_id sont requis.", 400);
        }

        const assessment = await this._assertAssessmentAccess(assessment_id, currentUser);
        await this._assertScoreValid(assessment, score);

        const teacherAssignment = await TeacherAssignment.findByPk(assessment.teacher_assignment_id);

        const enrollment = await Enrollment.findOne({
            where: { student_id, class_id: teacherAssignment.class_id, status: 'ACTIVE' }
        });
        if (!enrollment) {
            throw new HttpError("Cet élève n'est pas inscrit activement dans cette classe.", 400);
        }

        const existing = await this.model.findOne({ where: { assessment_id, student_id } });
        if (existing) {
            throw new HttpError("Une note existe déjà pour cet élève sur cette évaluation.", 400);
        }

        return super.create({ assessment_id, student_id, score });
    }

    async _assertStudentReadAccess(studentId, currentUser) {
        if (isParent(currentUser)) {
            await assertParentCanAccessStudent(studentId, currentUser);
            return;
        }
        if (currentUser?.Role?.name === roles.SUPER_ADMIN) {
            return;
        }
        const student = await Student.findByPk(studentId);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }
        if (student.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.assessment_id) {
            where.assessment_id = query.assessment_id;
            await this._assertAssessmentAccess(query.assessment_id, currentUser);
        } else if (query.student_id) {
            where.student_id = query.student_id;
            await this._assertStudentReadAccess(query.student_id, currentUser);
        } else if (isParent(currentUser)) {
            where.student_id = await getChildStudentIds(currentUser);
        } else {
            const assessments = await assessmentService.list(currentUser);
            where.assessment_id = assessments.map((a) => a.id);
        }

        return this.model.findAll({
            where,
            // Jointure jusqu'à la matière : un score seul (assessment_id, score) n'a
            // aucun sens pour un consommateur (ex: le suivi parent) sans savoir de
            // quelle matière/évaluation il s'agit.
            include: [{
                model: Assessment,
                as: 'Assessment',
                include: [{
                    model: TeacherAssignment,
                    as: 'TeacherAssignment',
                    include: [{ model: Subject, as: 'Subject' }]
                }]
            }],
            order: [["id", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const grade = await this.model.findByPk(id);

        if (!grade) {
            throw new HttpError("Note introuvable", 404);
        }

        await this._assertAssessmentAccess(grade.assessment_id, currentUser);

        return grade;
    }

    async getById(id, currentUser) {
        if (isParent(currentUser)) {
            const grade = await this.model.findByPk(id);
            if (!grade) {
                throw new HttpError("Note introuvable", 404);
            }
            await assertParentCanAccessStudent(grade.student_id, currentUser);
            return grade;
        }
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const grade = await this._findWithAccess(id, currentUser);

        const assessment = await Assessment.findByPk(grade.assessment_id);
        await this._assertScoreValid(assessment, data.score);

        await grade.update({ score: data.score });

        return grade;
    }

    async delete(id, currentUser) {
        const grade = await this._findWithAccess(id, currentUser);
        await grade.destroy();
    }
}

module.exports = new GradeService();
