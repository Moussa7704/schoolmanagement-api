const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const scheduleController = require("../controllers/schedule.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.SCHEDULES_CREATE),
    scheduleController.createSchedule
)

router.get('/',
    authenticate,
    authorize(permissions.SCHEDULES_VIEW),
    scheduleController.listSchedules
)

router.get('/:id',
    authenticate,
    authorize(permissions.SCHEDULES_VIEW),
    scheduleController.getScheduleById
)

router.put('/:id',
    authenticate,
    authorize(permissions.SCHEDULES_UPDATE),
    scheduleController.updateSchedule
)

router.delete('/:id',
    authenticate,
    authorize(permissions.SCHEDULES_DELETE),
    scheduleController.deleteSchedule
)

module.exports = router
