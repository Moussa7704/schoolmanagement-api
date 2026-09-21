const { Enrollment, Student, Class, AcademicYear } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class EnrollmentService extends BaseService {
    constructor() {
        super(Enrollment);
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
        const { student_id, class_id, status, enrollment_date, registration_number } = data;

        if (!student_id || !class_id) {
            throw new HttpError("student_id et class_id sont requis.", 400);
        }

        const { classRecord, academicYear } = await this._assertClassAccess(class_id, currentUser);

        const student = await Student.findByPk(student_id);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }
        if (student.school_id !== academicYear.school_id) {
            throw new HttpError("Cet élève n'appartient pas à l'école de cette classe.", 400);
        }

        const existingInClass = await this.model.findOne({ where: { student_id, class_id } });
        if (existingInClass) {
            throw new HttpError("Cet élève est déjà inscrit dans cette classe.", 400);
        }

        const resolvedStatus = status ?? 'ACTIVE';
        if (resolvedStatus === 'ACTIVE') {
            const existingActive = await this.model.findOne({
                where: {
                    student_id,
                    academic_year_id: classRecord.academic_year_id,
                    status: 'ACTIVE'
                }
            });
            if (existingActive) {
                throw new HttpError("Cet élève a déjà une inscription active pour cette année scolaire.", 400);
            }
        }

        return super.create({
            student_id,
            class_id,
            academic_year_id: classRecord.academic_year_id,
            status: resolvedStatus,
            enrollment_date,
            registration_number
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.class_id) {
            where.class_id = query.class_id;
            await this._assertClassAccess(query.class_id, currentUser);
        } else if (query.student_id) {
            where.student_id = query.student_id;
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
        const enrollment = await this.model.findByPk(id);

        if (!enrollment) {
            throw new HttpError("Inscription introuvable", 404);
        }

        await this._assertClassAccess(enrollment.class_id, currentUser);

        return enrollment;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const enrollment = await this._findWithAccess(id, currentUser);

        const { status, enrollment_date, registration_number } = data;

        if (status && status === 'ACTIVE' && enrollment.status !== 'ACTIVE') {
            const existingActive = await this.model.findOne({
                where: {
                    student_id: enrollment.student_id,
                    academic_year_id: enrollment.academic_year_id,
                    status: 'ACTIVE'
                }
            });
            if (existingActive) {
                throw new HttpError("Cet élève a déjà une inscription active pour cette année scolaire.", 400);
            }
        }

        await enrollment.update({
            status: status ?? enrollment.status,
            enrollment_date: enrollment_date ?? enrollment.enrollment_date,
            registration_number: registration_number ?? enrollment.registration_number
        });

        return enrollment;
    }

    async delete(id, currentUser) {
        const enrollment = await this._findWithAccess(id, currentUser);
        await enrollment.destroy();
    }
}

module.exports = new EnrollmentService();
