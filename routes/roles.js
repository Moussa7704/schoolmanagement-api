const express = require("express");
const router = express.Router();
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/people")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)

const permissions = require("../constants/permissions");
const roleController = require("../controllers/role.controller");
const { authenticate, authorize } = require("../middlewares/auth");

router.get(
    "/",
    authenticate,
    authorize(permissions.ROLES_VIEW),
    roleController.listRoles
);

router.get(
    "/:id",
    authenticate,
    authorize(permissions.ROLES_VIEW),
    roleController.getRoleById
);

router.put(
    "/:id/permissions",
    authenticate,
    authorize(permissions.PERMISSIONS_MANAGE),
    validate(schemas.updateRolePermissions),
    roleController.updateRolePermissions
);

module.exports = router;
