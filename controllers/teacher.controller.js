const teacherService = require("../service/teacher.service")
const { sendResponse } = require("../utils/message")

const createTeacher = async (req, res) => {
    try {
        const teacher = await teacherService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Enseignant créé avec succès",
            data: teacher,
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

const listTeachers = async (req, res) => {
    try {
        const teachers = await teacherService.list(req.user);

        return sendResponse(res, {
            message: "Liste des enseignants récupérée avec succès",
            data: teachers
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getTeacherById = async (req, res) => {
    try {
        const teacher = await teacherService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Enseignant trouvé",
            data: teacher
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const teacher = await teacherService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Enseignant mis à jour avec succès",
            data: teacher
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        await teacherService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Enseignant supprimé avec succès"
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
    createTeacher,
    listTeachers,
    getTeacherById,
    updateTeacher,
    deleteTeacher
}
