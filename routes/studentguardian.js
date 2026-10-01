const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/people")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const studentGuardianController = require("../controllers/studentguardian.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.STUDENT_GUARDIANS_CREATE),
    validate(schemas.attachGuardian),
    studentGuardianController.attachGuardian
)

router.get('/',
    authenticate,
    authorize(permissions.STUDENT_GUARDIANS_VIEW),
    studentGuardianController.listStudentGuardians
)

router.delete('/:id',
    authenticate,
    authorize(permissions.STUDENT_GUARDIANS_DELETE),
    studentGuardianController.detachGuardian
)

module.exports = router
