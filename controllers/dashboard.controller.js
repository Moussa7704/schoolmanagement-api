const dashboardService = require("../service/dashboard.service")
const { sendResponse } = require("../utils/message")

const getStats = async (req, res) => {
    try {
        const stats = await dashboardService.getStats(req.user);

        return sendResponse(res, {
            message: "Statistiques récupérées avec succès",
            data: stats
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

module.exports = {
    getStats
}
