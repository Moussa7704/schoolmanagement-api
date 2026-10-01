const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/structure")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const teacherAssignmentController = require("../controllers/teacherassignment.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.TEACHER_ASSIGNMENTS_CREATE),
    validate(schemas.createTeacherAssignment),
    teacherAssignmentController.createTeacherAssignment
)

router.get('/',
    authenticate,
    authorize(permissions.TEACHER_ASSIGNMENTS_VIEW),
    teacherAssignmentController.listTeacherAssignments
)

router.get('/:id',
    authenticate,
    authorize(permissions.TEACHER_ASSIGNMENTS_VIEW),
    teacherAssignmentController.getTeacherAssignmentById
)

router.delete('/:id',
    authenticate,
    authorize(permissions.TEACHER_ASSIGNMENTS_DELETE),
    teacherAssignmentController.deleteTeacherAssignment
)

module.exports = router
