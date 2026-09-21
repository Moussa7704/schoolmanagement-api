const subjectService = require("../service/subject.service")
const { sendResponse } = require("../utils/message")

const createSubject = async (req, res) => {
    try {
        const subject = await subjectService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Matière créée avec succès",
            data: subject,
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

const listSubjects = async (req, res) => {
    try {
        const subjects = await subjectService.list(req.user);

        return sendResponse(res, {
            message: "Liste des matières récupérée avec succès",
            data: subjects
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getSubjectById = async (req, res) => {
    try {
        const subject = await subjectService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Matière trouvée",
            data: subject
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateSubject = async (req, res) => {
    try {
        const subject = await subjectService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Matière mise à jour avec succès",
            data: subject
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteSubject = async (req, res) => {
    try {
        await subjectService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Matière supprimée avec succès"
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
    createSubject,
    listSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject
}
