const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/people")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const guardianController = require("../controllers/guardian.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.get('/me/children',
    authenticate,
    guardianController.getMyChildren
)

router.post('/',
    authenticate,
    authorize(permissions.GUARDIANS_CREATE),
    validate(schemas.createGuardian),
    guardianController.createGuardian
)

router.get('/',
    authenticate,
    authorize(permissions.GUARDIANS_VIEW),
    guardianController.listGuardians
)

router.get('/:id',
    authenticate,
    authorize(permissions.GUARDIANS_VIEW),
    guardianController.getGuardianById
)

router.put('/:id',
    authenticate,
    authorize(permissions.GUARDIANS_UPDATE),
    validate(schemas.updateGuardian),
    guardianController.updateGuardian
)

router.delete('/:id',
    authenticate,
    authorize(permissions.GUARDIANS_DELETE),
    guardianController.deleteGuardian
)

router.post('/:id/grant-access',
    authenticate,
    authorize(permissions.GUARDIANS_GRANT_ACCESS),
    validate(schemas.grantAccess),
    guardianController.grantAccess
)

module.exports = router
