const { z, id, numeric } = require("../middlewares/validate");

// Briques de validation réutilisées par les schémas de chaque module.

const email = z
    .string({ required_error: "est requis", invalid_type_error: "doit être un texte" })
    .trim()
    // Pas de mise en minuscules : les adresses déjà enregistrées avec des
    // majuscules ne pourraient plus se connecter.
    .email("doit être une adresse e-mail valide")
    .max(254, "est trop long");

// Mot de passe saisi (connexion) : on ne vérifie que la présence et une taille
// raisonnable, jamais la complexité (un ancien mot de passe doit rester valable).
const passwordInput = z
    .string({ required_error: "est requis", invalid_type_error: "doit être un texte" })
    .min(1, "est requis")
    .max(200, "est trop long");

// Nouveau mot de passe : même règle que les services (6 caractères minimum).
const newPassword = z
    .string({ required_error: "est requis", invalid_type_error: "doit être un texte" })
    .min(6, "doit contenir au moins 6 caractères")
    .max(200, "est trop long");

const text = (max, label = "doit être un texte") =>
    z.string({ required_error: "est requis", invalid_type_error: label }).trim().min(1, "est requis").max(max, `ne doit pas dépasser ${max} caractères`);

// Date au format AAAA-MM-JJ, et qui existe vraiment (pas de 2026-02-30).
const date = z
    .string({ required_error: "est requise", invalid_type_error: "doit être une date (AAAA-MM-JJ)" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "doit être une date au format AAAA-MM-JJ")
    .refine((value) => {
        // Format déjà signalé par la règle ci-dessus : pas de second message.
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return true;
        const d = new Date(`${value}T00:00:00Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
    }, "n'est pas une date valide");

// Montant en francs CFA : strictement positif, borné, 2 décimales au plus.
const amount = numeric("doit être un nombre", (n) =>
    n
        .finite("doit être un nombre")
        .positive("doit être supérieur à 0")
        .max(100000000, "est trop élevé")
        .refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, "ne doit pas avoir plus de 2 décimales")
);

module.exports = { z, id, numeric, email, passwordInput, newPassword, text, date, amount };
