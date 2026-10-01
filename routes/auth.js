const express = require("express")
const router = express.Router()

const authController = require("../controllers/auth.controller")
const { authenticate } = require("../middlewares/auth")
const { authIpLimiter, loginLimiter, otpLimiter, refreshLimiter } = require("../middlewares/rateLimit")
const { validate } = require("../middlewares/validate")
const schemas = require("../validators/auth")

// Authentification. Routes publiques sensibles protégées contre les abus :
// limite stricte par compte / session, plus un garde-fou global large par IP
// (voir middlewares/rateLimit.js). La validation des données vient APRÈS les
// limites : une avalanche de requêtes invalides est quand même freinée.
router.post('/login', authIpLimiter, loginLimiter, validate(schemas.login), authController.login)
router.post('/verify-otp', authIpLimiter, otpLimiter, validate(schemas.verifyOtp), authController.verifyOtp)
router.post('/resend-otp', authIpLimiter, otpLimiter, validate(schemas.resendOtp), authController.resendOtp)
// Pas de garde-fou global par IP ici : chaque utilisateur connecté rafraîchit sa
// session régulièrement, et une école entière derrière la même IP le dépasserait.
// /refresh exige de toute façon un cookie de session valide.
router.post('/refresh', refreshLimiter, authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);
router.put('/me', authenticate, validate(schemas.updateMe), authController.updateMe);
router.put('/me/password', authenticate, validate(schemas.changeMyPassword), authController.changeMyPassword);
router.post('/forgot-password', authIpLimiter, loginLimiter, validate(schemas.forgotPassword), authController.forgetPassword);
router.post('/reset-password', authIpLimiter, validate(schemas.resetPassword), authController.resetPassword);

module.exports = router
