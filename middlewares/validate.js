const { z } = require("zod");

// Couche de validation des entrées (Zod) : une requête mal formée est refusée
// dès l'entrée, avant d'atteindre le contrôleur, le service ou la base.
// Les règles métier (« élève inscrit dans la classe »…) restent dans les
// services : cette couche ne vérifie que la FORME des données.

// Conversion en nombre ("12" → 12) qui distingue un champ absent ou vide
// (« est requis ») d'une valeur non numérique, là où z.coerce confond les deux.
const toNumber = (value) => (value === undefined || value === null || value === "" ? undefined : Number(value));
// numeric("message", (n) => n.min(0)) : nombre avec ses règles propres.
const numeric = (invalidMessage, rules = (n) => n) =>
    z.preprocess(toNumber, rules(z.number({ required_error: "est requis", invalid_type_error: invalidMessage })));

// Identifiant de base de données : entier strictement positif.
const id = numeric("doit être un identifiant numérique", (n) =>
    n.int("doit être un nombre entier").positive("doit être un identifiant positif")
);

// Nom du champ affiché : « amount » pour un champ de formulaire (corps de la
// requête), « query.class_id » / « params.id » pour l'adresse.
const formatIssues = (issues, source) =>
    issues.map((issue) => ({
        champ: [...(source === "body" ? [] : [source]), ...issue.path].join(".") || source,
        message: issue.message
    }));

const reject = (res, errors) =>
    res.status(400).json({
        message: `Données invalides : ${errors.map((e) => `${e.champ} ${e.message}`).join(" ; ")}`,
        errors
    });

// validate({ params, query, body }) : chaque partie fournie est vérifiée avec
// son schéma Zod. Les valeurs converties (ex. "12" → 12) sont rangées dans
// req.validated ; le corps (body) est en plus REMPLACÉ par sa version validée :
// champs nettoyés et convertis, champs inconnus retirés. req.query reste
// intact (lecture seule sous Express 5).
const validate = (schemas) => (req, res, next) => {
    const errors = [];
    req.validated = req.validated ?? {};
    for (const source of ["params", "query", "body"]) {
        if (!schemas[source]) continue;
        const result = schemas[source].safeParse(req[source] ?? {});
        if (result.success) {
            req.validated[source] = result.data;
            if (source === "body") req.body = result.data;
        } else {
            errors.push(...formatIssues(result.error.issues, source));
        }
    }
    if (errors.length) {
        return reject(res, errors);
    }
    return next();
};

// router.param("id", validateIdParam) : tout « :id » d'une adresse doit être un
// entier positif (« /students/abc », « /students/-1 », « /students/1.5 » → 400).
const validateIdParam = (req, res, next, value, name) => {
    const result = id.safeParse(value);
    if (!result.success) {
        return reject(res, formatIssues(result.error.issues, `params.${name}`));
    }
    return next();
};

// Filtres de liste (?class_id=…, ?student_id=…) : tout paramètre de requête qui
// se termine par « _id » doit être un seul entier positif. Appliqué à toute l'API.
const validateQueryIds = (req, res, next) => {
    const errors = [];
    for (const [key, value] of Object.entries(req.query ?? {})) {
        if (!key.endsWith("_id")) continue;
        if (Array.isArray(value) || typeof value === "object") {
            errors.push({ champ: `query.${key}`, message: "ne doit être indiqué qu'une seule fois" });
            continue;
        }
        const result = id.safeParse(value);
        if (!result.success) {
            errors.push(...formatIssues(result.error.issues, `query.${key}`));
        }
    }
    return errors.length ? reject(res, errors) : next();
};

module.exports = { z, id, numeric, validate, validateIdParam, validateQueryIds };
