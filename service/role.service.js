const { Role, Permission, RolePermission, sequelize } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

class RoleService extends BaseService {
    constructor() {
        super(Role);
    }

    async list() {
        return this.model.findAll({
            include: [{ model: Permission, as: "Permissions" }],
            order: [["id", "ASC"]]
        });
    }

    async getById(id) {
        const role = await this.model.findByPk(id, {
            include: [{ model: Permission, as: "Permissions" }]
        });

        if (!role) {
            throw new HttpError("Rôle introuvable", 404);
        }

        return role;
    }

    async updatePermissions(id, permissionIds, currentUser) {
        const role = await this.model.findByPk(id);

        if (!role) {
            throw new HttpError("Rôle introuvable", 404);
        }

        if (role.name === roles.SUPER_ADMIN) {
            throw new HttpError(
                "Les permissions du rôle SUPER_ADMIN ne peuvent pas être modifiées : ce rôle contourne toujours la vérification des permissions.",
                400
            );
        }

        if (!Array.isArray(permissionIds)) {
            throw new HttpError("permission_ids doit être un tableau.", 400);
        }

        const uniqueIds = [...new Set(permissionIds)];
        if (uniqueIds.length) {
            const found = await Permission.count({ where: { id: uniqueIds } });
            if (found !== uniqueIds.length) {
                throw new HttpError("Un ou plusieurs permission_id sont introuvables.", 400);
            }
        }

        const t = await sequelize.transaction();
        try {
            await RolePermission.destroy({ where: { role_id: id }, transaction: t });

            if (uniqueIds.length) {
                await RolePermission.bulkCreate(
                    uniqueIds.map((permission_id) => ({ role_id: id, permission_id })),
                    { transaction: t }
                );
            }

            await t.commit();
        } catch (err) {
            await t.rollback();
            throw err;
        }

        return this.getById(id);
    }
}

module.exports = new RoleService();
