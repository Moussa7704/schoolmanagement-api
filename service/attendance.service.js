const { Op } = require("sequelize")
const { Attendance, Student, Class, AcademicYear, TeacherAssignment, Enrollment, Period, sequelize } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");
const permissions = require("../constants/permissions");
const { isParent, getChildStudentIds, assertParentCanAccessStudent } = require("../utils/parentAccess");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;
const isTeacher = (currentUser) => currentUser?.Role?.name === roles.TEACHER;
// Corriger un appel déjà saisi revient à modifier des présences existantes.
const canUpdate = (currentUser) => isSuperAdmin(currentUser)
    || (currentUser?.Role?.Permissions ?? []).some((p) => p.name === permissions.ATTENDANCES_UPDATE);

const SESSIONS = ['MORNING', 'AFTERNOON'];
const STATUSES = ['PRESENT', 'ABSENT', 'LATE'];

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

    async _assertStudentReadAccess(studentId, currentUser) {
        if (isParent(currentUser)) {
            await assertParentCanAccessStudent(studentId, currentUser);
            return;
        }
        if (isSuperAdmin(currentUser)) {
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

        // Un redoublant (REPEATING) est dans la classe comme un élève actif.
        const enrollment = await Enrollment.findOne({
            where: { student_id, class_id, status: ['ACTIVE', 'REPEATING'] }
        });
        if (!enrollment) {
            throw new HttpError("Cet élève n'est pas inscrit dans cette classe.", 400);
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

    // Appel d'une classe : enregistre en une fois le statut de chaque élève pour
    // une date et une séance. Une présence déjà saisie pour ce créneau est mise
    // à jour (correction de l'appel) plutôt que dupliquée. Tout ou rien : une
    // seule ligne invalide annule l'ensemble.
    async rollCall(data, currentUser) {
        const { class_id, date, session, entries } = data;

        if (!class_id || !date || !session) {
            throw new HttpError("class_id, date et session sont requis.", 400);
        }
        if (!SESSIONS.includes(session)) {
            throw new HttpError(`session doit valoir ${SESSIONS.join(" ou ")}.`, 400);
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            throw new HttpError("entries doit contenir au moins un élève.", 400);
        }

        await this._assertClassAccess(class_id, currentUser);

        const studentIds = entries.map((e) => e.student_id);
        if (studentIds.some((id) => !id) || new Set(studentIds).size !== studentIds.length) {
            throw new HttpError("Chaque élève doit apparaître une seule fois, avec son student_id.", 400);
        }
        for (const entry of entries) {
            if (entry.status !== undefined && !STATUSES.includes(entry.status)) {
                throw new HttpError(`status doit valoir ${STATUSES.join(", ")}.`, 400);
            }
        }

        // Tous les élèves doivent être dans la classe (actifs ou redoublants).
        const enrolled = await Enrollment.findAll({
            where: { class_id, student_id: studentIds, status: ['ACTIVE', 'REPEATING'] },
            attributes: ["student_id"]
        });
        const enrolledIds = new Set(enrolled.map((e) => e.student_id));
        const notEnrolled = studentIds.filter((id) => !enrolledIds.has(id));
        if (notEnrolled.length) {
            throw new HttpError(`Élève(s) non inscrit(s) dans cette classe : ${notEnrolled.join(", ")}.`, 400);
        }

        const existing = await this.model.findAll({ where: { class_id, date, session, student_id: studentIds } });
        const existingByStudent = new Map(existing.map((a) => [a.student_id, a]));
        if (existing.length && !canUpdate(currentUser)) {
            throw new HttpError("L'appel de ce créneau existe déjà et vous n'avez pas le droit de le modifier.", 403);
        }

        const t = await sequelize.transaction();
        try {
            const saved = [];
            for (const entry of entries) {
                const values = {
                    status: entry.status ?? 'PRESENT',
                    // Une absence justifiée n'a de sens que si l'élève n'est pas présent.
                    justified: (entry.status ?? 'PRESENT') === 'PRESENT' ? false : Boolean(entry.justified),
                    reason: entry.reason || null
                };
                const current = existingByStudent.get(entry.student_id);
                saved.push(current
                    ? await current.update(values, { transaction: t })
                    : await this.model.create({ student_id: entry.student_id, class_id, date, session, ...values }, { transaction: t }));
            }
            await t.commit();
            return {
                created: entries.length - existing.length,
                updated: existing.length,
                attendances: saved
            };
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    // Annule l'appel d'un créneau fait par erreur (ex. mauvaise séance choisie) :
    // supprime en une fois toutes les présences de la classe pour cette date et
    // cette séance.
    async deleteRollCall(query, currentUser) {
        const { class_id, date, session } = query;

        await this._assertClassAccess(class_id, currentUser);

        const deleted = await this.model.destroy({ where: { class_id, date, session } });
        if (!deleted) {
            throw new HttpError("Aucun appel enregistré pour ce créneau.", 404);
        }

        return { deleted };
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.class_id) {
            where.class_id = query.class_id;
            await this._assertClassAccess(query.class_id, currentUser);
        } else if (query.student_id) {
            where.student_id = query.student_id;
            await this._assertStudentReadAccess(query.student_id, currentUser);
        } else if (isParent(currentUser)) {
            where.student_id = await getChildStudentIds(currentUser);
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
        if (isParent(currentUser)) {
            const attendance = await this.model.findByPk(id);
            if (!attendance) {
                throw new HttpError("Présence introuvable", 404);
            }
            await assertParentCanAccessStudent(attendance.student_id, currentUser);
            return attendance;
        }
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
        await this._assertStudentReadAccess(student_id, currentUser);

        const period = await Period.findByPk(period_id);
        if (!period) {
            throw new HttpError("Période introuvable", 404);
        }

        const enrollment = await Enrollment.findOne({
            where: { student_id, academic_year_id: period.academic_year_id, status: ['ACTIVE', 'REPEATING'] }
        });
        if (!enrollment) {
            throw new HttpError("Aucune inscription pour cet élève sur cette année scolaire.", 400);
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
