const attendanceService = require("../service/attendance.service")
const { sendResponse } = require("../utils/message")

const createAttendance = async (req, res) => {
    try {
        const attendance = await attendanceService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Présence enregistrée avec succès",
            data: attendance,
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

const listAttendances = async (req, res) => {
    try {
        const attendances = await attendanceService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des présences récupérée avec succès",
            data: attendances
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getAttendanceStats = async (req, res) => {
    try {
        const stats = await attendanceService.stats(req.query, req.user);

        return sendResponse(res, {
            message: "Statistiques de présence calculées avec succès",
            data: stats
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const getAttendanceById = async (req, res) => {
    try {
        const attendance = await attendanceService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Présence trouvée",
            data: attendance
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateAttendance = async (req, res) => {
    try {
        const attendance = await attendanceService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Présence mise à jour avec succès",
            data: attendance
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteAttendance = async (req, res) => {
    try {
        await attendanceService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Présence supprimée avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const rollCall = async (req, res) => {
    try {
        const result = await attendanceService.rollCall(req.body, req.user);

        return sendResponse(res, {
            message: `Appel enregistré : ${result.created} présence(s) créée(s), ${result.updated} mise(s) à jour`,
            data: result,
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

module.exports = {
    createAttendance,
    rollCall,
    listAttendances,
    getAttendanceStats,
    getAttendanceById,
    updateAttendance,
    deleteAttendance
}
