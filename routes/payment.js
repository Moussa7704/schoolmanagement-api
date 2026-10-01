const express = require("express")
const router = express.Router()
const { validate, validateIdParam } = require("../middlewares/validate")
const schemas = require("../validators/finance")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const paymentController = require("../controllers/payment.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.PAYMENTS_CREATE),
    validate(schemas.createPayment),
    paymentController.createPayment
)

router.get('/',
    authenticate,
    authorize(permissions.PAYMENTS_VIEW),
    paymentController.listPayments
)

router.get('/:id',
    authenticate,
    authorize(permissions.PAYMENTS_VIEW),
    paymentController.getPaymentById
)

router.get('/:id/receipt',
    authenticate,
    authorize(permissions.PAYMENTS_VIEW),
    paymentController.downloadPaymentReceipt
)

router.delete('/:id',
    authenticate,
    authorize(permissions.PAYMENTS_DELETE),
    paymentController.deletePayment
)

module.exports = router
