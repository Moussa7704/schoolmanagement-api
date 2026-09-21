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
