const { Assessment, TeacherAssignment, Period, AcademicYear, Grade } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;
const isTeacher = (currentUser) => currentUser?.Role?.name === roles.TEACHER;

// Vocabulaire des écoles maliennes : Devoir et Composition.
const ASSESSMENT_TYPES = ['DEVOIR', 'COMPOSITION'];

class AssessmentService extends BaseService {
    constructor() {
        super(Assessment);
    }

    async _assertTeacherAssignmentAccess(teacherAssignmentId, currentUser) {
        const teacherAssignment = await TeacherAssignment.findByPk(teacherAssignmentId);
        if (!teacherAssignment) {
            throw new HttpError("Affectation introuvable", 404);
        }

        if (isSuperAdmin(currentUser)) {
            return teacherAssignment;
        }

        if (isTeacher(currentUser)) {
            if (!currentUser.Teacher || currentUser.Teacher.id !== teacherAssignment.teacher_id) {
                throw new HttpError("Accès refusé", 403);
            }
            return teacherAssignment;
        }

        const academicYear = await AcademicYear.findByPk(teacherAssignment.academic_year_id);
        if (!academicYear || academicYear.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return teacherAssignment;
    }

    async _teacherAssignmentIdsForScope(currentUser) {
        if (isTeacher(currentUser)) {
            const assignments = await TeacherAssignment.findAll({
                where: { teacher_id: currentUser.Teacher?.id ?? 0 },
                attributes: ["id"]
            });
            return assignments.map((a) => a.id);
        }

        const academicYears = await AcademicYear.findAll({
            where: { school_id: currentUser.school_id },
            attributes: ["id"]
        });
        const assignments = await TeacherAssignment.findAll({
            where: { academic_year_id: academicYears.map((a) => a.id) },
            attributes: ["id"]
        });
        return assignments.map((a) => a.id);
    }

    // Message clair plutôt que l'erreur SQL de l'enum (Sequelize ne valide pas
    // lui-même les valeurs d'un ENUM).
    _assertValidType(type) {
        if (type !== undefined && !ASSESSMENT_TYPES.includes(type)) {
            throw new HttpError(`type doit valoir ${ASSESSMENT_TYPES.join(" ou ")}.`, 400);
        }
    }

    async create(data, currentUser) {
        const { teacher_assignment_id, period_id, name, type, coefficient, max_score, date } = data;

        if (!teacher_assignment_id || !period_id || !name) {
            throw new HttpError("teacher_assignment_id, period_id et name sont requis.", 400);
        }
        this._assertValidType(type);

        const teacherAssignment = await this._assertTeacherAssignmentAccess(teacher_assignment_id, currentUser);

        const period = await Period.findByPk(period_id);
        if (!period) {
            throw new HttpError("Période introuvable", 404);
        }
        if (period.academic_year_id !== teacherAssignment.academic_year_id) {
            throw new HttpError("Cette période n'appartient pas à l'année scolaire de l'affectation.", 400);
        }

        return super.create({
            teacher_assignment_id,
            period_id,
            name,
            type: type ?? 'DEVOIR',
            coefficient: coefficient ?? 1,
            max_score: max_score ?? 20,
            date
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.teacher_assignment_id) {
            where.teacher_assignment_id = query.teacher_assignment_id;
            await this._assertTeacherAssignmentAccess(query.teacher_assignment_id, currentUser);
        } else if (!isSuperAdmin(currentUser)) {
            where.teacher_assignment_id = await this._teacherAssignmentIdsForScope(currentUser);
        }

        return this.model.findAll({
            where,
            order: [["date", "DESC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const assessment = await this.model.findByPk(id);

        if (!assessment) {
            throw new HttpError("Évaluation introuvable", 404);
        }

        await this._assertTeacherAssignmentAccess(assessment.teacher_assignment_id, currentUser);

        return assessment;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const assessment = await this._findWithAccess(id, currentUser);

        const { name, type, coefficient, max_score, date } = data;
        this._assertValidType(type);

        await assessment.update({
            name: name ?? assessment.name,
            type: type ?? assessment.type,
            coefficient: coefficient ?? assessment.coefficient,
            max_score: max_score ?? assessment.max_score,
            date: date ?? assessment.date
        });

        return assessment;
    }

    async delete(id, currentUser) {
        const assessment = await this._findWithAccess(id, currentUser);

        // La contrainte DB bloque déjà la suppression (ON DELETE RESTRICT) pour
        // ne pas effacer silencieusement les notes déjà saisies ; ce contrôle
        // applicatif renvoie juste un message clair plutôt qu'une erreur SQL brute.
        const gradeCount = await Grade.count({ where: { assessment_id: assessment.id } });
        if (gradeCount > 0) {
            throw new HttpError(
                "Impossible de supprimer cette évaluation : des notes ont déjà été saisies dessus. Supprimez d'abord ces notes.",
                400
            );
        }

        await assessment.destroy();
    }
}

module.exports = new AssessmentService();
