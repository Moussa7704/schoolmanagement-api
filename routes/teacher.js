const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const teacherController = require("../controllers/teacher.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.TEACHERS_CREATE),
    teacherController.createTeacher
)

router.get('/',
    authenticate,
    authorize(permissions.TEACHERS_VIEW),
    teacherController.listTeachers
)

router.get('/:id',
    authenticate,
    authorize(permissions.TEACHERS_VIEW),
    teacherController.getTeacherById
)

router.put('/:id',
    authenticate,
    authorize(permissions.TEACHERS_UPDATE),
    teacherController.updateTeacher
)

router.delete('/:id',
    authenticate,
    authorize(permissions.TEACHERS_DELETE),
    teacherController.deleteTeacher
)

module.exports = router
