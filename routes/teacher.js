const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/people")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const teacherController = require("../controllers/teacher.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.TEACHERS_CREATE),
    validate(schemas.createTeacher),
    teacherController.createTeacher
)

router.get('/',
    authenticate,
    authorize(permissions.TEACHERS_VIEW),
    teacherController.listTeachers
)

// Espace de l'enseignant connecté (ses classes, matières, périodes, élèves).
// Même permission que la consultation des évaluations, que tout TEACHER a ;
// déclarée avant '/:id' pour ne pas être capturée comme un identifiant.
router.get('/me/classes',
    authenticate,
    authorize(permissions.ASSESSMENTS_VIEW),
    teacherController.getMyClasses
)

router.get('/:id',
    authenticate,
    authorize(permissions.TEACHERS_VIEW),
    teacherController.getTeacherById
)

router.put('/:id',
    authenticate,
    authorize(permissions.TEACHERS_UPDATE),
    validate(schemas.updateTeacher),
    teacherController.updateTeacher
)

router.delete('/:id',
    authenticate,
    authorize(permissions.TEACHERS_DELETE),
    teacherController.deleteTeacher
)

module.exports = router
