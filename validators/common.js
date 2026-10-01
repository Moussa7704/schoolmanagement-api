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

// Valeur parmi une liste fixe (statuts, séances, cycles…).
const oneOf = (values) =>
    z.enum(values, {
        errorMap: () => ({ message: `doit valoir ${values.join(", ")}` })
    });

const bool = z.boolean({ invalid_type_error: "doit valoir true ou false" });

// --- Champs facultatifs de formulaire -------------------------------------
// Un champ laissé vide arrive absent, à null ou à "" selon le formulaire.

// Texte libre : "" reste "" (les services s'en servent pour effacer le champ).
const optionalText = (max) =>
    z
        .string({ invalid_type_error: "doit être un texte" })
        .trim()
        .max(max, `ne doit pas dépasser ${max} caractères`)
        .nullable()
        .optional();

// E-mail facultatif : vide accepté, sinon une adresse valide.
const optionalEmail = z
    .string({ invalid_type_error: "doit être un texte" })
    .trim()
    .max(254, "est trop long")
    .refine((value) => value === "" || email.safeParse(value).success, "doit être une adresse e-mail valide")
    .nullable()
    .optional();

// Téléphone facultatif : chiffres, espaces, +, -, ., parenthèses.
const phone = z
    .string({ invalid_type_error: "doit être un texte" })
    .trim()
    .max(30, "ne doit pas dépasser 30 caractères")
    .regex(/^[0-9+().\s-]*$/, "ne doit contenir que des chiffres, espaces, +, -, . ou parenthèses")
    .nullable()
    .optional();

// Date, choix ou nombre facultatif : "" vaut « non renseigné » (null).
const emptyToNull = (schema) => z.preprocess((value) => (value === "" ? null : value), schema.nullable().optional());

// Heure HH:mm ou HH:mm:ss, et qui existe (pas de 25:00).
const time = z
    .string({ required_error: "est requise", invalid_type_error: "doit être une heure (HH:mm)" })
    .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, "doit être une heure valide au format HH:mm");

module.exports = {
    z, id, numeric, email, passwordInput, newPassword, text, date, amount,
    oneOf, bool, optionalText, optionalEmail, phone, emptyToNull, time
};
