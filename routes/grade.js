const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const gradeController = require("../controllers/grade.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.GRADES_CREATE),
    gradeController.createGrade
)

router.get('/',
    authenticate,
    authorize(permissions.GRADES_VIEW),
    gradeController.listGrades
)

router.get('/:id',
    authenticate,
    authorize(permissions.GRADES_VIEW),
    gradeController.getGradeById
)

router.put('/:id',
    authenticate,
    authorize(permissions.GRADES_UPDATE),
    gradeController.updateGrade
)

router.delete('/:id',
    authenticate,
    authorize(permissions.GRADES_DELETE),
    gradeController.deleteGrade
)

module.exports = router
