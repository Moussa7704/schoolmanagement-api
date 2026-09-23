const guardianService = require("../service/guardian.service")
const { sendResponse } = require("../utils/message")

const createGuardian = async (req, res) => {
    try {
        const guardian = await guardianService.create(req.body);

        return sendResponse(res, {
            message: "Tuteur/responsable créé avec succès",
            data: guardian,
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

const listGuardians = async (req, res) => {
    try {
        const guardians = await guardianService.list(req.user);

        return sendResponse(res, {
            message: "Liste des tuteurs/responsables récupérée avec succès",
            data: guardians
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getGuardianById = async (req, res) => {
    try {
        const guardian = await guardianService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Tuteur/responsable trouvé",
            data: guardian
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateGuardian = async (req, res) => {
    try {
        const guardian = await guardianService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Tuteur/responsable mis à jour avec succès",
            data: guardian
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteGuardian = async (req, res) => {
    try {
        await guardianService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Tuteur/responsable supprimé avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const grantAccess = async (req, res) => {
    try {
        const guardian = await guardianService.grantAccess(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Compte de connexion créé pour le tuteur/responsable",
            data: guardian
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const getMyChildren = async (req, res) => {
    try {
        const children = await guardianService.getMyChildren(req.user);

        return sendResponse(res, {
            message: "Liste de vos enfants récupérée avec succès",
            data: children
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
    createGuardian,
    listGuardians,
    getGuardianById,
    updateGuardian,
    deleteGuardian,
    grantAccess,
    getMyChildren
}
