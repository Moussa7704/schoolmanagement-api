const { z, email, passwordInput, newPassword, text } = require("./common");

// Schémas des routes d'authentification (routes/auth.js et routes/user.js).

const otpToken = z
    .string({ required_error: "est requis (reconnectez-vous)", invalid_type_error: "est invalide" })
    .min(20, "est invalide")
    .max(2000, "est invalide");

module.exports = {
    login: { body: z.object({ email, password: passwordInput }) },

    verifyOtp: {
        body: z.object({
            otp_token: otpToken,
            code: z.string({ required_error: "est requis", invalid_type_error: "doit être un texte" })
                .regex(/^\d{6}$/, "doit contenir exactement 6 chiffres")
        })
    },

    resendOtp: { body: z.object({ otp_token: otpToken }) },

    forgotPassword: { body: z.object({ email }) },

    resetPassword: {
        body: z.object({
            token: z.string({ required_error: "est requis" }).min(20, "est invalide").max(2000, "est invalide"),
            password: newPassword,
            confirm_password: z.string({ required_error: "est requis" })
        }).refine((b) => b.password === b.confirm_password, {
            message: "ne correspond pas au mot de passe",
            path: ["confirm_password"]
        })
    },

    changeMyPassword: { body: z.object({ current_password: passwordInput, new_password: newPassword }) },

    updateMe: {
        body: z.object({
            first_name: text(100).optional(),
            last_name: text(100).optional(),
            phone: z.string().trim().max(30, "est trop long").optional().nullable(),
            email: email.optional()
        })
    },

    // Réinitialisation du mot de passe d'un utilisateur par un administrateur.
    adminChangePassword: { body: z.object({ new_password: newPassword }) }
};
