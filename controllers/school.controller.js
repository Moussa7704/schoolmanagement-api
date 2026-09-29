const schoolService = require("../service/school.service")
const schoolExportService = require("../service/schoolexport.service")
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

const exportSchoolData = async (req, res) => {
    try {
        const zipBuffer = await schoolExportService.exportSchoolData(req.params.id);

        res.set({
            "Content-Type": "application/zip",
            "Content-Disposition": `attachment; filename="export-ecole-${req.params.id}.zip"`,
            "Content-Length": zipBuffer.length
        });
        return res.status(200).send(zipBuffer);

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

module.exports = {
    createSchool,
    listSchools,
    getSchoolById,
    updateSchool,
    deleteSchool,
    exportSchoolData
}
