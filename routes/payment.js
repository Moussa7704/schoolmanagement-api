const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const paymentController = require("../controllers/payment.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.PAYMENTS_CREATE),
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

router.delete('/:id',
    authenticate,
    authorize(permissions.PAYMENTS_DELETE),
    paymentController.deletePayment
)

module.exports = router
