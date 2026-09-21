const academicYearService = require("../service/academicyear.service")
const { sendResponse } = require("../utils/message")

const createAcademicYear = async (req, res) => {
    try {
        const academicYear = await academicYearService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Année scolaire créée avec succès",
            data: academicYear,
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

const listAcademicYears = async (req, res) => {
    try {
        const academicYears = await academicYearService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des années scolaires récupérée avec succès",
            data: academicYears
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getAcademicYearById = async (req, res) => {
    try {
        const academicYear = await academicYearService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Année scolaire trouvée",
            data: academicYear
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateAcademicYear = async (req, res) => {
    try {
        const academicYear = await academicYearService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Année scolaire mise à jour avec succès",
            data: academicYear
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteAcademicYear = async (req, res) => {
    try {
        await academicYearService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Année scolaire supprimée avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const setCurrent = async (req, res) => {
    try {
        const academicYear = await academicYearService.setCurrent(req.params.id, req.user);

        return sendResponse(res, {
            message: "Année scolaire définie comme année courante",
            data: academicYear
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
    createAcademicYear,
    listAcademicYears,
    getAcademicYearById,
    updateAcademicYear,
    deleteAcademicYear,
    setCurrent
}
