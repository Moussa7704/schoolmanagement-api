const { Guardian, User, Role, Student, Class, StudentGuardian, sequelize } = require("../models")
const bcrypt = require("bcrypt");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

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

    // Guardian n'a pas de school_id propre (un tuteur peut avoir des enfants dans
    // plusieurs écoles) — la "propriété" ne se déduit que via ses rattachements
    // StudentGuardian. Un tuteur jamais rattaché n'est encore revendiqué par
    // aucune école : on le laisse visible (sinon impossible de le retrouver pour
    // l'attacher à un premier élève juste après sa création).
    async _hasAccessToGuardian(guardianId, currentUser) {
        if (isSuperAdmin(currentUser)) {
            return true;
        }

        const links = await StudentGuardian.findAll({
            where: { guardian_id: guardianId },
            include: [{ model: Student, attributes: ["school_id"] }]
        });

        if (links.length === 0) {
            return true;
        }

        return links.some((link) => link.Student?.school_id === currentUser.school_id);
    }

    async _assertGuardianAccess(guardian, currentUser) {
        const allowed = await this._hasAccessToGuardian(guardian.id, currentUser);
        if (!allowed) {
            throw new HttpError("Accès refusé", 403);
        }
    }

    async list(currentUser) {
        const guardians = await this.model.findAll({
            include: [{ model: User, as: "User", attributes: { exclude: ["password"] } }],
            order: [["id", "ASC"]]
        });

        if (isSuperAdmin(currentUser)) {
            return guardians;
        }

        const links = await StudentGuardian.findAll({
            include: [{ model: Student, attributes: ["school_id"] }]
        });
        const linkedGuardianIds = new Set(links.map((l) => l.guardian_id));
        const ownSchoolGuardianIds = new Set(
            links.filter((l) => l.Student?.school_id === currentUser.school_id).map((l) => l.guardian_id)
        );

        return guardians.filter((g) => !linkedGuardianIds.has(g.id) || ownSchoolGuardianIds.has(g.id));
    }

    async getById(id, currentUser) {
        const guardian = await this.model.findByPk(id, {
            include: [{ model: User, as: "User", attributes: { exclude: ["password"] } }]
        });
        if (!guardian) {
            throw new HttpError("Tuteur/responsable introuvable", 404);
        }
        await this._assertGuardianAccess(guardian, currentUser);
        return guardian;
    }

    async update(id, data, currentUser) {
        const guardian = await this.getById(id, currentUser);

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

    async delete(id, currentUser) {
        const guardian = await this.getById(id, currentUser);

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

    async grantAccess(id, data, currentUser) {
        const guardian = await this.getById(id, currentUser);

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

    async getMyChildren(currentUser) {
        if (!currentUser?.Guardian?.id) {
            throw new HttpError("Ce compte n'est pas rattaché à un profil tuteur/responsable.", 400);
        }

        const links = await StudentGuardian.findAll({
            where: { guardian_id: currentUser.Guardian.id },
            include: [{
                model: Student,
                include: [{
                    model: Class,
                    as: "Classes",
                    through: { where: { status: 'ACTIVE' } },
                    required: false
                }]
            }]
        });

        return links
            .filter((link) => link.Student)
            .map((link) => {
                const student = link.Student;
                const activeClass = student.Classes?.[0] ?? null;

                return {
                    student_id: student.id,
                    first_name: student.first_name,
                    last_name: student.last_name,
                    student_number: student.student_number,
                    relationship: link.relationship,
                    is_primary_contact: link.is_primary_contact,
                    class_id: activeClass?.id ?? null,
                    class_name: activeClass?.name ?? null
                };
            });
    }
}

module.exports = new GuardianService();
