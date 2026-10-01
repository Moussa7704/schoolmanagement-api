const { User, Otp, RefreshToken, PasswordReset, Role, Permission, School, sequelize } = require("../models")
const { Op } = require("sequelize");
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const { sendOtpEmail, sendResetEmail } = require('../utils/sendEmail');
const {
    generateAccessToken, generateRefreshToken, generateResetToken, verifyRefreshToken,
    generateOtpChallengeToken, verifyOtpChallengeToken
} = require("../utils/jwt");

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Règles des codes de connexion (OTP).
const OTP_TYPE = "LOGIN";                 // seul type accepté pour se connecter
const OTP_TTL_MS = 10 * 60 * 1000;        // validité d'un code
const OTP_MAX_ATTEMPTS = 5;               // mauvais codes avant invalidation
const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // délai minimum entre deux envois
const OTP_MAX_SENDS = 5;                  // envois max pour une même connexion

// Message unique pour tout jeton de connexion absent, expiré ou falsifié.
const CHALLENGE_ERROR = "Session de connexion expirée. Veuillez vous reconnecter.";

class AuthService extends BaseService {
    constructor() {
        super(User);
    }

    // Générateur cryptographique (Math.random() n'est pas fait pour la sécurité).
    _generateOtpCode() {
        return crypto.randomInt(100000, 1000000).toString();
    }

    // Code en clair en base : réservé au développement (tests avec de fausses
    // adresses e-mail, on lit le code directement dans la table Otps). Il faut
    // l'activer explicitement (OTP_DEV_PLAIN_CODES=true) et il est refusé d'office
    // en production : un oubli de configuration ne peut jamais exposer les codes.
    _plainOtpAllowed() {
        return process.env.OTP_DEV_PLAIN_CODES === "true" && process.env.NODE_ENV !== "production";
    }

    // En temps normal, le code n'est jamais stocké en clair : HMAC avec une clé
    // serveur, lié à l'utilisateur (un même code chez deux utilisateurs donne
    // deux empreintes).
    _hashOtpCode(userId, code) {
        return crypto
            .createHmac("sha256", `${process.env.ACCESS_SECRET}::otp`)
            .update(`${userId}:${code}`)
            .digest("hex");
    }

    _storedOtpCode(userId, code) {
        return this._plainOtpAllowed() ? code : this._hashOtpCode(userId, code);
    }

    // Compare le code saisi à la valeur en base, en temps constant. Une valeur en
    // clair (6 chiffres) n'est acceptée que si le mode développement est actif.
    _otpMatches(stored, userId, code) {
        const isPlain = /^\d{6}$/.test(stored);
        if (isPlain && !this._plainOtpAllowed()) {
            return false;
        }
        const expected = isPlain ? Buffer.from(stored) : Buffer.from(stored, "hex");
        const received = isPlain ? Buffer.from(code) : Buffer.from(this._hashOtpCode(userId, code), "hex");
        return expected.length === received.length && crypto.timingSafeEqual(expected, received);
    }

    _userIdFromChallenge(otpToken) {
        if (!otpToken) {
            throw new HttpError(CHALLENGE_ERROR, 401);
        }
        try {
            return verifyOtpChallengeToken(otpToken).id;
        } catch (err) {
            throw new HttpError(CHALLENGE_ERROR, 401);
        }
    }

    // Crée le code d'une connexion, après avoir supprimé tous les précédents :
    // un seul code valable à la fois par utilisateur.
    async _issueLoginOtp(user, sendCount = 1) {
        await Otp.destroy({ where: { user_id: user.id } });

        const code = this._generateOtpCode();
        const expiresAt = new Date(Date.now() + OTP_TTL_MS);
        await Otp.create({
            user_id: user.id,
            code: this._storedOtpCode(user.id, code),
            type: OTP_TYPE,
            expires_at: expiresAt,
            attempts: 0,
            send_count: sendCount
        });

        await sendOtpEmail(user.email, code);
        return expiresAt;
    }

    // `transaction` (facultatif) : permet d'émettre le nouveau jeton dans la même
    // transaction que la révocation de l'ancien (rotation atomique, voir refresh).
    async _issueTokens(user, transaction = undefined) {
        const data = {
            id: user.id,
            role: user.Role?.name,
            school_id: user.school_id
        };

        const accessToken = generateAccessToken(data);
        const refreshToken = generateRefreshToken(data);

        // Jetons révoqués ou expirés de l'utilisateur : inutiles, on fait le ménage.
        await RefreshToken.destroy({
            where: {
                user_id: user.id,
                [Op.or]: [{ revoked: true }, { expires_at: { [Op.lt]: new Date() } }]
            },
            transaction
        });

        // Seul le hash est stocké : une fuite de la base ne donne aucun jeton utilisable.
        await RefreshToken.create({
            user_id: user.id,
            token: this._hashRefreshToken(refreshToken),
            expires_at: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)
        }, { transaction });

        return { accessToken, refreshToken };
    }

    _hashRefreshToken(token) {
        return crypto.createHash("sha256").update(token).digest("hex");
    }

    async login(email, password) {
        const user = await this.model.findOne({ where: { email } });

        if (!user) {
            throw new HttpError("votre addresse email ou mot de passe est incorrect", 400);
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            throw new HttpError("votre addresse email ou mot de passe est incorrect", 400);
        }
        // Inutile d'envoyer un code à un compte qui ne pourra pas se connecter.
        if (user.status !== "active") {
            throw new HttpError("Ce compte est désactivé. Contactez l'administration de l'école.", 403);
        }

        const expiresAt = await this._issueLoginOtp(user);

        // Le client garde ce jeton (et non l'identifiant de l'utilisateur) pour
        // vérifier ou renvoyer le code.
        return { user, expiresAt, otpToken: generateOtpChallengeToken(user.id) };
    }

    async verifyOtp(otpToken, code) {
        const userId = this._userIdFromChallenge(otpToken);

        if (!code || !/^\d{6}$/.test(String(code))) {
            throw new HttpError("Le code doit contenir 6 chiffres.", 400);
        }

        // Un code expiré ou épuisé n'est pas supprimé ici : il est conservé pour
        // que le renvoi applique toujours son délai et son compteur d'envois
        // (sinon 5 essais → renvoi immédiat → 5 essais… sans fin).
        const otp = await Otp.findOne({ where: { user_id: userId, type: OTP_TYPE } });
        if (!otp || new Date() > otp.expires_at) {
            throw new HttpError("Code expiré. Demandez un nouveau code.", 400);
        }
        if (otp.attempts >= OTP_MAX_ATTEMPTS) {
            throw new HttpError("Trop de codes incorrects. Demandez un nouveau code ou reconnectez-vous.", 429);
        }

        if (!this._otpMatches(otp.code, userId, String(code))) {
            const attempts = otp.attempts + 1;
            await otp.update({ attempts });
            if (attempts >= OTP_MAX_ATTEMPTS) {
                // Trop d'essais : le code est bloqué (même le bon ne passera plus).
                throw new HttpError("Trop de codes incorrects. Demandez un nouveau code ou reconnectez-vous.", 429);
            }
            throw new HttpError(`Code incorrect. Il vous reste ${OTP_MAX_ATTEMPTS - attempts} essai(s).`, 400);
        }

        const user = await this.model.findByPk(userId, { include: ['Role'] });
        if (!user || user.status !== "active") {
            await otp.destroy();
            throw new HttpError(CHALLENGE_ERROR, 401);
        }

        // Code à usage unique : détruit avant d'émettre les jetons.
        await otp.destroy();
        const tokens = await this._issueTokens(user);

        return { user, ...tokens };
    }

    async resendOtp(otpToken) {
        const userId = this._userIdFromChallenge(otpToken);

        const user = await this.model.findByPk(userId);
        if (!user || user.status !== "active") {
            throw new HttpError(CHALLENGE_ERROR, 401);
        }

        const current = await Otp.findOne({ where: { user_id: userId, type: OTP_TYPE } });
        if (current) {
            const waitMs = current.createdAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
            if (waitMs > 0) {
                throw new HttpError(`Veuillez patienter ${Math.ceil(waitMs / 1000)} seconde(s) avant de redemander un code.`, 429);
            }
            if (current.send_count >= OTP_MAX_SENDS) {
                throw new HttpError("Trop de codes demandés. Veuillez vous reconnecter.", 429);
            }
        }

        // Le compteur d'envois suit la même connexion ; il repart à 1 seulement
        // après une nouvelle saisie du mot de passe (login).
        return this._issueLoginOtp(user, (current?.send_count ?? 0) + 1);
    }

    async refresh(refreshTokenValue) {
        if (!refreshTokenValue) {
            throw new HttpError("No token", 401);
        }

        // Signature et expiration du JWT d'abord : un jeton falsifié ne touche
        // jamais la base. Erreur volontairement non convertie en HttpError, pour
        // retomber sur le message générique du controller.
        const decoded = verifyRefreshToken(refreshTokenValue);
        const tokenHash = this._hashRefreshToken(refreshTokenValue);

        const t = await sequelize.transaction();
        try {
            // Rotation atomique : la révocation n'aboutit que si le jeton est encore
            // valide AU MOMENT de l'écriture (condition évaluée par la base). Deux
            // requêtes simultanées avec le même jeton : une seule obtient 1 ligne
            // modifiée, l'autre 0 et est refusée — jamais deux nouveaux jetons.
            const [revokedCount] = await RefreshToken.update(
                { revoked: true },
                {
                    where: {
                        token: tokenHash,
                        user_id: decoded.id,
                        revoked: false,
                        expires_at: { [Op.gt]: new Date() }
                    },
                    transaction: t
                }
            );
            if (revokedCount !== 1) {
                throw new HttpError("Session expirée. Veuillez vous reconnecter.", 403);
            }

            const user = await this.model.findByPk(decoded.id, { include: ['Role'], transaction: t });
            if (!user || user.status !== 'active') {
                throw new HttpError("Utilisateur introuvable ou inactif", 403);
            }

            // Nouveau jeton émis dans la même transaction : si quoi que ce soit
            // échoue, l'ancien jeton n'est pas révoqué pour autant.
            const tokens = await this._issueTokens(user, t);
            await t.commit();
            return tokens;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }

    async logout(refreshTokenValue) {
        if (refreshTokenValue) {
            await RefreshToken.update(
                { revoked: true },
                { where: { token: this._hashRefreshToken(refreshTokenValue) } }
            );
        }
    }

    async getMe(userId) {
        const user = await this.model.findByPk(userId, {
            include: [{
                model: Role, as: 'Role',
                include: [{ model: Permission, as: 'Permissions' }]
            }, {
                model: School, as: 'School'
            }],
            attributes: { exclude: ["password"] }
        });

        if (!user) {
            throw new HttpError("Utilisateur introuvable", 404);
        }

        return user;
    }

    async updateMe(userId, data) {
        const user = await this.model.findByPk(userId);
        if (!user) {
            throw new HttpError("Utilisateur introuvable", 404);
        }

        const { first_name, last_name, phone, email } = data;

        if (email && email !== user.email) {
            const existing = await this.model.findOne({ where: { email } });
            if (existing) {
                throw new HttpError("Cette adresse email est déjà utilisée.", 400);
            }
        }

        await user.update({
            first_name: first_name ?? user.first_name,
            last_name: last_name ?? user.last_name,
            phone: phone ?? user.phone,
            email: email ?? user.email
        });

        return this.model.findByPk(user.id, {
            include: ["Role", "School"],
            attributes: { exclude: ["password"] }
        });
    }

    async changePassword(userId, current_password, new_password) {
        if (!current_password || !new_password) {
            throw new HttpError("Mot de passe actuel et nouveau mot de passe requis.", 400);
        }

        if (new_password.length < 6) {
            throw new HttpError("Le nouveau mot de passe doit contenir au moins 6 caractères.", 400);
        }

        const user = await this.model.findByPk(userId);
        if (!user) {
            throw new HttpError("Utilisateur introuvable", 404);
        }

        const validPassword = await bcrypt.compare(current_password, user.password);
        if (!validPassword) {
            throw new HttpError("Mot de passe actuel incorrect.", 400);
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await user.update({ password: hashedPassword });
    }

    async forgotPassword(email) {
        const user = await this.model.findOne({ where: { email } });
        // Même réponse que l'adresse existe ou non : ne pas révéler quels
        // e-mails ont un compte.
        if (!user) {
            return;
        }

        await PasswordReset.destroy({ where: { user_id: user.id } });

        const resetToken = generateResetToken({ id: user.id });
        const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        await PasswordReset.create({
            user_id: user.id,
            token: hashedToken,
            expires_at: new Date(Date.now() + 60 * 60 * 1000)
        });

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        await sendResetEmail(user.email, resetLink);
    }

    async resetPassword(token, password, confirm_password) {
        if (!token || !password || !confirm_password) {
            throw new HttpError("Token et mot de passe requis", 400);
        }

        if (password !== confirm_password) {
            throw new HttpError("Les mots de passe ne correspondent pas", 400);
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.RESET_SECRET);
        } catch (err) {
            throw new HttpError("Token invalide ou expiré", 400);
        }

        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
        const resetRecord = await PasswordReset.findOne({ where: { token: hashedToken } });

        if (!resetRecord) {
            throw new HttpError("Token invalide", 400);
        }

        if (new Date() > new Date(resetRecord.expires_at)) {
            throw new HttpError("Token expiré", 400);
        }

        const user = await this.model.findByPk(decoded.id);
        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 404);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        await user.save();

        await PasswordReset.destroy({ where: { user_id: user.id } });
    }
}

module.exports = new AuthService();
