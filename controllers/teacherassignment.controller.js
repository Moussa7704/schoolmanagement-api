const teacherAssignmentService = require("../service/teacherassignment.service")
const { sendResponse } = require("../utils/message")

const createTeacherAssignment = async (req, res) => {
    try {
        const assignment = await teacherAssignmentService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Enseignant affecté avec succès",
            data: assignment,
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

const listTeacherAssignments = async (req, res) => {
    try {
        const assignments = await teacherAssignmentService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des affectations récupérée avec succès",
            data: assignments
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getTeacherAssignmentById = async (req, res) => {
    try {
        const assignment = await teacherAssignmentService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Affectation trouvée",
            data: assignment
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const deleteTeacherAssignment = async (req, res) => {
    try {
        await teacherAssignmentService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Affectation supprimée avec succès"
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
    createTeacherAssignment,
    listTeacherAssignments,
    getTeacherAssignmentById,
    deleteTeacherAssignment
}
