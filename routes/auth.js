const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const { authenticate } = require("../middlewares/auth")
const { authIpLimiter, loginLimiter, otpLimiter, refreshLimiter } = require("../middlewares/rateLimit")

// Authentification. Routes publiques sensibles protégées contre les abus :
// limite stricte par compte / session, plus un garde-fou global large par IP
// (voir middlewares/rateLimit.js).
router.post('/login', authIpLimiter, loginLimiter, authController.login)
router.post('/verify-otp', authIpLimiter, otpLimiter, authController.verifyOtp)
router.post('/resend-otp', authIpLimiter, otpLimiter, authController.resendOtp)
// Pas de garde-fou global par IP ici : chaque utilisateur connecté rafraîchit sa
// session régulièrement, et une école entière derrière la même IP le dépasserait.
// /refresh exige de toute façon un cookie de session valide.
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, authController.updateMe);
router.put('/me/password', authenticate, authController.changeMyPassword);
router.post('/forgot-password', authIpLimiter, loginLimiter, authController.forgetPassword);
router.post('/reset-password', authIpLimiter, authController.resetPassword);

module.exports = router
