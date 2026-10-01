const { rateLimit } = require("express-rate-limit");

// Limites par adresse IP sur les routes d'authentification. Elles complètent les
// limites par compte du service (essais de code, renvois) : elles freinent aussi
// un attaquant qui essaie plusieurs comptes ou adresses e-mail à la suite.
//
// En production derrière un proxy (Nginx, hébergeur…), activer
// app.set('trust proxy', 1) pour que l'IP réelle du client soit utilisée.
const tooMany = (message) => ({
    windowMs: 15 * 60 * 1000,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message }
});

// Connexion (mot de passe) et mot de passe oublié : 10 demandes / 15 min / IP.
const loginLimiter = rateLimit({
    ...tooMany("Trop de tentatives de connexion. Réessayez dans quelques minutes."),
    limit: 10
});

// Vérification et renvoi du code : 20 demandes / 15 min / IP.
const otpLimiter = rateLimit({
    ...tooMany("Trop de tentatives sur le code de connexion. Réessayez dans quelques minutes."),
    limit: 20
});

module.exports = { loginLimiter, otpLimiter };
