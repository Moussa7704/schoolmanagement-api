const { User, Otp, RefreshToken, PasswordReset, Role, Permission, School } = require("../models")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const { sendOtpEmail, sendResetEmail } = require('../utils/sendEmail');
const { generateAccessToken, generateRefreshToken, generateResetToken, verifyRefreshToken } = require("../utils/jwt");

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

class AuthService extends BaseService {
    constructor() {
        super(User);
    }

    _generateOtpCode() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async _issueTokens(user) {
        const data = {
            id: user.id,
            role: user.Role?.name,
            school_id: user.school_id
        };

        const accessToken = generateAccessToken(data);
        const refreshToken = generateRefreshToken(data);

        await RefreshToken.create({
            user_id: user.id,
            token: refreshToken,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)
        });

        return { accessToken, refreshToken };
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

        const code = this._generateOtpCode();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

        await Otp.create({
            user_id: user.id,
            code,
            type: "LOGIN",
            expires_at: expiresAt
        });

        await sendOtpEmail(user.email, code);

        return { user, expiresAt };
    }

    async verifyOtp(user_id, code) {
        const otp = await Otp.findOne({ where: { user_id, code } });

        if (!otp) {
            throw new HttpError("Otp invalide", 400);
        }
        if (new Date() > otp.expires_at) {
            throw new HttpError("OTP expiré", 400);
        }

        const user = await this.model.findByPk(otp.user_id, { include: ['Role'] });
        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 400);
        }

        const tokens = await this._issueTokens(user);
        await otp.destroy();

        return { user, ...tokens };
    }

    async resendOtp(user_id) {
        const user = await this.model.findByPk(user_id);
        if (!user) {
            throw new HttpError("Utilisateur non trouvé", 400);
        }

        await Otp.destroy({ where: { user_id } });

        const code = this._generateOtpCode();
        await Otp.create({
            user_id,
            type: "RESEND_OTP",
            code,
            expires_at: new Date(Date.now() + 10 * 60 * 1000)
        });

        await sendOtpEmail(user.email, code);
    }

    async refresh(refreshTokenValue) {
        if (!refreshTokenValue) {
            throw new HttpError("No token", 401);
        }

        const token = await RefreshToken.findOne({
            where: { token: refreshTokenValue, revoked: false }
        });

        if (!token) {
            throw new HttpError("Invalid refresh token", 403);
        }

        if (new Date() > token.expires_at) {
            throw new HttpError("Token expired", 403);
        }

        // Peut lever une erreur (signature invalide/expirée) : volontairement non
        // convertie en HttpError, pour retomber sur le message générique du controller.
        const decoded = verifyRefreshToken(refreshTokenValue);

        // Rotation : ce refresh token ne peut servir qu'une seule fois.
        token.revoked = true;
        await token.save();

        const user = await this.model.findByPk(decoded.id, { include: ['Role'] });

        if (!user || user.status !== 'active') {
            throw new HttpError("Utilisateur introuvable ou inactif", 403);
        }

        return this._issueTokens(user);
    }

    async logout(refreshTokenValue) {
        if (refreshTokenValue) {
            await RefreshToken.update(
                { revoked: true },
                { where: { token: refreshTokenValue } }
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
        if (!user) {
            throw new HttpError("Aucun utilisateur trouvé avec cette adresse email", 404);
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
