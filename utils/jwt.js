require('dotenv').config()
const jwt = require('jsonwebtoken')
const crypto = require('crypto')

const generateAccessToken = (payload) => {
    return jwt.sign(payload, process.env.ACCESS_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
        // Identifiant unique : sans lui, deux jetons émis dans la même seconde
        // pour le même utilisateur seraient identiques, et l'ancien jeton
        // resterait valable après la rotation.
        jwtid: crypto.randomUUID()
    })
}

const generateResetToken = (payload) => {
  return jwt.sign(payload, process.env.RESET_SECRET, {
    expiresIn: process.env.JWT_RESET_EXPIRES_IN || '1h',
  });
};

// Jeton de connexion en attente d'OTP : remis après le mot de passe, exigé pour
// vérifier ou renvoyer le code (le client n'envoie plus jamais un user_id brut).
// Clé dérivée distincte de ACCESS_SECRET : ce jeton ne peut jamais servir de
// jeton d'accès, et un jeton d'accès ne peut jamais servir ici.
const otpChallengeSecret = () => `${process.env.ACCESS_SECRET}::login-otp-challenge`

const generateOtpChallengeToken = (userId) => {
    return jwt.sign({ id: userId, purpose: 'LOGIN_OTP' }, otpChallengeSecret(), {
        expiresIn: '15m'
    })
}

const verifyOtpChallengeToken = (token) => {
    const decoded = jwt.verify(token, otpChallengeSecret())
    if (decoded.purpose !== 'LOGIN_OTP') {
        throw new Error('Invalid challenge token purpose')
    }
    return decoded
}

const verifyAccessToken = (token) => {
    return jwt.verify(token, process.env.ACCESS_SECRET)
}

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.REFRESH_SECRET)
}
module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    generateResetToken,
    generateOtpChallengeToken,
    verifyOtpChallengeToken
}