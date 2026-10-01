const { User, Role, School, Teacher, Student, Guardian, StudentGuardian } = require("../models")
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

// Rôles gérables via /users : comptes de connexion "directs", sans fiche métier dédiée.
// TEACHER passe par /teachers, STUDENT/PARENT par /students/:id/grant-access et
// /guardians/:id/grant-access, et SUPER_ADMIN n'est jamais créé via cette route.
const MANAGEABLE_ROLES = [roles.SCHOOL_ADMIN, roles.DIRECTOR, roles.ACCOUNTANT, roles.STAFF];

const SAFE_ATTRIBUTES = { exclude: ["password"] };

// Rôle et nom de l'école de chaque utilisateur (colonne « École » de la liste).
const USER_INCLUDE = [
    { model: Role, as: "Role" },
    { model: School, as: "School", attributes: ["id", "name"] }
];

class UserService extends BaseService {
    constructor() {
        super(User);
    }

    async create(data, currentUser) {
        const { first_name, last_name, email, password, phone, role: roleName } = data;
        let { school_id } = data;

        if (!isSuperAdmin(currentUser)) {
            school_id = currentUser.school_id;
        }

        if (!school_id || !first_name || !last_name || !email || !password || !roleName) {
            throw new HttpError("school_id, first_name, last_name, email, password et role sont requis.", 400);
        }

        if (!MANAGEABLE_ROLES.includes(roleName)) {
            throw new HttpError(
                `Rôle non géré par cette route. Rôles autorisés : ${MANAGEABLE_ROLES.join(", ")}. ` +
                `Pour TEACHER utilisez /teachers, pour STUDENT/PARENT utilisez grant-access.`,
                400
            );
        }

        const school = await School.findByPk(school_id);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }

        const existing = await this.model.findOne({ where: { email } });
        if (existing) {
            throw new HttpError("Un utilisateur possède déjà cette adresse email.", 400);
        }

        const role = await Role.findOne({ where: { name: roleName } });
        if (!role) {
            throw new HttpError("Rôle introuvable", 404);
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.model.create({
            school_id,
            role_id: role.id,
            first_name,
            last_name,
            phone,
            email,
            password: hashedPassword,
            status: 'active'
        });

        return this.getById(user.id, currentUser);
    }

    // Comptes parents (PARENT) dont au moins un enfant est élève de l'école.
    // Un parent n'est rattaché à aucune école (school_id vide) : ses enfants
    // peuvent être dans plusieurs écoles, et chacune doit pouvoir le voir.
    async _parentUserIdsForSchool(schoolId) {
        if (!schoolId) return [];
        const students = await Student.findAll({ where: { school_id: schoolId }, attributes: ["id"] });
        if (!students.length) return [];
        const links = await StudentGuardian.findAll({
            where: { student_id: students.map((s) => s.id) },
            attributes: ["guardian_id"]
        });
        if (!links.length) return [];
        const guardians = await Guardian.findAll({
            where: { id: [...new Set(links.map((l) => l.guardian_id))], user_id: { [Op.ne]: null } },
            attributes: ["user_id"]
        });
        return [...new Set(guardians.map((g) => g.user_id))];
    }

    async list(currentUser) {
        const where = {};

        if (!isSuperAdmin(currentUser)) {
            const parentUserIds = await this._parentUserIdsForSchool(currentUser.school_id);
            where[Op.or] = [
                { school_id: currentUser.school_id },
                ...(parentUserIds.length ? [{ id: parentUserIds }] : [])
            ];
        }

        return this.model.findAll({
            where,
            include: USER_INCLUDE,
            attributes: SAFE_ATTRIBUTES,
            order: [["id", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const user = await this.model.findByPk(id, {
            include: USER_INCLUDE,
            attributes: SAFE_ATTRIBUTES
        });

        if (!user) {
            throw new HttpError("Utilisateur introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && user.school_id !== currentUser.school_id) {
            // Exception : parent sans école d'un élève de cette école (voir _parentUserIdsForSchool).
            const isParentOfThisSchool = user.school_id === null
                && (await this._parentUserIdsForSchool(currentUser.school_id)).includes(user.id);
            if (!isParentOfThisSchool) {
                throw new HttpError("Accès refusé", 403);
            }
        }

        return user;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async _assertHasNoBusinessProfile(user) {
        const [teacher, student, guardian] = await Promise.all([
            Teacher.findOne({ where: { user_id: user.id } }),
            Student.findOne({ where: { user_id: user.id } }),
            Guardian.findOne({ where: { user_id: user.id } })
        ]);

        if (teacher || student || guardian) {
            throw new HttpError(
                "Ce compte est lié à une fiche enseignant/élève/tuteur. Gérez-le depuis /teachers, /students ou /guardians.",
                400
            );
        }
    }

    async update(id, data, currentUser) {
        const user = await this._findWithAccess(id, currentUser);
        await this._assertHasNoBusinessProfile(user);

        const { first_name, last_name, phone, email } = data;

        if (email && email !== user.email) {
            const existing = await this.model.findOne({ where: { email } });
            if (existing) {
                throw new HttpError("Cette adresse email est déjà utilisée.", 400);
            }
        }

        await user.update({
            first_name: first_name ?? user.first_name,
            last_name: last_name ?? user.last_name,
            phone: phone ?? user.phone,
            email: email ?? user.email
        });

        return this.getById(id, currentUser);
    }

    async delete(id, currentUser) {
        const user = await this._findWithAccess(id, currentUser);
        await this._assertHasNoBusinessProfile(user);

        if (user.Role?.name === roles.SUPER_ADMIN) {
            throw new HttpError("Un compte SUPER_ADMIN ne peut pas être supprimé depuis cette route.", 400);
        }

        await this.model.destroy({ where: { id } });
    }

    async changeStatus(id, status, currentUser) {
        const user = await this._findWithAccess(id, currentUser);

        const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
        if (!validStatuses.includes(status)) {
            throw new HttpError(`status doit être l'un de : ${validStatuses.join(", ")}.`, 400);
        }

        await user.update({ status });
        return this.getById(id, currentUser);
    }

    async changePassword(id, newPassword, currentUser) {
        if (!newPassword || newPassword.length < 6) {
            throw new HttpError("Le nouveau mot de passe doit contenir au moins 6 caractères.", 400);
        }

        await this._findWithAccess(id, currentUser);

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await this.model.update({ password: hashedPassword }, { where: { id } });
    }
}

module.exports = new UserService();
