const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const studentController = require("../controllers/student.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.STUDENTS_CREATE),
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
    studentController.grantAccess
)

module.exports = router
