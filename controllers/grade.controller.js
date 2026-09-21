const gradeService = require("../service/grade.service")
const { sendResponse } = require("../utils/message")

const createGrade = async (req, res) => {
    try {
        const grade = await gradeService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Note enregistrée avec succès",
            data: grade,
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

const listGrades = async (req, res) => {
    try {
        const grades = await gradeService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des notes récupérée avec succès",
            data: grades
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getGradeById = async (req, res) => {
    try {
        const grade = await gradeService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Note trouvée",
            data: grade
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateGrade = async (req, res) => {
    try {
        const grade = await gradeService.update(req.params.id, req.body, req.user);

        return sendResponse(res, {
            message: "Note mise à jour avec succès",
            data: grade
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteGrade = async (req, res) => {
    try {
        await gradeService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Note supprimée avec succès"
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
    createGrade,
    listGrades,
    getGradeById,
    updateGrade,
    deleteGrade
}
