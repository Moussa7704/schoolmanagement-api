const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const enrollmentController = require("../controllers/enrollment.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.ENROLLMENTS_CREATE),
    enrollmentController.createEnrollment
)

router.get('/',
    authenticate,
    authorize(permissions.ENROLLMENTS_VIEW),
    enrollmentController.listEnrollments
)

router.get('/:id',
    authenticate,
    authorize(permissions.ENROLLMENTS_VIEW),
    enrollmentController.getEnrollmentById
)

router.put('/:id',
    authenticate,
    authorize(permissions.ENROLLMENTS_UPDATE),
    enrollmentController.updateEnrollment
)

router.delete('/:id',
    authenticate,
    authorize(permissions.ENROLLMENTS_DELETE),
    enrollmentController.deleteEnrollment
)

module.exports = router
