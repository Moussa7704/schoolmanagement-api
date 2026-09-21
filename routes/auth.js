const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const { authenticate } = require("../middlewares/auth")

// Authentification
router.post('/login', authController.login)
router.post('/verify-otp', authController.verifyOtp)
router.post('/resend-otp', authController.resendOtp)
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateMe);
router.put('/me/password', authenticate, authController.changeMyPassword);
router.post('/forgot-password', authController.forgetPassword);
router.post('/reset-password', authController.resetPassword);

module.exports = router
