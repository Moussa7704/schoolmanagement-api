const express = require("express");
const router = express.Router();

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

module.exports = router;
