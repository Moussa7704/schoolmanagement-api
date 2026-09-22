const express = require("express");
const router = express.Router();

const permissions = require("../constants/permissions");
const permissionController = require("../controllers/permission.controller");
const { authenticate, authorize } = require("../middlewares/auth");

router.get(
    "/",
    authenticate,
    authorize(permissions.ROLES_VIEW),
    permissionController.listPermissions
);

module.exports = router;
