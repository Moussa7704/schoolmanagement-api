const { Teacher, User, Role, School, sequelize } = require("../models")
const bcrypt = require("bcrypt");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class TeacherService extends BaseService {
    constructor() {
        super(Teacher);
    }

    async create(data, currentUser) {
        const { first_name, last_name, email, password, specialty, hire_date, employee_number } = data;
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
                employee_number
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

    async update(id, data, currentUser) {
        const teacher = await this._findWithAccess(id, currentUser);

        const { specialty, hire_date, employee_number } = data;

        await teacher.update({
            specialty: specialty ?? teacher.specialty,
            hire_date: hire_date ?? teacher.hire_date,
            employee_number: employee_number ?? teacher.employee_number
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
