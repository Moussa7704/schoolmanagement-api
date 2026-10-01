const { z, id, text, email, newPassword, date, oneOf, bool, optionalText, optionalEmail, phone, emptyToNull } = require("./common");
const { ENROLLMENT_STATUSES, schoolId } = require("./structure");

// Schémas des personnes : élèves, enseignants, tuteurs, inscriptions, liens
// élève-tuteur, comptes utilisateurs et rôles.
// Seule la FORME est vérifiée ici ; les règles métier (adresse e-mail déjà
// utilisée, élève de la même école que la classe, rôle autorisé…) restent
// dans les services.

const GENDERS = ["M", "F"];
const RELATIONSHIPS = ["PERE", "MERE", "TUTEUR", "AUTRE"];
const USER_STATUSES = ["active", "inactive", "suspended", "pending"];

const name = text(100);
const gender = emptyToNull(oneOf(GENDERS));
const optionalDate = emptyToNull(date);

// Ouverture d'un compte de connexion pour un élève ou un tuteur existant.
const grantAccess = {
    body: z.object({ email, password: newPassword })
};

// --- Élèves ----------------------------------------------------------------

const studentFields = {
    student_number: optionalText(50),
    date_of_birth: optionalDate,
    gender
};

const createStudent = {
    body: z.object({ school_id: schoolId, first_name: name, last_name: name, ...studentFields })
};

const updateStudent = {
    body: z.object({ first_name: name.optional(), last_name: name.optional(), ...studentFields })
};

// --- Enseignants -----------------------------------------------------------

const teacherFields = {
    specialty: optionalText(100),
    hire_date: optionalDate,
    employee_number: optionalText(50),
    gender
};

const createTeacher = {
    body: z.object({
        school_id: schoolId,
        first_name: name,
        last_name: name,
        email,
        password: newPassword,
        phone,
        ...teacherFields
    })
};

const updateTeacher = {
    body: z.object(teacherFields)
};

// --- Tuteurs / parents -----------------------------------------------------

const guardianFields = {
    phone,
    email: optionalEmail,
    address: optionalText(255)
};

const createGuardian = {
    body: z.object({ first_name: name, last_name: name, ...guardianFields })
};

const updateGuardian = {
    body: z.object({ first_name: name.optional(), last_name: name.optional(), ...guardianFields })
};

const attachGuardian = {
    body: z.object({
        student_id: id,
        guardian_id: id,
        relationship: oneOf(RELATIONSHIPS),
        is_primary_contact: bool.optional()
    })
};

// --- Inscriptions ----------------------------------------------------------

const enrollmentFields = {
    status: oneOf(ENROLLMENT_STATUSES).optional(),
    enrollment_date: optionalDate,
    registration_number: optionalText(50)
};

const createEnrollment = {
    body: z.object({ student_id: id, class_id: id, ...enrollmentFields })
};

const updateEnrollment = {
    body: z.object(enrollmentFields)
};

// --- Comptes utilisateurs et rôles -----------------------------------------

const createUser = {
    body: z.object({
        school_id: schoolId,
        first_name: name,
        last_name: name,
        email,
        password: newPassword,
        phone,
        // Le service vérifie que ce rôle peut être attribué par cette route.
        role: text(50)
    })
};

const updateUser = {
    body: z.object({
        first_name: name.optional(),
        last_name: name.optional(),
        email: email.optional(),
        phone
    })
};

const changeUserStatus = {
    body: z.object({ status: oneOf(USER_STATUSES) })
};

const updateRolePermissions = {
    body: z.object({
        permission_ids: z
            .array(id, { required_error: "est requis", invalid_type_error: "doit être une liste" })
            .max(500, "contient trop de permissions")
    })
};

module.exports = {
    grantAccess,
    createStudent,
    updateStudent,
    createTeacher,
    updateTeacher,
    createGuardian,
    updateGuardian,
    attachGuardian,
    createEnrollment,
    updateEnrollment,
    createUser,
    updateUser,
    changeUserStatus,
    updateRolePermissions
};
