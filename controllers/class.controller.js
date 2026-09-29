const classService = require("../service/class.service")
const classExportService = require("../service/classexport.service")
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

const promoteClass = async (req, res) => {
    try {
        const enrollments = await classService.promote(req.params.id, req.body.promotions, req.user);

        return sendResponse(res, {
            message: "Élèves promus avec succès",
            data: enrollments,
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

const exportClassStudents = async (req, res) => {
    try {
        const { buffer, filename } = await classExportService.exportStudents(req.params.id, req.user);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="${filename}"`,
            "Content-Length": buffer.length
        });
        return res.status(200).send(Buffer.from(buffer));

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

module.exports = {
    createClass,
    listClasses,
    getClassById,
    updateClass,
    promoteClass,
    exportClassStudents,
    deleteClass
}
