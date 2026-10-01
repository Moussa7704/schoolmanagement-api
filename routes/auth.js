const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const { authenticate } = require("../middlewares/auth")
const { loginLimiter, otpLimiter } = require("../middlewares/rateLimit")

// Authentification (les routes publiques sensibles sont limitées par IP)
router.post('/login', loginLimiter, authController.login)
router.post('/verify-otp', otpLimiter, authController.verifyOtp)
router.post('/resend-otp', otpLimiter, authController.resendOtp)
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateMe);
router.put('/me/password', authenticate, authController.changeMyPassword);
router.post('/forgot-password', loginLimiter, authController.forgetPassword);
router.post('/reset-password', loginLimiter, authController.resetPassword);

module.exports = router
