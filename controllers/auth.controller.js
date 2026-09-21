const authService = require("../service/auth.service");
const { sendResponse } = require("../utils/message");

const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

const refreshCookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_MAX_AGE_MS
};

const login = async (req, res) => {
    try {
        const { user, expiresAt } = await authService.login(req.body.email, req.body.password);

        return res.status(200).json({
            message: "Veuillez verifier le code a 6 chiffre qui vous ete envoie votre adresse email ",
            user_id: user.id,
            email: user.email,
            expires_at: expiresAt
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        return res.status(500).json({ error: err.message });
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { accessToken, refreshToken } = await authService.verifyOtp(req.body.user_id, req.body.code);

        res.cookie("refreshToken", refreshToken, refreshCookieOptions);

        return res.json({
            message: "Connexion réussie",
            accessToken
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        return res.status(500).json({ error: err.message });
    }
}

const refresh = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        const { accessToken, refreshToken: newRefreshToken } = await authService.refresh(refreshToken);

        res.cookie("refreshToken", newRefreshToken, refreshCookieOptions);

        res.json({
            accessToken
        });
    } catch (err) {
        res.clearCookie("refreshToken", refreshCookieOptions);

        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        return res.status(403).json({
            message: "Invalid or expired token"
        });
    }
};

const logout = async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;

    await authService.logout(refreshToken);

    res.clearCookie("refreshToken", refreshCookieOptions);

    res.json({ message: "Logged out" });
};

const me = async (req, res) => {
    try {
        const user = await authService.getMe(req.user.id);

        return sendResponse(res, {
            message: "Utilisateur connecté",
            data: user,
            status: 200
        });
    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const updateMe = async (req, res) => {
    try {
        const updated = await authService.updateMe(req.user.id, req.body);

        return sendResponse(res, {
            message: "Profil mis à jour avec succès",
            data: updated,
            status: 200
        });
    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const changeMyPassword = async (req, res) => {
    try {
        const { current_password, new_password } = req.body;

        await authService.changePassword(req.user.id, current_password, new_password);

        return sendResponse(res, {
            message: "Mot de passe modifié avec succès",
            status: 200
        });
    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const forgetPassword = async (req, res) => {
    try {
        await authService.forgotPassword(req.body.email);

        return res.json({
            message: "Email de réinitialisation a été envoyé. Veuillez vérifier votre boîte de réception.",
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        return res.status(500).json({ error: err.message });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { token, password, confirm_password } = req.body;

        await authService.resetPassword(token, password, confirm_password);

        return res.json({ message: "Mot de passe réinitialisé avec succès" });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
        return res.status(500).json({ error: err.message });
    }
}

const resendOtp = async (req, res) => {
    try {
        await authService.resendOtp(req.body.user_id);

        return res.json({
            message: "OTP renvoyé avec succès"
        });
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ message: err.message });
        }
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
