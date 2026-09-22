const permissionService = require("../service/permission.service")
const { sendResponse } = require("../utils/message")

const listPermissions = async (req, res) => {
    try {
        const permissions = await permissionService.list();

        return sendResponse(res, {
            message: "Liste des permissions récupérée avec succès",
            data: permissions
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
    listPermissions
}
