const studentGuardianService = require("../service/studentguardian.service")
const { sendResponse } = require("../utils/message")

const attachGuardian = async (req, res) => {
    try {
        const link = await studentGuardianService.attach(req.body, req.user);

        return sendResponse(res, {
            message: "Responsable attaché à l'élève avec succès",
            data: link,
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

const listStudentGuardians = async (req, res) => {
    try {
        const links = await studentGuardianService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des liens élève-responsable récupérée avec succès",
            data: links
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const detachGuardian = async (req, res) => {
    try {
        await studentGuardianService.detach(req.params.id, req.user);

        return sendResponse(res, {
            message: "Responsable détaché de l'élève avec succès"
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
    attachGuardian,
    listStudentGuardians,
    detachGuardian
}
