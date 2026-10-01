const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/academic")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const assessmentController = require("../controllers/assessment.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.ASSESSMENTS_CREATE),
    validate(schemas.createAssessment),
    assessmentController.createAssessment
)

router.get('/',
    authenticate,
    authorize(permissions.ASSESSMENTS_VIEW),
    assessmentController.listAssessments
)

router.get('/:id',
    authenticate,
    authorize(permissions.ASSESSMENTS_VIEW),
    assessmentController.getAssessmentById
)

router.put('/:id',
    authenticate,
    authorize(permissions.ASSESSMENTS_UPDATE),
    validate(schemas.updateAssessment),
    assessmentController.updateAssessment
)

router.delete('/:id',
    authenticate,
    authorize(permissions.ASSESSMENTS_DELETE),
    assessmentController.deleteAssessment
)

module.exports = router
