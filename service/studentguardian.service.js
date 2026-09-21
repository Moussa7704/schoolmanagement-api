const { StudentGuardian, Student, Guardian } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class StudentGuardianService extends BaseService {
    constructor() {
        super(StudentGuardian);
    }

    async _assertStudentAccess(studentId, currentUser) {
        const student = await Student.findByPk(studentId);

        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && student.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return student;
    }

    async attach(data, currentUser) {
        const { student_id, guardian_id, relationship, is_primary_contact } = data;

        if (!student_id || !guardian_id || !relationship) {
            throw new HttpError("student_id, guardian_id et relationship sont requis.", 400);
        }

        await this._assertStudentAccess(student_id, currentUser);

        const guardian = await Guardian.findByPk(guardian_id);
        if (!guardian) {
            throw new HttpError("Tuteur/responsable introuvable", 404);
        }

        const existing = await this.model.findOne({ where: { student_id, guardian_id } });
        if (existing) {
            throw new HttpError("Ce responsable est déjà rattaché à cet élève.", 400);
        }

        return this.model.create({
            student_id,
            guardian_id,
            relationship,
            is_primary_contact: is_primary_contact ?? false
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.student_id) {
            where.student_id = query.student_id;
            await this._assertStudentAccess(query.student_id, currentUser);
        } else if (query.guardian_id) {
            where.guardian_id = query.guardian_id;
        } else if (!isSuperAdmin(currentUser)) {
            const students = await Student.findAll({
                where: { school_id: currentUser.school_id },
                attributes: ["id"]
            });
            where.student_id = students.map((s) => s.id);
        }

        return this.model.findAll({
            where,
            include: [
                { model: Student, attributes: ["id", "first_name", "last_name", "school_id"] },
                { model: Guardian, attributes: ["id", "first_name", "last_name", "phone", "email"] }
            ],
            order: [["id", "ASC"]]
        });
    }

    async detach(id, currentUser) {
        const link = await this.model.findByPk(id);
        if (!link) {
            throw new HttpError("Lien élève-responsable introuvable", 404);
        }

        await this._assertStudentAccess(link.student_id, currentUser);

        await link.destroy();
    }
}

module.exports = new StudentGuardianService();
