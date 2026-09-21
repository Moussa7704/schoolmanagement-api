const { TeacherAssignment, Teacher, Class, Subject, AcademicYear } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class TeacherAssignmentService extends BaseService {
    constructor() {
        super(TeacherAssignment);
    }

    async _assertClassAccess(classId, currentUser) {
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
            throw new HttpError("Classe introuvable", 404);
        }

        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        if (!academicYear) {
            throw new HttpError("Année scolaire introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && academicYear.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return { classRecord, academicYear };
    }

    async create(data, currentUser) {
        const { teacher_id, class_id, subject_id } = data;

        if (!teacher_id || !class_id || !subject_id) {
            throw new HttpError("teacher_id, class_id et subject_id sont requis.", 400);
        }

        const { classRecord, academicYear } = await this._assertClassAccess(class_id, currentUser);

        const teacher = await Teacher.findByPk(teacher_id);
        if (!teacher) {
            throw new HttpError("Enseignant introuvable", 404);
        }
        if (teacher.school_id !== academicYear.school_id) {
            throw new HttpError("Cet enseignant n'appartient pas à l'école de cette classe.", 400);
        }

        const subject = await Subject.findByPk(subject_id);
        if (!subject) {
            throw new HttpError("Matière introuvable", 404);
        }
        if (subject.school_id !== academicYear.school_id) {
            throw new HttpError("Cette matière n'appartient pas à l'école de cette classe.", 400);
        }

        const existing = await this.model.findOne({ where: { class_id, subject_id } });
        if (existing) {
            throw new HttpError("Un enseignant est déjà affecté à cette matière pour cette classe.", 400);
        }

        return super.create({
            teacher_id,
            class_id,
            subject_id,
            academic_year_id: classRecord.academic_year_id
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.class_id) {
            where.class_id = query.class_id;
            await this._assertClassAccess(query.class_id, currentUser);
        } else if (query.teacher_id) {
            where.teacher_id = query.teacher_id;
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

        return this.model.findAll({
            where,
            order: [["id", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const assignment = await this.model.findByPk(id);

        if (!assignment) {
            throw new HttpError("Affectation introuvable", 404);
        }

        await this._assertClassAccess(assignment.class_id, currentUser);

        return assignment;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async delete(id, currentUser) {
        const assignment = await this._findWithAccess(id, currentUser);
        await assignment.destroy();
    }
}

module.exports = new TeacherAssignmentService();
