const tuitionFeeService = require("../service/tuitionfee.service")
const { sendResponse } = require("../utils/message")

const createTuitionFee = async (req, res) => {
    try {
        const tuitionFee = await tuitionFeeService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Échéance créée avec succès",
            data: tuitionFee,
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

const listTuitionFees = async (req, res) => {
    try {
        const tuitionFees = await tuitionFeeService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des échéances récupérée avec succès",
            data: tuitionFees
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getTuitionFeeById = async (req, res) => {
    try {
        const tuitionFee = await tuitionFeeService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Échéance trouvée",
            data: tuitionFee
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateTuitionFee = async (req, res) => {
    try {
        const tuitionFee = await tuitionFeeService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Échéance mise à jour avec succès",
            data: tuitionFee
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteTuitionFee = async (req, res) => {
    try {
        await tuitionFeeService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Échéance supprimée avec succès"
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
    createTuitionFee,
    listTuitionFees,
    getTuitionFeeById,
    updateTuitionFee,
    deleteTuitionFee
}
