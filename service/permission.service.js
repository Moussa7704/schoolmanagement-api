const { Permission } = require("../models")
const BaseService = require("./base-service");

class PermissionService extends BaseService {
    constructor() {
        super(Permission);
    }

    async list() {
        return this.model.findAll({ order: [["name", "ASC"]] });
    }
}

module.exports = new PermissionService();
