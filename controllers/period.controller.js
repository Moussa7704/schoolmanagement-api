const periodService = require("../service/period.service")
const { sendResponse } = require("../utils/message")

const createPeriod = async (req, res) => {
    try {
        const period = await periodService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Période créée avec succès",
            data: period,
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

const listPeriods = async (req, res) => {
    try {
        const periods = await periodService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des périodes récupérée avec succès",
            data: periods
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getPeriodById = async (req, res) => {
    try {
        const period = await periodService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Période trouvée",
            data: period
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updatePeriod = async (req, res) => {
    try {
        const period = await periodService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Période mise à jour avec succès",
            data: period
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deletePeriod = async (req, res) => {
    try {
        await periodService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Période supprimée avec succès"
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
    createPeriod,
    listPeriods,
    getPeriodById,
    updatePeriod,
    deletePeriod
}
