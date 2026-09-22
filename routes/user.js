const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const userController = require("../controllers/user.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.USERS_CREATE),
    userController.createUser
)

router.get('/',
    authenticate,
    authorize(permissions.USERS_VIEW),
    userController.listUsers
)

router.get('/:id',
    authenticate,
    authorize(permissions.USERS_VIEW),
    userController.getUserById
)

router.put('/:id',
    authenticate,
    authorize(permissions.USERS_UPDATE),
    userController.updateUser
)

router.delete('/:id',
    authenticate,
    authorize(permissions.USERS_DELETE),
    userController.deleteUser
)

router.patch('/:id/status',
    authenticate,
    authorize(permissions.USERS_CHANGE_STATUS),
    userController.changeUserStatus
)

router.put('/:id/change-password',
    authenticate,
    authorize(permissions.USERS_CHANGE_PASSWORD),
    userController.changePassword
)

module.exports = router
