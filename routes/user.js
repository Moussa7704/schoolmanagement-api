const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const peopleSchemas = require("../validators/people")
const authSchemas = require("../validators/auth")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const userController = require("../controllers/user.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.USERS_CREATE),
    validate(peopleSchemas.createUser),
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
    validate(peopleSchemas.updateUser),
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
    validate(peopleSchemas.changeUserStatus),
    userController.changeUserStatus
)

router.put('/:id/change-password',
    authenticate,
    authorize(permissions.USERS_CHANGE_PASSWORD),
    validate(authSchemas.adminChangePassword),
    userController.changePassword
)

module.exports = router
