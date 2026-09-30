const { Schedule, TeacherAssignment, Class, Teacher, Subject, AcademicYear, User } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");
const assessmentService = require("./assessment.service");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

const ASSIGNMENT_INCLUDE = {
    model: TeacherAssignment,
    as: 'TeacherAssignment',
    include: [
        // Nom de l'enseignant inclus : un enseignant qui consulte l'emploi du temps
        // d'une de ses classes y voit aussi les cours de ses collègues, sans avoir
        // le droit de lire la liste des enseignants.
        { model: Teacher, as: 'Teacher', include: [{ model: User, as: 'User', attributes: ['first_name', 'last_name'] }] },
        { model: Class, as: 'Class' },
        { model: Subject, as: 'Subject' }
    ]
};

// Chevauchement de deux intervalles [startA, endA) / [startB, endB) — les heures
// sont des chaînes 'HH:MM:SS' (type TIME), la comparaison lexicographique suffit.
const overlaps = (startA, endA, startB, endB) => startA < endB && startB < endA;

class ScheduleService extends BaseService {
    constructor() {
        super(Schedule);
    }

    async _assertClassAccess(classId, currentUser) {
        const classRecord = await Class.findByPk(classId);
        if (!classRecord) {
            throw new HttpError("Classe introuvable", 404);
        }
        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        if (!isSuperAdmin(currentUser) && academicYear.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }
    }

    async _assertTeacherAccess(teacherId, currentUser) {
        const teacher = await Teacher.findByPk(teacherId);
        if (!teacher) {
            throw new HttpError("Enseignant introuvable", 404);
        }
        if (!isSuperAdmin(currentUser) && teacher.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }
    }

    async _assertNoConflict({ teacher_assignment_id, day_of_week, start_time, end_time }, excludeId = null) {
        const assignment = await TeacherAssignment.findByPk(teacher_assignment_id);

        const sameDaySlots = await this.model.findAll({
            where: { day_of_week },
            include: [{ model: TeacherAssignment, as: 'TeacherAssignment' }]
        });

        for (const slot of sameDaySlots) {
            if (excludeId && slot.id === excludeId) {
                continue;
            }
            if (!overlaps(start_time, end_time, slot.start_time, slot.end_time)) {
                continue;
            }
            if (slot.TeacherAssignment.class_id === assignment.class_id) {
                throw new HttpError("Cette classe a déjà un cours sur ce créneau.", 400);
            }
            if (slot.TeacherAssignment.teacher_id === assignment.teacher_id) {
                throw new HttpError("Cet enseignant a déjà un cours sur ce créneau.", 400);
            }
        }
    }

    async create(data, currentUser) {
        const { teacher_assignment_id, day_of_week, start_time, end_time, room } = data;

        if (!teacher_assignment_id || !day_of_week || !start_time || !end_time) {
            throw new HttpError("teacher_assignment_id, day_of_week, start_time et end_time sont requis.", 400);
        }
        if (start_time >= end_time) {
            throw new HttpError("L'heure de fin doit être après l'heure de début.", 400);
        }

        await assessmentService._assertTeacherAssignmentAccess(teacher_assignment_id, currentUser);
        await this._assertNoConflict({ teacher_assignment_id, day_of_week, start_time, end_time });

        return super.create({ teacher_assignment_id, day_of_week, start_time, end_time, room });
    }

    async list(currentUser, query = {}) {
        const where = {};
        const assignmentWhere = {};

        if (query.teacher_assignment_id) {
            where.teacher_assignment_id = query.teacher_assignment_id;
            await assessmentService._assertTeacherAssignmentAccess(query.teacher_assignment_id, currentUser);
        } else if (query.class_id) {
            await this._assertClassAccess(query.class_id, currentUser);
            assignmentWhere.class_id = query.class_id;
        } else if (query.teacher_id) {
            await this._assertTeacherAccess(query.teacher_id, currentUser);
            assignmentWhere.teacher_id = query.teacher_id;
        } else if (!isSuperAdmin(currentUser)) {
            where.teacher_assignment_id = await assessmentService._teacherAssignmentIdsForScope(currentUser);
        }

        return this.model.findAll({
            where,
            include: [{
                ...ASSIGNMENT_INCLUDE,
                where: Object.keys(assignmentWhere).length ? assignmentWhere : undefined
            }],
            order: [["day_of_week", "ASC"], ["start_time", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const schedule = await this.model.findByPk(id, { include: [ASSIGNMENT_INCLUDE] });

        if (!schedule) {
            throw new HttpError("Créneau introuvable", 404);
        }

        await assessmentService._assertTeacherAssignmentAccess(schedule.teacher_assignment_id, currentUser);

        return schedule;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const schedule = await this._findWithAccess(id, currentUser);

        const teacher_assignment_id = data.teacher_assignment_id ?? schedule.teacher_assignment_id;
        const day_of_week = data.day_of_week ?? schedule.day_of_week;
        const start_time = data.start_time ?? schedule.start_time;
        const end_time = data.end_time ?? schedule.end_time;

        if (start_time >= end_time) {
            throw new HttpError("L'heure de fin doit être après l'heure de début.", 400);
        }
        if (data.teacher_assignment_id) {
            await assessmentService._assertTeacherAssignmentAccess(teacher_assignment_id, currentUser);
        }
        await this._assertNoConflict({ teacher_assignment_id, day_of_week, start_time, end_time }, schedule.id);

        await schedule.update({
            teacher_assignment_id,
            day_of_week,
            start_time,
            end_time,
            room: data.room ?? schedule.room
        });

        return schedule;
    }

    async delete(id, currentUser) {
        const schedule = await this._findWithAccess(id, currentUser);
        await schedule.destroy();
    }
}

module.exports = new ScheduleService();
