const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const assessmentController = require("../controllers/assessment.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.ASSESSMENTS_CREATE),
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
    assessmentController.updateAssessment
)

router.delete('/:id',
    authenticate,
    authorize(permissions.ASSESSMENTS_DELETE),
    assessmentController.deleteAssessment
)

module.exports = router
