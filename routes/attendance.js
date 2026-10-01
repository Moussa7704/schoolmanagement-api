const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/academic")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const attendanceController = require("../controllers/attendance.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.ATTENDANCES_CREATE),
    validate(schemas.createAttendance),
    attendanceController.createAttendance
)

// Appel d'une classe : toutes les présences d'une date et d'une séance en une fois.
router.post('/roll-call',
    authenticate,
    authorize(permissions.ATTENDANCES_CREATE),
    validate(schemas.rollCall),
    attendanceController.rollCall
)

router.get('/stats',
    authenticate,
    authorize(permissions.ATTENDANCES_VIEW),
    validate(schemas.attendanceStats),
    attendanceController.getAttendanceStats
)

router.get('/',
    authenticate,
    authorize(permissions.ATTENDANCES_VIEW),
    attendanceController.listAttendances
)

router.get('/:id',
    authenticate,
    authorize(permissions.ATTENDANCES_VIEW),
    attendanceController.getAttendanceById
)

router.put('/:id',
    authenticate,
    authorize(permissions.ATTENDANCES_UPDATE),
    validate(schemas.updateAttendance),
    attendanceController.updateAttendance
)

router.delete('/:id',
    authenticate,
    authorize(permissions.ATTENDANCES_DELETE),
    attendanceController.deleteAttendance
)

module.exports = router
