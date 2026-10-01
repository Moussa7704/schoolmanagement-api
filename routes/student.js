const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/people")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const studentController = require("../controllers/student.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.STUDENTS_CREATE),
    validate(schemas.createStudent),
    studentController.createStudent
)

router.get('/',
    authenticate,
    authorize(permissions.STUDENTS_VIEW),
    studentController.listStudents
)

router.get('/:id',
    authenticate,
    authorize(permissions.STUDENTS_VIEW),
    studentController.getStudentById
)

router.put('/:id',
    authenticate,
    authorize(permissions.STUDENTS_UPDATE),
    validate(schemas.updateStudent),
    studentController.updateStudent
)

router.delete('/:id',
    authenticate,
    authorize(permissions.STUDENTS_DELETE),
    studentController.deleteStudent
)

router.post('/:id/grant-access',
    authenticate,
    authorize(permissions.STUDENTS_GRANT_ACCESS),
    validate(schemas.grantAccess),
    studentController.grantAccess
)

module.exports = router
