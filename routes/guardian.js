const express = require("express")
const router = express.Router()
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
    guardianController.grantAccess
)

module.exports = router
