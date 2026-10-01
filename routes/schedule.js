const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/structure")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const scheduleController = require("../controllers/schedule.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.SCHEDULES_CREATE),
    validate(schemas.createSchedule),
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
    validate(schemas.updateSchedule),
    scheduleController.updateSchedule
)

router.delete('/:id',
    authenticate,
    authorize(permissions.SCHEDULES_DELETE),
    scheduleController.deleteSchedule
)

module.exports = router
