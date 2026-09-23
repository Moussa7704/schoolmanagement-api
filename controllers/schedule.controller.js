const scheduleService = require("../service/schedule.service")
const { sendResponse } = require("../utils/message")

const createSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Créneau créé avec succès",
            data: schedule,
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

const listSchedules = async (req, res) => {
    try {
        const schedules = await scheduleService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des créneaux récupérée avec succès",
            data: schedules
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getScheduleById = async (req, res) => {
    try {
        const schedule = await scheduleService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Créneau trouvé",
            data: schedule
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateSchedule = async (req, res) => {
    try {
        const schedule = await scheduleService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Créneau mis à jour avec succès",
            data: schedule
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteSchedule = async (req, res) => {
    try {
        await scheduleService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Créneau supprimé avec succès"
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
    createSchedule,
    listSchedules,
    getScheduleById,
    updateSchedule,
    deleteSchedule
}
