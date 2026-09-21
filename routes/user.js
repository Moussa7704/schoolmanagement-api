const express = require("express")
const router = express.Router()
const roles = require('../constants/roles')
const userController = require("../controllers/user.controller")
const { authenticate, authorize } = require("../middlewares/auth")

// Gestion des utilisateurs
router.post('/',
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN, roles.AGENCY_ADMIN),
    userController.createUser
)
router.get('/',
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN, roles.AGENCY_ADMIN),
    userController.listUsers
)

router.get('/:id',
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN, roles.AGENCY_ADMIN),
    userController.getUserById
)

router.put("/:id",
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN, roles.AGENCY_ADMIN),
    userController.updateUser
);

router.delete("/:id",
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN, roles.AGENCY_ADMIN),
    userController.deleteUser
);

router.patch("/:id/status",
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN, roles.AGENCY_ADMIN),
    userController.changeUserStatus
);

router.put("/:id/change-password",
    authenticate,
    authorize(roles.SUPER_ADMIN, roles.COMPAGNY_ADMIN),
    userController.changePassword
);

module.exports = router
