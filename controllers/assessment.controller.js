const assessmentService = require("../service/assessment.service")
const { sendResponse } = require("../utils/message")

const createAssessment = async (req, res) => {
    try {
        const assessment = await assessmentService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Évaluation créée avec succès",
            data: assessment,
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

const listAssessments = async (req, res) => {
    try {
        const assessments = await assessmentService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des évaluations récupérée avec succès",
            data: assessments
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getAssessmentById = async (req, res) => {
    try {
        const assessment = await assessmentService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Évaluation trouvée",
            data: assessment
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateAssessment = async (req, res) => {
    try {
        const assessment = await assessmentService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Évaluation mise à jour avec succès",
            data: assessment
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteAssessment = async (req, res) => {
    try {
        await assessmentService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Évaluation supprimée avec succès"
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
    createAssessment,
    listAssessments,
    getAssessmentById,
    updateAssessment,
    deleteAssessment
}
