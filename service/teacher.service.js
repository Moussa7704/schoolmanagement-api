const {
    Teacher, User, Role, School, TeacherAssignment, Class, Subject, Period, Enrollment, Student, sequelize
} = require("../models")
const bcrypt = require("bcrypt");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class TeacherService extends BaseService {
    constructor() {
        super(Teacher);
    }

    // Genre facultatif : "M", "F", ou vide (non renseigné).
    _parseGender(value) {
        if (value === undefined || value === null || value === "") return null;
        if (value !== "M" && value !== "F") {
            throw new HttpError('gender doit valoir "M" ou "F".', 400);
        }
        return value;
    }

    async create(data, currentUser) {
        const { first_name, last_name, email, password, specialty, hire_date, employee_number } = data;
        const gender = this._parseGender(data.gender);
        let { school_id } = data;

        if (!isSuperAdmin(currentUser)) {
            school_id = currentUser.school_id;
        }

        if (!school_id || !first_name || !last_name || !email || !password) {
            throw new HttpError("school_id, first_name, last_name, email et password sont requis.", 400);
        }

        const school = await School.findByPk(school_id);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new HttpError("Un utilisateur possède déjà cette adresse email.", 400);
        }

        const teacherRole = await Role.findOne({ where: { name: roles.TEACHER } });
        if (!teacherRole) {
            throw new HttpError("Le rôle TEACHER n'existe pas.", 500);
        }

        const t = await sequelize.transaction();
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                school_id,
                role_id: teacherRole.id,
                first_name,
                last_name,
                phone: data.phone,
                email,
                password: hashedPassword,
                status: 'active'
            }, { transaction: t });

            const teacher = await this.model.create({
                user_id: user.id,
                school_id,
                specialty,
                hire_date,
                employee_number,
                gender
            }, { transaction: t });

            await t.commit();

            return this.getById(teacher.id, currentUser);
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async list(currentUser) {
        const where = {};

        if (!isSuperAdmin(currentUser)) {
            where.school_id = currentUser.school_id;
        }

        return this.model.findAll({
            where,
            include: [{ model: User, as: "User", attributes: { exclude: ["password"] } }],
            order: [["id", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const teacher = await this.model.findByPk(id, {
            include: [{ model: User, as: "User", attributes: { exclude: ["password"] } }]
        });

        if (!teacher) {
            throw new HttpError("Enseignant introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && teacher.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return teacher;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    // Espace de travail de l'enseignant connecté : uniquement SES affectations
    // (classe + matière), les périodes de leurs années scolaires et les élèves
    // inscrits dans SES classes. Remplace, pour un TEACHER, les listes générales
    // (classes, élèves, inscriptions…) qu'il n'a pas le droit de lire et qui
    // exposeraient toute l'école.
    async getMyClasses(currentUser) {
        const teacher = currentUser?.Teacher;
        if (!teacher) {
            throw new HttpError("Réservé aux comptes enseignants.", 403);
        }

        const assignments = await TeacherAssignment.findAll({
            where: { teacher_id: teacher.id },
            include: [
                { model: Class, as: "Class" },
                { model: Subject, as: "Subject" }
            ],
            order: [["id", "ASC"]]
        });

        const uniqueBy = (items) => [...new Map(items.filter(Boolean).map((item) => [item.id, item])).values()];
        const classes = uniqueBy(assignments.map((a) => a.Class));
        const subjects = uniqueBy(assignments.map((a) => a.Subject));
        const classIds = classes.map((c) => c.id);
        const academicYearIds = [...new Set(assignments.map((a) => a.academic_year_id))];

        const [periods, enrollments] = await Promise.all([
            Period.findAll({ where: { academic_year_id: academicYearIds }, order: [["start_date", "ASC"]] }),
            Enrollment.findAll({
                where: { class_id: classIds, status: ['ACTIVE', 'REPEATING'] },
                include: [{ model: Student, attributes: ["id", "first_name", "last_name", "student_number", "gender"] }]
            })
        ]);

        const students = uniqueBy(enrollments.map((e) => e.Student));

        return {
            teacher: {
                id: teacher.id,
                user_id: teacher.user_id,
                school_id: teacher.school_id,
                User: { first_name: currentUser.first_name, last_name: currentUser.last_name }
            },
            assignments: assignments.map((a) => ({
                id: a.id,
                teacher_id: a.teacher_id,
                class_id: a.class_id,
                subject_id: a.subject_id,
                academic_year_id: a.academic_year_id
            })),
            classes,
            subjects,
            periods,
            students,
            enrollments: enrollments.map((e) => ({
                id: e.id,
                student_id: e.student_id,
                class_id: e.class_id,
                academic_year_id: e.academic_year_id,
                status: e.status,
                enrollment_date: e.enrollment_date,
                registration_number: e.registration_number
            }))
        };
    }

    async update(id, data, currentUser) {
        const teacher = await this._findWithAccess(id, currentUser);

        const { specialty, hire_date, employee_number } = data;

        await teacher.update({
            specialty: specialty ?? teacher.specialty,
            hire_date: hire_date ?? teacher.hire_date,
            employee_number: employee_number ?? teacher.employee_number,
            // Absent = inchangé ; null ou "" = effacé.
            gender: data.gender === undefined ? teacher.gender : this._parseGender(data.gender)
        });

        return teacher;
    }

    async delete(id, currentUser) {
        const teacher = await this._findWithAccess(id, currentUser);

        const t = await sequelize.transaction();
        try {
            const userId = teacher.user_id;
            await teacher.destroy({ transaction: t });
            await User.destroy({ where: { id: userId }, transaction: t });
            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

module.exports = new TeacherService();
