const { StudentGuardian } = require("../models");
const roles = require("../constants/roles");
const HttpError = require("./httpError");

const isParent = (currentUser) => currentUser?.Role?.name === roles.PARENT;

async function getChildStudentIds(currentUser) {
    if (!currentUser?.Guardian?.id) {
        return [];
    }

    const links = await StudentGuardian.findAll({
        where: { guardian_id: currentUser.Guardian.id },
        attributes: ["student_id"]
    });

    return links.map((link) => link.student_id);
}

async function assertParentCanAccessStudent(studentId, currentUser) {
    const childIds = await getChildStudentIds(currentUser);
    if (!childIds.some((id) => Number(id) === Number(studentId))) {
        throw new HttpError("Accès refusé : cet élève n'est pas rattaché à votre compte.", 403);
    }
}

module.exports = { isParent, getChildStudentIds, assertParentCanAccessStudent };
