const userService = require("../service/user.service")
const { sendResponse } = require("../utils/message")

const createUser = async (req, res) => {
    try {
        const user = await userService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Utilisateur créé avec succès",
            data: user,
            status: 201
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await userService.list(req.user);

        return sendResponse(res, {
            message: "Liste des utilisateurs récupérée avec succès",
            data: users
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getUserById = async (req, res) => {
    try {
        const user = await userService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Utilisateur trouvé",
            data: user
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateUser = async (req, res) => {
    try {
        const user = await userService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Utilisateur mis à jour avec succès",
            data: user
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        await userService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Utilisateur supprimé avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const changeUserStatus = async (req, res) => {
    try {
        const user = await userService.changeStatus(req.params.id, req.body.status, req.user);

        return sendResponse(res, {
            message: "Statut mis à jour avec succès",
            data: user
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const changePassword = async (req, res) => {
    try {
        await userService.changePassword(req.params.id, req.body.new_password, req.user);

        return sendResponse(res, {
            message: "Mot de passe modifié avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

module.exports = {
    createUser,
    listUsers,
    getUserById,
    updateUser,
    deleteUser,
    changeUserStatus,
    changePassword
}
