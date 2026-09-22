const { Role, Permission } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");

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
}

module.exports = new RoleService();
