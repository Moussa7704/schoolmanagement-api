const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/structure")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const periodController = require("../controllers/period.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.PERIODS_CREATE),
    validate(schemas.createPeriod),
    periodController.createPeriod
)

router.get('/',
    authenticate,
    authorize(permissions.PERIODS_VIEW),
    periodController.listPeriods
)

router.get('/:id',
    authenticate,
    authorize(permissions.PERIODS_VIEW),
    periodController.getPeriodById
)

router.put('/:id',
    authenticate,
    authorize(permissions.PERIODS_UPDATE),
    validate(schemas.updatePeriod),
    periodController.updatePeriod
)

router.delete('/:id',
    authenticate,
    authorize(permissions.PERIODS_DELETE),
    periodController.deletePeriod
)

module.exports = router
