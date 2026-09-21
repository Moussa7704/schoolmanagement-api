const { Op } = require("sequelize")
const { Attendance, Student, Class, AcademicYear, TeacherAssignment, Enrollment, Period } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;
const isTeacher = (currentUser) => currentUser?.Role?.name === roles.TEACHER;

class AttendanceService extends BaseService {
    constructor() {
        super(Attendance);
    }

    async _assertClassAccess(classId, currentUser) {
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
            throw new HttpError("Classe introuvable", 404);
        }

        if (isSuperAdmin(currentUser)) {
            return classRecord;
        }

        if (isTeacher(currentUser)) {
            const assignment = await TeacherAssignment.findOne({
                where: { class_id: classId, teacher_id: currentUser.Teacher?.id ?? 0 }
            });
            if (!assignment) {
                throw new HttpError("Accès refusé", 403);
            }
            return classRecord;
        }

        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        if (!academicYear || academicYear.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return classRecord;
    }

    async _classIdsForScope(currentUser) {
        if (isTeacher(currentUser)) {
            const assignments = await TeacherAssignment.findAll({
                where: { teacher_id: currentUser.Teacher?.id ?? 0 },
                attributes: ["class_id"]
            });
            return [...new Set(assignments.map((a) => a.class_id))];
        }

        const academicYears = await AcademicYear.findAll({
            where: { school_id: currentUser.school_id },
            attributes: ["id"]
        });
        const classes = await Class.findAll({
            where: { academic_year_id: academicYears.map((a) => a.id) },
            attributes: ["id"]
        });
        return classes.map((c) => c.id);
    }

    async create(data, currentUser) {
        const { student_id, class_id, date, session, status, justified, reason } = data;

        if (!student_id || !class_id || !date || !session) {
            throw new HttpError("student_id, class_id, date et session sont requis.", 400);
        }

        await this._assertClassAccess(class_id, currentUser);

        const student = await Student.findByPk(student_id);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }

        const enrollment = await Enrollment.findOne({
            where: { student_id, class_id, status: 'ACTIVE' }
        });
        if (!enrollment) {
            throw new HttpError("Cet élève n'est pas inscrit activement dans cette classe.", 400);
        }

        const existing = await this.model.findOne({ where: { student_id, class_id, date, session } });
        if (existing) {
            throw new HttpError("Une présence existe déjà pour cet élève, cette classe, cette date et cette séance.", 400);
        }

        return super.create({
            student_id,
            class_id,
            date,
            session,
            status: status ?? 'PRESENT',
            justified: justified ?? false,
            reason
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
            where.class_id = await this._classIdsForScope(currentUser);
        }

        return this.model.findAll({
            where,
            order: [["date", "DESC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const attendance = await this.model.findByPk(id);

        if (!attendance) {
            throw new HttpError("Présence introuvable", 404);
        }

        await this._assertClassAccess(attendance.class_id, currentUser);

        return attendance;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const attendance = await this._findWithAccess(id, currentUser);

        const { status, justified, reason } = data;

        await attendance.update({
            status: status ?? attendance.status,
            justified: justified ?? attendance.justified,
            reason: reason ?? attendance.reason
        });

        return attendance;
    }

    async delete(id, currentUser) {
        const attendance = await this._findWithAccess(id, currentUser);
        await attendance.destroy();
    }

    async stats(query, currentUser) {
        const { student_id, period_id } = query;

        if (!student_id || !period_id) {
            throw new HttpError("student_id et period_id sont requis.", 400);
        }

        const student = await Student.findByPk(student_id);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }
        if (!isSuperAdmin(currentUser) && student.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

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

        const attendances = await this.model.findAll({
            where: {
                student_id,
                class_id: enrollment.class_id,
                date: { [Op.between]: [period.start_date, period.end_date] }
            }
        });

        const total_sessions = attendances.length;
        const present_count = attendances.filter((a) => a.status === 'PRESENT').length;
        const absent_count = attendances.filter((a) => a.status === 'ABSENT').length;
        const late_count = attendances.filter((a) => a.status === 'LATE').length;
        const absenteeism_rate = total_sessions ? Number((absent_count / total_sessions).toFixed(2)) : null;

        return {
            student_id: Number(student_id),
            period_id: Number(period_id),
            total_sessions,
            present_count,
            absent_count,
            late_count,
            absenteeism_rate
        };
    }
}

module.exports = new AttendanceService();
