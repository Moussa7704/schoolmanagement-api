const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const attendanceController = require("../controllers/attendance.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.ATTENDANCES_CREATE),
    attendanceController.createAttendance
)

// Appel d'une classe : toutes les présences d'une date et d'une séance en une fois.
router.post('/roll-call',
    authenticate,
    authorize(permissions.ATTENDANCES_CREATE),
    attendanceController.rollCall
)

router.get('/stats',
    authenticate,
    authorize(permissions.ATTENDANCES_VIEW),
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
    attendanceController.updateAttendance
)

router.delete('/:id',
    authenticate,
    authorize(permissions.ATTENDANCES_DELETE),
    attendanceController.deleteAttendance
)

module.exports = router
