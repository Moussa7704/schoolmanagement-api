const ExcelJS = require("exceljs");
const archiver = require("archiver");
const {
    School, AcademicYear, Class, Student, Teacher, Subject, Enrollment,
    TeacherAssignment, Assessment, Grade, ReportCard, Attendance,
    TuitionFee, Payment, Schedule, Guardian, StudentGuardian, User
} = require("../models");
const HttpError = require("../utils/httpError");

const TUITION_STATUS_LABELS = {
    PAID: "Payée",
    OVERDUE: "En retard",
    PARTIAL: "Partiellement payée",
    PENDING: "En attente"
};

function mapById(records) {
    const map = new Map();
    for (const r of records) {
        map.set(r.id, r);
    }
    return map;
}

function fullName(record) {
    if (!record) return "";
    return `${record.first_name || ""} ${record.last_name || ""}`.trim();
}

// Construit un classeur à une seule feuille — chaque module de l'export en
// génère un plutôt qu'un classeur unique à onglets multiples (décision utilisateur).
async function buildWorkbook(sheetName, columns, rows) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.columns = columns.map((c) => ({ header: c.header, key: c.key, width: c.width || 20 }));
    sheet.getRow(1).font = { bold: true };
    for (const row of rows) {
        sheet.addRow(row);
    }
    return workbook.xlsx.writeBuffer();
}

class SchoolExportService {
    async exportSchoolData(schoolId) {
        const school = await School.findByPk(schoolId);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }

        // Récupère toute la donnée liée à l'école en traversant la chaîne de FK,
        // en Maps plutôt qu'avec des `include` — plus simple à croiser entre
        // modules sans dépendre des alias d'association.
        const [students, teachers, subjects, academicYears] = await Promise.all([
            Student.findAll({ where: { school_id: schoolId } }),
            Teacher.findAll({ where: { school_id: schoolId } }),
            Subject.findAll({ where: { school_id: schoolId } }),
            AcademicYear.findAll({ where: { school_id: schoolId } })
        ]);

        const studentIds = students.map((s) => s.id);
        const academicYearIds = academicYears.map((a) => a.id);

        const classes = academicYearIds.length
            ? await Class.findAll({ where: { academic_year_id: academicYearIds } })
            : [];

        const teacherAssignments = academicYearIds.length
            ? await TeacherAssignment.findAll({ where: { academic_year_id: academicYearIds } })
            : [];
        const teacherAssignmentIds = teacherAssignments.map((ta) => ta.id);

        const [enrollments, tuitionFees, reportCards, attendances, assessments, grades, schedules, studentGuardians] = await Promise.all([
            academicYearIds.length ? Enrollment.findAll({ where: { academic_year_id: academicYearIds } }) : [],
            studentIds.length ? TuitionFee.findAll({ where: { student_id: studentIds } }) : [],
            studentIds.length ? ReportCard.findAll({ where: { student_id: studentIds } }) : [],
            studentIds.length ? Attendance.findAll({ where: { student_id: studentIds } }) : [],
            teacherAssignmentIds.length ? Assessment.findAll({ where: { teacher_assignment_id: teacherAssignmentIds } }) : [],
            studentIds.length ? Grade.findAll({ where: { student_id: studentIds } }) : [],
            teacherAssignmentIds.length ? Schedule.findAll({ where: { teacher_assignment_id: teacherAssignmentIds } }) : [],
            studentIds.length ? StudentGuardian.findAll({ where: { student_id: studentIds } }) : []
        ]);

        const tuitionFeeIds = tuitionFees.map((tf) => tf.id);
        const payments = tuitionFeeIds.length
            ? await Payment.findAll({ where: { tuition_fee_id: tuitionFeeIds } })
            : [];

        const guardianIds = [...new Set(studentGuardians.map((sg) => sg.guardian_id))];
        const guardians = guardianIds.length
            ? await Guardian.findAll({ where: { id: guardianIds } })
            : [];

        const userIds = [
            ...students.map((s) => s.user_id),
            ...teachers.map((t) => t.user_id),
            ...guardians.map((g) => g.user_id)
        ].filter(Boolean);
        const users = userIds.length ? await User.findAll({ where: { id: [...new Set(userIds)] } }) : [];

        // Maps de résolution id -> libellé lisible, utilisées par toutes les feuilles.
        const usersById = mapById(users);
        const studentsById = mapById(students);
        const teachersById = mapById(teachers);
        const subjectsById = mapById(subjects);
        const academicYearsById = mapById(academicYears);
        const classesById = mapById(classes);
        const teacherAssignmentsById = mapById(teacherAssignments);
        const assessmentsById = mapById(assessments);
        const tuitionFeesById = mapById(tuitionFees);
        const guardiansById = mapById(guardians);

        const studentLabel = (id) => fullName(studentsById.get(id)) || `#${id}`;
        const teacherLabel = (id) => {
            const teacher = teachersById.get(id);
            if (!teacher) return `#${id}`;
            const user = usersById.get(teacher.user_id);
            return user ? fullName(user) : `#${id}`;
        };
        const classLabel = (id) => classesById.get(id)?.name || `#${id}`;
        const academicYearLabel = (id) => academicYearsById.get(id)?.label || `#${id}`;
        const subjectLabel = (id) => subjectsById.get(id)?.name || `#${id}`;

        const paymentsByTuitionFee = new Map();
        for (const p of payments) {
            if (!paymentsByTuitionFee.has(p.tuition_fee_id)) {
                paymentsByTuitionFee.set(p.tuition_fee_id, []);
            }
            paymentsByTuitionFee.get(p.tuition_fee_id).push(p);
        }

        const files = [];

        files.push({
            name: "eleves.xlsx",
            buffer: await buildWorkbook("Élèves", [
                { header: "ID", key: "id", width: 8 },
                { header: "Matricule", key: "matricule" },
                { header: "Prénom", key: "prenom" },
                { header: "Nom", key: "nom" },
                { header: "Date de naissance", key: "naissance" },
                { header: "Genre", key: "genre", width: 10 },
                { header: "Email", key: "email", width: 28 },
                { header: "Statut compte", key: "statut", width: 14 }
            ], students.map((s) => {
                const user = usersById.get(s.user_id);
                return {
                    id: s.id,
                    matricule: s.student_number || "",
                    prenom: s.first_name,
                    nom: s.last_name,
                    naissance: s.date_of_birth || "",
                    genre: s.gender || "",
                    email: user?.email || "",
                    statut: user?.status || ""
                };
            }))
        });

        files.push({
            name: "enseignants.xlsx",
            buffer: await buildWorkbook("Enseignants", [
                { header: "ID", key: "id", width: 8 },
                { header: "Matricule", key: "matricule" },
                { header: "Prénom", key: "prenom" },
                { header: "Nom", key: "nom" },
                { header: "Email", key: "email", width: 28 },
                { header: "Spécialité", key: "specialite", width: 22 },
                { header: "Date d'embauche", key: "embauche" }
            ], teachers.map((t) => {
                const user = usersById.get(t.user_id);
                return {
                    id: t.id,
                    matricule: t.employee_number || "",
                    prenom: user?.first_name || "",
                    nom: user?.last_name || "",
                    email: user?.email || "",
                    specialite: t.specialty || "",
                    embauche: t.hire_date || ""
                };
            }))
        });

        files.push({
            name: "classes.xlsx",
            buffer: await buildWorkbook("Classes", [
                { header: "ID", key: "id", width: 8 },
                { header: "Nom", key: "nom", width: 22 },
                { header: "Niveau", key: "niveau" },
                { header: "Cycle", key: "cycle", width: 14 },
                { header: "Capacité", key: "capacite", width: 10 },
                { header: "Année scolaire", key: "annee", width: 18 }
            ], classes.map((c) => ({
                id: c.id,
                nom: c.name,
                niveau: c.level || "",
                cycle: c.cycle || "",
                capacite: c.capacity ?? "",
                annee: academicYearLabel(c.academic_year_id)
            })))
        });

        files.push({
            name: "matieres.xlsx",
            buffer: await buildWorkbook("Matières", [
                { header: "ID", key: "id", width: 8 },
                { header: "Nom", key: "nom", width: 24 },
                { header: "Coefficient par défaut", key: "coefficient", width: 20 }
            ], subjects.map((s) => ({
                id: s.id,
                nom: s.name,
                coefficient: s.coefficient_default
            })))
        });

        files.push({
            name: "inscriptions.xlsx",
            buffer: await buildWorkbook("Inscriptions", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Classe", key: "classe", width: 20 },
                { header: "Année scolaire", key: "annee", width: 18 },
                { header: "Statut", key: "statut", width: 14 },
                { header: "Date d'inscription", key: "date" },
                { header: "N° d'inscription", key: "numero", width: 18 }
            ], enrollments.map((e) => ({
                id: e.id,
                eleve: studentLabel(e.student_id),
                classe: classLabel(e.class_id),
                annee: academicYearLabel(e.academic_year_id),
                statut: e.status,
                date: e.enrollment_date || "",
                numero: e.registration_number || ""
            })))
        });

        files.push({
            name: "notes.xlsx",
            buffer: await buildWorkbook("Notes", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Évaluation", key: "evaluation", width: 22 },
                { header: "Matière", key: "matiere", width: 18 },
                { header: "Note", key: "note", width: 10 },
                { header: "Note max", key: "note_max", width: 10 },
                { header: "Coefficient", key: "coefficient", width: 12 },
                { header: "Date", key: "date" }
            ], grades.map((g) => {
                const assessment = assessmentsById.get(g.assessment_id);
                const teacherAssignment = assessment ? teacherAssignmentsById.get(assessment.teacher_assignment_id) : null;
                return {
                    id: g.id,
                    eleve: studentLabel(g.student_id),
                    evaluation: assessment?.name || "",
                    matiere: teacherAssignment ? subjectLabel(teacherAssignment.subject_id) : "",
                    note: g.score,
                    note_max: assessment?.max_score ?? "",
                    coefficient: assessment?.coefficient ?? "",
                    date: assessment?.date || ""
                };
            }))
        });

        files.push({
            name: "bulletins.xlsx",
            buffer: await buildWorkbook("Bulletins", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Classe", key: "classe", width: 20 },
                { header: "Statut", key: "statut", width: 14 },
                { header: "Généré le", key: "genere" },
                { header: "Validé le", key: "valide" },
                { header: "Validé par", key: "valide_par", width: 24 }
            ], reportCards.map((rc) => ({
                id: rc.id,
                eleve: studentLabel(rc.student_id),
                classe: classLabel(rc.class_id),
                statut: rc.status,
                genere: rc.generated_at ? new Date(rc.generated_at).toISOString() : "",
                valide: rc.validated_at ? new Date(rc.validated_at).toISOString() : "",
                valide_par: rc.validated_by ? (fullName(usersById.get(rc.validated_by)) || `#${rc.validated_by}`) : ""
            })))
        });

        files.push({
            name: "presences.xlsx",
            buffer: await buildWorkbook("Présences", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Classe", key: "classe", width: 20 },
                { header: "Date", key: "date" },
                { header: "Session", key: "session", width: 12 },
                { header: "Statut", key: "statut", width: 12 },
                { header: "Justifié", key: "justifie", width: 10 },
                { header: "Motif", key: "motif", width: 24 }
            ], attendances.map((a) => ({
                id: a.id,
                eleve: studentLabel(a.student_id),
                classe: classLabel(a.class_id),
                date: a.date,
                session: a.session,
                statut: a.status,
                justifie: a.justified ? "Oui" : "Non",
                motif: a.reason || ""
            })))
        });

        files.push({
            name: "frais-scolarite.xlsx",
            buffer: await buildWorkbook("Frais de scolarité", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Année scolaire", key: "annee", width: 18 },
                { header: "Libellé", key: "libelle", width: 22 },
                { header: "Montant", key: "montant", width: 12 },
                { header: "Échéance", key: "echeance" },
                { header: "Payé", key: "paye", width: 12 },
                { header: "Solde", key: "solde", width: 12 },
                { header: "Statut", key: "statut", width: 18 }
            ], tuitionFees.map((tf) => {
                const tfPayments = paymentsByTuitionFee.get(tf.id) || [];
                const paidAmount = tfPayments.reduce((sum, p) => sum + p.amount, 0);
                const balance = Number((tf.amount - paidAmount).toFixed(2));
                let status;
                if (balance <= 0) status = "PAID";
                else if (tf.due_date && new Date(tf.due_date) < new Date()) status = "OVERDUE";
                else if (paidAmount > 0) status = "PARTIAL";
                else status = "PENDING";

                return {
                    id: tf.id,
                    eleve: studentLabel(tf.student_id),
                    annee: academicYearLabel(tf.academic_year_id),
                    libelle: tf.label,
                    montant: tf.amount,
                    echeance: tf.due_date || "",
                    paye: Number(paidAmount.toFixed(2)),
                    solde: balance,
                    statut: TUITION_STATUS_LABELS[status]
                };
            }))
        });

        files.push({
            name: "paiements.xlsx",
            buffer: await buildWorkbook("Paiements", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Échéance", key: "echeance", width: 22 },
                { header: "Montant", key: "montant", width: 12 },
                { header: "Date de paiement", key: "date" },
                { header: "Méthode", key: "methode", width: 14 },
                { header: "Référence", key: "reference", width: 18 }
            ], payments.map((p) => {
                const tf = tuitionFeesById.get(p.tuition_fee_id);
                return {
                    id: p.id,
                    eleve: tf ? studentLabel(tf.student_id) : "",
                    echeance: tf?.label || "",
                    montant: p.amount,
                    date: p.payment_date,
                    methode: p.method,
                    reference: p.reference || ""
                };
            }))
        });

        files.push({
            name: "emploi-du-temps.xlsx",
            buffer: await buildWorkbook("Emploi du temps", [
                { header: "ID", key: "id", width: 8 },
                { header: "Enseignant", key: "enseignant", width: 24 },
                { header: "Classe", key: "classe", width: 20 },
                { header: "Matière", key: "matiere", width: 18 },
                { header: "Jour", key: "jour", width: 12 },
                { header: "Début", key: "debut", width: 10 },
                { header: "Fin", key: "fin", width: 10 },
                { header: "Salle", key: "salle", width: 12 }
            ], schedules.map((s) => {
                const ta = teacherAssignmentsById.get(s.teacher_assignment_id);
                return {
                    id: s.id,
                    enseignant: ta ? teacherLabel(ta.teacher_id) : "",
                    classe: ta ? classLabel(ta.class_id) : "",
                    matiere: ta ? subjectLabel(ta.subject_id) : "",
                    jour: s.day_of_week,
                    debut: s.start_time,
                    fin: s.end_time,
                    salle: s.room || ""
                };
            }))
        });

        files.push({
            name: "tuteurs-parents.xlsx",
            buffer: await buildWorkbook("Tuteurs et Parents", [
                { header: "ID", key: "id", width: 8 },
                { header: "Élève", key: "eleve", width: 24 },
                { header: "Tuteur", key: "tuteur", width: 24 },
                { header: "Téléphone", key: "telephone", width: 16 },
                { header: "Email", key: "email", width: 26 },
                { header: "Lien", key: "lien", width: 12 },
                { header: "Contact principal", key: "principal", width: 16 }
            ], studentGuardians.map((sg) => {
                const guardian = guardiansById.get(sg.guardian_id);
                return {
                    id: sg.id,
                    eleve: studentLabel(sg.student_id),
                    tuteur: guardian ? fullName(guardian) : `#${sg.guardian_id}`,
                    telephone: guardian?.phone || "",
                    email: guardian?.email || "",
                    lien: sg.relationship,
                    principal: sg.is_primary_contact ? "Oui" : "Non"
                };
            }))
        });

        return this._zipFiles(files);
    }

    async _zipFiles(files) {
        return new Promise((resolve, reject) => {
            const archive = archiver("zip", { zlib: { level: 9 } });
            const chunks = [];
            archive.on("data", (chunk) => chunks.push(chunk));
            archive.on("end", () => resolve(Buffer.concat(chunks)));
            archive.on("error", reject);

            for (const file of files) {
                archive.append(file.buffer, { name: file.name });
            }
            archive.finalize();
        });
    }
}

module.exports = new SchoolExportService();
