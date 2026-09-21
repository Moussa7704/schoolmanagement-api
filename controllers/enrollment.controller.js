const enrollmentService = require("../service/enrollment.service")
const { sendResponse } = require("../utils/message")

const createEnrollment = async (req, res) => {
    try {
        const enrollment = await enrollmentService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Élève inscrit avec succès",
            data: enrollment,
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

const listEnrollments = async (req, res) => {
    try {
        const enrollments = await enrollmentService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des inscriptions récupérée avec succès",
            data: enrollments
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getEnrollmentById = async (req, res) => {
    try {
        const enrollment = await enrollmentService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Inscription trouvée",
            data: enrollment
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateEnrollment = async (req, res) => {
    try {
        const enrollment = await enrollmentService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Inscription mise à jour avec succès",
            data: enrollment
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteEnrollment = async (req, res) => {
    try {
        await enrollmentService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Inscription supprimée avec succès"
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
    createEnrollment,
    listEnrollments,
    getEnrollmentById,
    updateEnrollment,
    deleteEnrollment
}
