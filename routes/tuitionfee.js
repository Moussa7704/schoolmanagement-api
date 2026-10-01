const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/finance")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const tuitionFeeController = require("../controllers/tuitionfee.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.TUITION_FEES_CREATE),
    validate(schemas.createTuitionFee),
    tuitionFeeController.createTuitionFee
)

router.get('/',
    authenticate,
    authorize(permissions.TUITION_FEES_VIEW),
    tuitionFeeController.listTuitionFees
)

router.get('/:id',
    authenticate,
    authorize(permissions.TUITION_FEES_VIEW),
    tuitionFeeController.getTuitionFeeById
)

router.put('/:id',
    authenticate,
    authorize(permissions.TUITION_FEES_UPDATE),
    validate(schemas.updateTuitionFee),
    tuitionFeeController.updateTuitionFee
)

router.get('/:id/invoice',
    authenticate,
    authorize(permissions.TUITION_FEES_VIEW),
    tuitionFeeController.downloadTuitionFeeInvoice
)

router.delete('/:id',
    authenticate,
    authorize(permissions.TUITION_FEES_DELETE),
    tuitionFeeController.deleteTuitionFee
)

module.exports = router
