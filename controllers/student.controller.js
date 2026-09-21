const studentService = require("../service/student.service")
const { sendResponse } = require("../utils/message")

const createStudent = async (req, res) => {
    try {
        const student = await studentService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Élève créé avec succès",
            data: student,
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

const listStudents = async (req, res) => {
    try {
        const students = await studentService.list(req.user);

        return sendResponse(res, {
            message: "Liste des élèves récupérée avec succès",
            data: students
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getStudentById = async (req, res) => {
    try {
        const student = await studentService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Élève trouvé",
            data: student
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateStudent = async (req, res) => {
    try {
        const student = await studentService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Élève mis à jour avec succès",
            data: student
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteStudent = async (req, res) => {
    try {
        await studentService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Élève supprimé avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const grantAccess = async (req, res) => {
    try {
        const student = await studentService.grantAccess(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Compte de connexion créé pour l'élève",
            data: student
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
    createStudent,
    listStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    grantAccess
}
