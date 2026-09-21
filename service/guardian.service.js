const { Guardian, User, Role, sequelize } = require("../models")
const bcrypt = require("bcrypt");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

class GuardianService extends BaseService {
    constructor() {
        super(Guardian);
    }

    async create(data) {
        const { first_name, last_name, phone, email, address } = data;

        if (!first_name || !last_name) {
            throw new HttpError("first_name et last_name sont requis.", 400);
        }

        return super.create({ first_name, last_name, phone, email, address });
    }

    async list() {
        return this.model.findAll({ order: [["id", "ASC"]] });
    }

    async getById(id) {
        const guardian = await this.model.findByPk(id);
        if (!guardian) {
            throw new HttpError("Tuteur/responsable introuvable", 404);
        }
        return guardian;
    }

    async update(id, data) {
        const guardian = await this.getById(id);

        const { first_name, last_name, phone, email, address } = data;

        await guardian.update({
            first_name: first_name ?? guardian.first_name,
            last_name: last_name ?? guardian.last_name,
            phone: phone ?? guardian.phone,
            email: email ?? guardian.email,
            address: address ?? guardian.address
        });

        return guardian;
    }

    async delete(id) {
        const guardian = await this.getById(id);

        const t = await sequelize.transaction();
        try {
            const userId = guardian.user_id;
            await guardian.destroy({ transaction: t });
            if (userId) {
                await User.destroy({ where: { id: userId }, transaction: t });
            }
            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async grantAccess(id, data) {
        const guardian = await this.getById(id);

        if (guardian.user_id) {
            throw new HttpError("Ce tuteur/responsable possède déjà un compte de connexion.", 400);
        }

        const { email, password } = data;
        if (!email || !password) {
            throw new HttpError("email et password sont requis.", 400);
        }

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            throw new HttpError("Un utilisateur possède déjà cette adresse email.", 400);
        }

        const parentRole = await Role.findOne({ where: { name: roles.PARENT } });
        if (!parentRole) {
            throw new HttpError("Le rôle PARENT n'existe pas.", 500);
        }

        const t = await sequelize.transaction();
        try {
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await User.create({
                school_id: null,
                role_id: parentRole.id,
                first_name: guardian.first_name,
                last_name: guardian.last_name,
                email,
                password: hashedPassword,
                status: 'active'
            }, { transaction: t });

            await guardian.update({ user_id: user.id }, { transaction: t });

            await t.commit();

            return guardian;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

module.exports = new GuardianService();
