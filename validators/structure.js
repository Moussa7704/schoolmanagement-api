const { z, id, numeric, text, date, oneOf, optionalText, optionalEmail, phone, emptyToNull, time } = require("./common");

// Schémas de la structure de l'école : écoles, années scolaires, périodes,
// classes, matières, affectations des enseignants, emplois du temps.
// Seule la FORME est vérifiée ici ; les règles métier (accès à l'école,
// chevauchement d'horaires, période dans l'année…) restent dans les services.

const CYCLES = ["PRESCOLAIRE", "PRIMAIRE", "COLLEGE", "LYCEE", "SUPERIEUR"];
const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const ENROLLMENT_STATUSES = ["ACTIVE", "TRANSFERRED", "REPEATING", "WITHDRAWN"];

// school_id : seul le SUPER_ADMIN le choisit ; pour les autres comptes le
// service impose leur propre école, d'où un champ facultatif.
const schoolId = emptyToNull(id);

// --- Écoles ----------------------------------------------------------------

const schoolFields = {
    address: optionalText(255),
    phone,
    email: optionalEmail,
    academy: optionalText(255)
};

const createSchool = {
    body: z.object({ name: text(255), ...schoolFields })
};

const updateSchool = {
    body: z.object({ name: text(255).optional(), ...schoolFields })
};

// --- Années scolaires et périodes ------------------------------------------

const createAcademicYear = {
    body: z.object({ school_id: schoolId, label: text(100), start_date: date, end_date: date })
};

const updateAcademicYear = {
    body: z.object({ label: text(100).optional(), start_date: date.optional(), end_date: date.optional() })
};

const position = emptyToNull(numeric("doit être un nombre", (n) => n.int("doit être un nombre entier").min(1, "doit être au moins 1").max(20, "est trop élevée")));

const createPeriod = {
    body: z.object({ academic_year_id: id, label: text(100), start_date: date, end_date: date, position })
};

const updatePeriod = {
    body: z.object({ label: text(100).optional(), start_date: date.optional(), end_date: date.optional(), position })
};

// --- Classes ---------------------------------------------------------------

const classFields = {
    level: optionalText(100),
    cycle: emptyToNull(oneOf(CYCLES)),
    capacity: emptyToNull(numeric("doit être un nombre", (n) => n.int("doit être un nombre entier").min(1, "doit être au moins 1").max(1000, "est trop élevée")))
};

const createClass = {
    body: z.object({ academic_year_id: id, name: text(100), ...classFields })
};

const updateClass = {
    body: z.object({ name: text(100).optional(), ...classFields })
};

// Passage en classe supérieure : chaque élève vers sa classe de destination.
const promoteClass = {
    body: z.object({
        promotions: z
            .array(
                z.object({
                    student_id: id,
                    target_class_id: id,
                    status: oneOf(ENROLLMENT_STATUSES).optional()
                }),
                { required_error: "est requis", invalid_type_error: "doit être une liste" }
            )
            .min(1, "doit contenir au moins un élève")
            .max(500, "contient trop d'élèves")
    })
};

// --- Matières et affectations ----------------------------------------------

const coefficientDefault = emptyToNull(
    numeric("doit être un nombre", (n) => n.finite("doit être un nombre").positive("doit être supérieur à 0").max(100, "est trop élevé"))
);

const createSubject = {
    body: z.object({ school_id: schoolId, name: text(100), coefficient_default: coefficientDefault })
};

const updateSubject = {
    body: z.object({ name: text(100).optional(), coefficient_default: coefficientDefault })
};

const createTeacherAssignment = {
    body: z.object({ teacher_id: id, class_id: id, subject_id: id })
};

// --- Emplois du temps ------------------------------------------------------

const createSchedule = {
    body: z.object({
        teacher_assignment_id: id,
        day_of_week: oneOf(DAYS),
        start_time: time,
        end_time: time,
        room: optionalText(50)
    })
};

const updateSchedule = {
    body: z.object({
        teacher_assignment_id: id.optional(),
        day_of_week: oneOf(DAYS).optional(),
        start_time: time.optional(),
        end_time: time.optional(),
        room: optionalText(50)
    })
};

module.exports = {
    ENROLLMENT_STATUSES,
    schoolId,
    createSchool,
    updateSchool,
    createAcademicYear,
    updateAcademicYear,
    createPeriod,
    updatePeriod,
    createClass,
    updateClass,
    promoteClass,
    createSubject,
    updateSubject,
    createTeacherAssignment,
    createSchedule,
    updateSchedule
};
