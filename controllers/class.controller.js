const classService = require("../service/class.service")
const { sendResponse } = require("../utils/message")

const createClass = async (req, res) => {
    try {
        const classRecord = await classService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Classe créée avec succès",
            data: classRecord,
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

const listClasses = async (req, res) => {
    try {
        const classes = await classService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des classes récupérée avec succès",
            data: classes
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getClassById = async (req, res) => {
    try {
        const classRecord = await classService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Classe trouvée",
            data: classRecord
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateClass = async (req, res) => {
    try {
        const classRecord = await classService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Classe mise à jour avec succès",
            data: classRecord
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteClass = async (req, res) => {
    try {
        await classService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Classe supprimée avec succès"
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
    createClass,
    listClasses,
    getClassById,
    updateClass,
    deleteClass
}
