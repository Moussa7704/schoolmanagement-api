const { z, id, numeric, text, date, oneOf, bool } = require("./common");

// Schémas de la vie scolaire : évaluations, notes, présences, bulletins.
// Seule la FORME est vérifiée ici ; les règles métier (note ≤ barème de
// l'évaluation, élève inscrit dans la classe, accès à la classe…) restent
// dans les services.

const ASSESSMENT_TYPES = ["DEVOIR", "COMPOSITION"];
const SESSIONS = ["MORNING", "AFTERNOON"];
const STATUSES = ["PRESENT", "ABSENT", "LATE"];

const number = (rules) => numeric("doit être un nombre", (n) => rules(n.finite("doit être un nombre")));

// Note : 0 au minimum ; le maximum réel (barème de l'évaluation) est vérifié
// par le service, ici on ne bloque que les valeurs absurdes.
const score = number((n) => n.min(0, "ne peut pas être négative").max(1000, "est trop élevée"));
const coefficient = number((n) => n.positive("doit être supérieur à 0").max(100, "est trop élevé"));
const maxScore = number((n) => n.positive("doit être supérieur à 0").max(1000, "est trop élevé"));

// Motif d'absence : facultatif, peut être vidé ("" ou null).
const reason = z
    .string({ invalid_type_error: "doit être un texte" })
    .trim()
    .max(255, "ne doit pas dépasser 255 caractères")
    .nullable()
    .optional();

// --- Évaluations -----------------------------------------------------------

const createAssessment = {
    body: z.object({
        teacher_assignment_id: id,
        period_id: id,
        name: text(255),
        type: oneOf(ASSESSMENT_TYPES).optional(),
        coefficient: coefficient.optional(),
        max_score: maxScore.optional(),
        date: date.nullable().optional()
    })
};

const updateAssessment = {
    body: z.object({
        name: text(255).optional(),
        type: oneOf(ASSESSMENT_TYPES).optional(),
        coefficient: coefficient.optional(),
        max_score: maxScore.optional(),
        date: date.nullable().optional()
    })
};

// --- Notes -----------------------------------------------------------------

const createGrade = {
    body: z.object({
        assessment_id: id,
        student_id: id,
        score
    })
};

const updateGrade = {
    body: z.object({ score })
};

// --- Présences -------------------------------------------------------------

const createAttendance = {
    body: z.object({
        student_id: id,
        class_id: id,
        date,
        session: oneOf(SESSIONS),
        status: oneOf(STATUSES).optional(),
        justified: bool.optional(),
        reason
    })
};

const updateAttendance = {
    body: z.object({
        status: oneOf(STATUSES).optional(),
        justified: bool.optional(),
        reason
    })
};

const rollCall = {
    body: z.object({
        class_id: id,
        date,
        session: oneOf(SESSIONS),
        entries: z
            .array(
                z.object({
                    student_id: id,
                    status: oneOf(STATUSES).optional(),
                    justified: bool.optional(),
                    reason
                }),
                { required_error: "est requis", invalid_type_error: "doit être une liste" }
            )
            .min(1, "doit contenir au moins un élève")
            .max(500, "contient trop d'élèves")
    })
};

// Créneau d'appel (classe + date + séance), passé dans l'adresse.
const rollCallSlot = {
    query: z.object({ class_id: id, date, session: oneOf(SESSIONS) })
};

const attendanceStats = {
    query: z.object({ student_id: id, period_id: id })
};

// --- Bulletins -------------------------------------------------------------

const REPORT_CARD_TYPES = ["TRIMESTER", "ANNUAL"];

// Trimestriel : period_id requis. Annuel : academic_year_id requis.
const createReportCard = {
    body: z
        .object({
            student_id: id,
            type: oneOf(REPORT_CARD_TYPES).optional(),
            period_id: id.optional(),
            academic_year_id: id.optional()
        })
        .superRefine((value, ctx) => {
            if (value.type === "ANNUAL" && !value.academic_year_id) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["academic_year_id"], message: "est requis pour un bulletin annuel" });
            }
            if (value.type !== "ANNUAL" && !value.period_id) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["period_id"], message: "est requis pour un bulletin trimestriel" });
            }
        })
};

// Classement et bulletins d'une classe : la classe, et la période sauf pour
// l'annuel (type=ANNUAL : l'année est celle de la classe).
const classPeriodQuery = {
    query: z
        .object({
            class_id: id,
            period_id: id.optional(),
            type: oneOf(REPORT_CARD_TYPES).optional()
        })
        .superRefine((value, ctx) => {
            if (value.type !== "ANNUAL" && !value.period_id) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["period_id"], message: "est requis" });
            }
        })
};

module.exports = {
    createAssessment,
    updateAssessment,
    createGrade,
    updateGrade,
    createAttendance,
    updateAttendance,
    rollCall,
    rollCallSlot,
    attendanceStats,
    createReportCard,
    classPeriodQuery
};
