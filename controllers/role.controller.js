const roleService = require("../service/role.service")
const { sendResponse } = require("../utils/message")

const listRoles = async (req, res) => {
    try {
        const roles = await roleService.list();

        return sendResponse(res, {
            message: "Liste des rôles récupérée avec succès",
            data: roles
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getRoleById = async (req, res) => {
    try {
        const role = await roleService.getById(req.params.id);

        return sendResponse(res, {
            message: "Rôle trouvé",
            data: role
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

module.exports = {
    listRoles,
    getRoleById
}
