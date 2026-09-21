const express = require("express");
const router = express.Router();

const roleController = require("../controllers/role.controller");
const { authenticate } = require("../middlewares/auth");
const { authorize } = require("../middlewares/auth");
const roles = require("../constants/roles");

router.get(
    "/",
    authenticate,
    authorize(
        roles.SUPER_ADMIN,
        roles.COMPAGNY_ADMIN,
        roles.AGENCY_ADMIN
    ),
    roleController.listRoles
);

module.exports = router;
