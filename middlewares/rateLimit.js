const { rateLimit } = require("express-rate-limit");

// Limites sur les routes d'authentification. Elles complètent les limites par
// compte du service (essais de code, renvois de code).
//
// Attention : dans une école, tous les appareils d'un même Wi-Fi sortent souvent
// sur Internet avec la MÊME adresse IP. Une limite stricte par IP seule bloquerait
// donc toute l'école à cause d'un seul utilisateur. D'où :
//   - des limites strictes par COMPTE (adresse e-mail ou session de connexion) + IP ;
//   - une limite globale par IP seulement très large, contre les attaques massives.
//
// En production derrière un proxy (Nginx, hébergeur…), activer
// app.set('trust proxy', 1) pour que l'IP réelle du client soit utilisée.
const WINDOW_MS = 15 * 60 * 1000;

const options = (message, limit, keyGenerator) => ({
    windowMs: WINDOW_MS,
    limit,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message },
    ...(keyGenerator ? { keyGenerator } : {})
});

const normalizedEmail = (req) => String(req.body?.email ?? "").trim().toLowerCase();

// Garde-fou global : 200 demandes / 15 min / IP, toutes routes d'auth confondues.
const authIpLimiter = rateLimit(
    options("Trop de demandes depuis votre réseau. Réessayez dans quelques minutes.", 200)
);

// Connexion et mot de passe oublié : 5 demandes / 15 min par adresse e-mail et par IP.
// Un compte qui se trompe ne bloque que lui-même, pas les autres comptes du réseau.
const loginLimiter = rateLimit(
    options(
        "Trop de tentatives pour ce compte. Réessayez dans quelques minutes.",
        5,
        (req) => `${req.ip}|${normalizedEmail(req)}`
    )
);

// Vérification et renvoi du code : 20 demandes / 15 min par session de connexion
// (jeton otp_token) et par IP. Les limites fines (5 essais, délai entre renvois)
// sont appliquées par le service sur le code lui-même.
const otpLimiter = rateLimit(
    options(
        "Trop de tentatives sur le code de connexion. Réessayez dans quelques minutes.",
        20,
        (req) => `${req.ip}|${String(req.body?.otp_token ?? "").slice(-32)}`
    )
);

// Rafraîchissement de session : 30 demandes / 15 min par session (cookie
// refreshToken) et par IP. Un onglet normal rafraîchit une fois par durée de vie
// du jeton d'accès (15 min) : 30 laisse une très large marge, mais empêche de
// marteler la route. Sans cookie, toutes les demandes d'une IP partagent un seul compteur.
const refreshLimiter = rateLimit(
    options(
        "Trop de demandes de session. Réessayez dans quelques minutes.",
        30,
        (req) => `${req.ip}|${String(req.cookies?.refreshToken ?? "").slice(-32)}`
    )
);

module.exports = { authIpLimiter, loginLimiter, otpLimiter, refreshLimiter };
