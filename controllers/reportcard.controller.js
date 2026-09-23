const reportCardService = require("../service/reportcard.service")
const { sendResponse } = require("../utils/message")

const createReportCard = async (req, res) => {
    try {
        const reportCard = await reportCardService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Bulletin généré avec succès",
            data: reportCard,
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

const listReportCards = async (req, res) => {
    try {
        const reportCards = await reportCardService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des bulletins récupérée avec succès",
            data: reportCards
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getReportCardById = async (req, res) => {
    try {
        const reportCard = await reportCardService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Bulletin trouvé",
            data: reportCard
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getClassRanking = async (req, res) => {
    try {
        const ranking = await reportCardService.getClassRanking(req.query.class_id, req.query.period_id, req.user);

        return sendResponse(res, {
            message: "Classement récupéré avec succès",
            data: ranking
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const validateReportCard = async (req, res) => {
    try {
        const reportCard = await reportCardService.validate(req.params.id, req.user);

        return sendResponse(res, {
            message: "Bulletin validé avec succès",
            data: reportCard
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteReportCard = async (req, res) => {
    try {
        await reportCardService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Bulletin supprimé avec succès"
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
    createReportCard,
    listReportCards,
    getReportCardById,
    getClassRanking,
    validateReportCard,
    deleteReportCard
}
