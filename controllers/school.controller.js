const schoolService = require("../service/school.service")
const { sendResponse } = require("../utils/message")

const createSchool = async (req, res) => {
    try {
        const school = await schoolService.create(req.body);

        return sendResponse(res, {
            message: "École créée avec succès",
            data: school,
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

const listSchools = async (req, res) => {
    try {
        const schools = await schoolService.list();

        return sendResponse(res, {
            message: "Liste des écoles récupérée avec succès",
            data: schools
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getSchoolById = async (req, res) => {
    try {
        const school = await schoolService.getById(req.params.id);

        return sendResponse(res, {
            message: "École trouvée",
            data: school
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateSchool = async (req, res) => {
    try {
        const school = await schoolService.update(req.params.id, req.body);

        return sendResponse(res, {
            message: "École mise à jour avec succès",
            data: school
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deleteSchool = async (req, res) => {
    try {
        await schoolService.delete(req.params.id);

        return sendResponse(res, {
            message: "École supprimée avec succès"
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
    createSchool,
    listSchools,
    getSchoolById,
    updateSchool,
    deleteSchool
}
