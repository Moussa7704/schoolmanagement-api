const { Student, User, Role, School, sequelize } = require("../models")
const bcrypt = require("bcrypt");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class StudentService extends BaseService {
    constructor() {
        super(Student);
    }

    async create(data, currentUser) {
        const { student_number, first_name, last_name, date_of_birth, gender } = data;
        let { school_id } = data;

        if (!isSuperAdmin(currentUser)) {
            school_id = currentUser.school_id;
        }

        if (!school_id || !first_name || !last_name) {
            throw new HttpError("school_id, first_name et last_name sont requis.", 400);
        }

        const school = await School.findByPk(school_id);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }

        return super.create({
            school_id,
            student_number,
            first_name,
            last_name,
            date_of_birth,
            gender
        });
    }

    async list(currentUser) {
        const where = {};

        if (!isSuperAdmin(currentUser)) {
            where.school_id = currentUser.school_id;
        }

        return this.model.findAll({
            where,
            order: [["id", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const student = await this.model.findByPk(id);

        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && student.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return student;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const student = await this._findWithAccess(id, currentUser);

        const { student_number, first_name, last_name, date_of_birth, gender } = data;

        await student.update({
            student_number: student_number ?? student.student_number,
            first_name: first_name ?? student.first_name,
            last_name: last_name ?? student.last_name,
            date_of_birth: date_of_birth ?? student.date_of_birth,
            gender: gender ?? student.gender
        });

        return student;
    }

    async delete(id, currentUser) {
        const student = await this._findWithAccess(id, currentUser);

        const t = await sequelize.transaction();
        try {
            const userId = student.user_id;
            await student.destroy({ transaction: t });
            if (userId) {
                await User.destroy({ where: { id: userId }, transaction: t });
            }
            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async grantAccess(id, data, currentUser) {
        const student = await this._findWithAccess(id, currentUser);

        if (student.user_id) {
            throw new HttpError("Cet élève possède déjà un compte de connexion.", 400);
        }

        const { email, password } = data;
        if (!email || !password) {
            throw new HttpError("email et password sont requis.", 400);
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new HttpError("Un utilisateur possède déjà cette adresse email.", 400);
        }

        const studentRole = await Role.findOne({ where: { name: roles.STUDENT } });
        if (!studentRole) {
            throw new HttpError("Le rôle STUDENT n'existe pas.", 500);
        }

        const t = await sequelize.transaction();
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                school_id: student.school_id,
                role_id: studentRole.id,
                first_name: student.first_name,
                last_name: student.last_name,
                email,
                password: hashedPassword,
                status: 'active'
            }, { transaction: t });

            await student.update({ user_id: user.id }, { transaction: t });

            await t.commit();

            return student;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

module.exports = new StudentService();
