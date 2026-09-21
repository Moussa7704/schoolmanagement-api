const { User, Otp, RefreshToken, PasswordReset } = require("../models")
const bcrypt = require("bcrypt")
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail, sendResetEmail } = require('../utils/sendEmail');
const { generateAccessToken, generateRefreshToken, generateResetToken, verifyRefreshToken } = require("../utils/jwt");
const { sendResponse } = require("../utils/message");

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS
};

const login = async (req, res) => {
    const payload = {
        email: req.body.email,
        password: req.body.password
    }

    const user = await User.findOne({ where: { email: payload.email } })

    if (!user) {
        return res.status(400).json({
            message: "votre addresse email ou mot de passe est incorrect"
        })
    }

    const validatedPassword = await bcrypt.compare(payload.password, user.password)

    if (!validatedPassword) {
        return res.status(400).json({
            message: "votre addresse email ou mot de passe est incorrect"
        })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    await Otp.create({
        user_id: user.id,
        code,
        type: "LOGIN",
        expires_at: expiresAt
    })

    await sendOtpEmail(user.email, code);

    res.status(200).json({
        message: "Veuillez verifier le code a 6 chiffre qui vous ete envoie votre adresse email ",
        user_id: user.id,
        email: user.email,
        expires_at: expiresAt
    });
}
const verifyOtp = async (req, res) => {
    try {
        const payload = {
            user_id: req.body.user_id,
            code: req.body.code
        }

        const otp = await Otp.findOne({ where: { user_id: payload.user_id, code: payload.code } })

        if (!otp) {
            return res.status(400).json({
                message: "Otp invalide"
            })
        }
        if (new Date() > otp.expires_at) {
            return res.status(400).json({
                message: "OTP expiré"
            });
        }
        const user = await User.findByPk(otp.user_id, {
            include: ['Role']
        })

        if (!user) {
            return res.status(400).json({
                message: "Utilisateur non trouvé"
            });
        }

        //  user.is_verified = true;
        // await user.save();
        const data = {
            id: user.id,
            role: user.Role?.name,
            school_id: user.school_id
        };
        const accessToken = generateAccessToken(data)
        const refreshToken = generateRefreshToken(data)

        await RefreshToken.create({
            user_id: user.id,
            token: refreshToken,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)
        })

        await otp.destroy()

        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        return res.json({
            message: "Connexion réussie",
            accessToken
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "No token" });
        }

        const token = await RefreshToken.findOne({
            where: { token: refreshToken, revoked: false }
        });

        if (!token) {
            res.clearCookie("refreshToken", refreshCookieOptions);
            return res.status(403).json({ message: "Invalid refresh token" });
        }

        if (new Date() > token.expires_at) {
            res.clearCookie("refreshToken", refreshCookieOptions);
            return res.status(403).json({ message: "Token expired" });
        }

        const decoded = verifyRefreshToken(refreshToken)

        // Rotation : ce refresh token ne peut servir qu'une seule fois.
        token.revoked = true;
        await token.save();

        const user = await User.findByPk(decoded.id, {
            include: ['Role']
        });

        if (!user || user.status !== 'active') {
            res.clearCookie("refreshToken", refreshCookieOptions);
            return res.status(403).json({ message: "Utilisateur introuvable ou inactif" });
        }

        const data = {
            id: user.id,
            role: user.Role?.name,
            school_id: user.school_id
        };

        const newAccessToken = generateAccessToken(data);
        const newRefreshToken = generateRefreshToken(data);

        await RefreshToken.create({
            user_id: user.id,
            token: newRefreshToken,
            expires_at: new Date(Date.now() + REFRESH_TOKEN_MAX_AGE_MS)
        });

        res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

        res.json({
            accessToken: newAccessToken
        });
    } catch (err) {
        res.clearCookie("refreshToken", refreshCookieOptions);
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};
const logout = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
        await RefreshToken.update(
            { revoked: true },
            { where: { token: refreshToken } }
        );
    }

    res.clearCookie("refreshToken", refreshCookieOptions);

    res.json({ message: "Logged out" });
};
const me = async (req, res) => {
    try {

        const user = await User.findByPk(req.user.id, {
            include: ["Role"],
            attributes: {
                exclude: ["password"]
            }
        });

        if (!user) {
            return sendResponse(res, {
                success: false,
                message: "Utilisateur introuvable",
                status: 404
            });
        }

        return sendResponse(res, {
            message: "Utilisateur connecté",
            data: user,
            status: 200
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: 500
        });

    }
};
const updateMe = async (req, res) => {
    try {

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return sendResponse(res, {
                success: false,
                message: "Utilisateur introuvable",
                status: 404
            });
        }

        const { first_name, last_name, phone, email } = req.body;

        if (email && email !== user.email) {

            const existing = await User.findOne({
                where: { email }
            });

            if (existing) {
                return sendResponse(res, {
                    success: false,
                    message: "Cette adresse email est déjà utilisée.",
                    status: 400
                });
            }

        }

        await user.update({
            first_name: first_name ?? user.first_name,
            last_name: last_name ?? user.last_name,
            phone: phone ?? user.phone,
            email: email ?? user.email
        });

        const updated = await User.findByPk(user.id, {
            include: ["Role"],
            attributes: {
                exclude: ["password"]
            }
        });

        return sendResponse(res, {
            message: "Profil mis à jour avec succès",
            data: updated,
            status: 200
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: 400
        });
    }
};
const changeMyPassword = async (req, res) => {
    try {

        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return sendResponse(res, {
                success: false,
                message: "Mot de passe actuel et nouveau mot de passe requis.",
                status: 400
            });
        }

        if (new_password.length < 6) {
            return sendResponse(res, {
                success: false,
                message: "Le nouveau mot de passe doit contenir au moins 6 caractères.",
                status: 400
            });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return sendResponse(res, {
                success: false,
                message: "Utilisateur introuvable",
                status: 404
            });
        }

        const validPassword = await bcrypt.compare(current_password, user.password);

        if (!validPassword) {
            return sendResponse(res, {
                success: false,
                message: "Mot de passe actuel incorrect.",
                status: 400
            });
        }

        const hashedPassword = await bcrypt.hash(new_password, 10);

        await user.update({
            password: hashedPassword
        });

        return sendResponse(res, {
            message: "Mot de passe modifié avec succès",
            status: 200
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: 400
        });
    }
};
const forgetPassword = async (req, res) => {
    try {
        const payload = {
            email: req.body.email
        }

        const user = await User.findOne({ where: { email: payload.email } });
        if (!user) {
            return res.status(404).json({ message: "Aucun utilisateur trouvé avec cette adresse email" });
        }

        // Supprimer anciens tokens
        await PasswordReset.destroy({
            where: { user_id: user.id }
        });

        // Generate a unique token for password reset
        const resetToken = generateResetToken({ id: user.id })


        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


        // Save the reset token in the database
        await PasswordReset.create({
            user_id: user.id,
            token: hashedToken,
            expires_at: new Date(Date.now() + 60 * 60 * 1000)
        });

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

        await sendResetEmail(user.email, resetLink);

        return res.json({
            message: "Email de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.",
        });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};
const resetPassword = async (req, res) => {
    try {
        const { token, password, confirm_password } = req.body;

        if (!token || !password || !confirm_password) {
            return res.status(400).json({ message: "Token et mot de passe requis" });
        }

        if (password !== confirm_password) {
            return res.status(400).json({ message: "Les mots de passe ne correspondent pas" });
        }

        // Vérifier et décoder le token JWT
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.RESET_SECRET);
        } catch (err) {
            return res.status(400).json({ message: "Token invalide ou expiré" });
        }

        //Hasher le token pour comparer avec la DB
        const hashedToken = crypto
            .createHash("sha256")
            .update(token)
            .digest("hex");

        // Chercher en base
        const resetRecord = await PasswordReset.findOne({
            where: { token: hashedToken }
        });

        if (!resetRecord) {
            return res.status(400).json({ message: "Token invalide" });
        }

        // Vérifier expiration
        if (new Date() > new Date(resetRecord.expires_at)) {
            return res.status(400).json({ message: "Token expiré" });
        }

        //Trouver utilisateur
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        //Hasher nouveau mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);

        // Mise à jour
        user.password = hashedPassword;
        await user.save();

        //Supprimer le token après utilisation
        await PasswordReset.destroy({
            where: { user_id: user.id }
        });

        return res.json({ message: "Mot de passe réinitialisé avec succès" });

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
const resendOtp = async (req, res) => {
    try {
        const { user_id } = req.body;

        const user = await User.findByPk(user_id);

        if (!user) {
            return res.status(400).json({
                message: "Utilisateur non trouvé"
            });
        }

        //supprimer anciens OTP
        await Otp.destroy({
            where: { user_id }
        });

        //générer nouveau code
        const code = Math.floor(
            100000 + Math.random() * 900000
        ).toString();

        //créer nouveau OTP
        await Otp.create({
            user_id,
            type: "RESEND_OTP",
            code,
            expires_at: new Date(Date.now() + 10 * 60 * 1000)
        });

        //envoyer email ou SMS
        await sendOtpEmail(user.email, code);

        return res.json({
            message: "OTP renvoyé avec succès"
        });

    } catch (err) {
        return res.status(500).json({
            error: err.message
        });
    }
};
module.exports = {
    login,
    verifyOtp,
    refresh,
    logout,
    me,
    updateMe,
    changeMyPassword,
    forgetPassword,
    resetPassword,
    resendOtp

}