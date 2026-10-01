const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const { authenticate } = require("../middlewares/auth")
const { authIpLimiter, loginLimiter, otpLimiter } = require("../middlewares/rateLimit")

// Authentification. Routes publiques sensibles : limite par compte (strict) et
// garde-fou global par IP (large) — voir middlewares/rateLimit.js.
router.post('/login', authIpLimiter, loginLimiter, authController.login)
router.post('/verify-otp', authIpLimiter, otpLimiter, authController.verifyOtp)
router.post('/resend-otp', authIpLimiter, otpLimiter, authController.resendOtp)
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateMe);
router.put('/me/password', authenticate, authController.changeMyPassword);
router.post('/forgot-password', authIpLimiter, loginLimiter, authController.forgetPassword);
router.post('/reset-password', authIpLimiter, authController.resetPassword);

module.exports = router
