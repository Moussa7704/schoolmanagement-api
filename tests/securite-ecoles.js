// Test d'intrusion entre écoles (npm run test:securite).
//
// Deux écoles temporaires A et B sont créées. L'administrateur de l'école A
// attaque ensuite chaque route de l'API avec les identifiants de l'école B :
// lecture, listes filtrées, exports PDF, créations, modifications, suppressions
// et actions spéciales. Toute réponse 2xx est une faille (code de sortie 1).
// Les deux écoles sont entièrement supprimées à la fin, quoi qu'il arrive.
//
// Écrit et supprime des données : refuse de s'exécuter en production.
const path = require("path");
process.chdir(path.join(__dirname, ".."));
require("dotenv").config({ quiet: true });

if (process.env.NODE_ENV === "production") {
    console.error("Refusé : ce test crée et supprime des données, il ne doit jamais tourner en production.");
    process.exit(1);
}

const { Op } = require("sequelize");
const m = require("../models");
const app = require("../app");
const { generateAccessToken } = require("../utils/jwt");

const A = {};
const B = {};
const results = [];

async function fixture() {
    const tag = `AUDIT-${Date.now()}`;
    B.school = await m.School.create({ name: `École B ${tag}`, address: "test" });
    B.year = await m.AcademicYear.create({ school_id: B.school.id, label: `B-${tag}`, start_date: "2026-09-01", end_date: "2027-07-31", is_current: true });
    B.period = await m.Period.create({ academic_year_id: B.year.id, label: "T1 B", start_date: "2026-09-01", end_date: "2026-12-20", position: 1 });
    B.cls = await m.Class.create({ academic_year_id: B.year.id, name: "Classe B", level: "6ème", capacity: 30 });
    B.subject = await m.Subject.create({ school_id: B.school.id, name: "Maths B", coefficient_default: 2 });
    const teacherRole = await m.Role.findOne({ where: { name: "TEACHER" } });
    const staffRole = await m.Role.findOne({ where: { name: "STAFF" } });
    B.teacherUser = await m.User.create({ school_id: B.school.id, role_id: teacherRole.id, first_name: "Prof", last_name: "B", email: `prof-${tag}@example.com`, password: "x", status: "active" });
    B.staffUser = await m.User.create({ school_id: B.school.id, role_id: staffRole.id, first_name: "Staff", last_name: "B", email: `staff-${tag}@example.com`, password: "x", status: "active" });
    B.teacher = await m.Teacher.create({ user_id: B.teacherUser.id, school_id: B.school.id });
    B.assignment = await m.TeacherAssignment.create({ teacher_id: B.teacher.id, class_id: B.cls.id, subject_id: B.subject.id, academic_year_id: B.year.id });
    B.student = await m.Student.create({ school_id: B.school.id, student_number: `B-${tag}`, first_name: "Élève", last_name: "B", gender: "M" });
    B.enrollment = await m.Enrollment.create({ student_id: B.student.id, class_id: B.cls.id, academic_year_id: B.year.id, status: "ACTIVE" });
    B.assessment = await m.Assessment.create({ teacher_assignment_id: B.assignment.id, period_id: B.period.id, name: "Devoir B", type: "DEVOIR", coefficient: 1, max_score: 20 });
    B.grade = await m.Grade.create({ assessment_id: B.assessment.id, student_id: B.student.id, score: 12 });
    B.attendance = await m.Attendance.create({ student_id: B.student.id, class_id: B.cls.id, date: "2026-10-01", session: "MORNING", status: "ABSENT" });
    B.schedule = await m.Schedule.create({ teacher_assignment_id: B.assignment.id, day_of_week: "MONDAY", start_time: "08:00:00", end_time: "10:00:00" });
    B.fee = await m.TuitionFee.create({ student_id: B.student.id, academic_year_id: B.year.id, label: "Tranche B", amount: 50000, due_date: "2026-10-30" });
    B.payment = await m.Payment.create({ tuition_fee_id: B.fee.id, amount: 10000, payment_date: "2026-10-01", method: "ESPECES" });
    B.reportCard = await m.ReportCard.create({ student_id: B.student.id, class_id: B.cls.id, period_id: B.period.id, academic_year_id: B.year.id, status: "DRAFT", generated_at: new Date() });
    B.annualReportCard = await m.ReportCard.create({ student_id: B.student.id, class_id: B.cls.id, period_id: null, academic_year_id: B.year.id, type: "ANNUAL", status: "DRAFT", generated_at: new Date() });
    B.guardian = await m.Guardian.create({ first_name: "Tuteur", last_name: "B" });
    B.link = await m.StudentGuardian.create({ student_id: B.student.id, guardian_id: B.guardian.id, relationship: "PERE", is_primary_contact: true });

    // École A et son administrateur : c'est lui qui attaque l'école B.
    const adminRole = await m.Role.findOne({ where: { name: "SCHOOL_ADMIN" } });
    A.school = await m.School.create({ name: `École A ${tag}`, address: "test" });
    A.admin = await m.User.create({ school_id: A.school.id, role_id: adminRole.id, first_name: "Admin", last_name: "A", email: `admin-a-${tag}@example.com`, password: "x", status: "active" });
}

async function cleanup() {
    if (!B.school) return;
    const ids = (x) => (x ? [x.id] : [-1]);
    const studentIds = ids(B.student), classIds = ids(B.cls), feeIds = ids(B.fee), assignIds = ids(B.assignment);
    const assessmentIds = (await m.Assessment.findAll({ where: { [Op.or]: [{ teacher_assignment_id: assignIds }, { period_id: ids(B.period) }] } })).map((a) => a.id);
    const steps = [
        () => m.Payment.destroy({ where: { tuition_fee_id: feeIds } }),
        () => m.TuitionFee.destroy({ where: { [Op.or]: [{ student_id: studentIds }, { academic_year_id: ids(B.year) }] } }),
        () => m.Grade.destroy({ where: { [Op.or]: [{ student_id: studentIds }, { assessment_id: assessmentIds.length ? assessmentIds : [-1] }] } }),
        () => m.ReportCard.destroy({ where: { [Op.or]: [{ student_id: studentIds }, { class_id: classIds }] } }),
        () => m.Attendance.destroy({ where: { [Op.or]: [{ student_id: studentIds }, { class_id: classIds }] } }),
        () => m.Schedule.destroy({ where: { teacher_assignment_id: assignIds } }),
        () => m.Assessment.destroy({ where: { id: assessmentIds.length ? assessmentIds : [-1] } }),
        () => m.TeacherAssignment.destroy({ where: { [Op.or]: [{ class_id: classIds }, { teacher_id: ids(B.teacher) }] } }),
        () => m.Enrollment.destroy({ where: { [Op.or]: [{ student_id: studentIds }, { class_id: classIds }] } }),
        () => m.StudentGuardian.destroy({ where: { [Op.or]: [{ student_id: studentIds }, { guardian_id: ids(B.guardian) }] } }),
        () => m.Guardian.destroy({ where: { id: ids(B.guardian) } }),
        () => m.Student.destroy({ where: { school_id: B.school.id } }),
        () => m.Teacher.destroy({ where: { school_id: B.school.id } }),
        () => m.RefreshToken.destroy({ where: { user_id: [B.teacherUser?.id ?? -1, B.staffUser?.id ?? -1] } }),
        () => m.User.destroy({ where: { school_id: B.school.id } }),
        () => m.Subject.destroy({ where: { school_id: B.school.id } }),
        () => m.Period.destroy({ where: { academic_year_id: ids(B.year) } }),
        () => m.Class.destroy({ where: { academic_year_id: ids(B.year) } }),
        () => m.AcademicYear.destroy({ where: { school_id: B.school.id } }),
        () => m.School.destroy({ where: { id: B.school.id } })
    ];
    for (const step of steps) {
        try { await step(); } catch (e) { console.log("  (nettoyage)", e.message); }
    }
    if (A.school) {
        try {
            await m.RefreshToken.destroy({ where: { user_id: A.admin?.id ?? -1 } });
            await m.User.destroy({ where: { school_id: A.school.id } });
            await m.School.destroy({ where: { id: A.school.id } });
        } catch (e) { console.log("  (nettoyage)", e.message); }
    }
    console.log("nettoyage : écoles temporaires supprimées :", (await m.School.count({ where: { id: [B.school.id, A.school?.id ?? -1] } })) === 0);
}

(async () => {
    const server = app.listen(0);
    const base = `http://127.0.0.1:${server.address().port}/api/v1`;
    try {
        await fixture();
        const token = generateAccessToken({ id: A.admin.id });
        const call = async (method, path, body) => {
            const res = await fetch(`${base}${path}`, {
                method,
                headers: { Authorization: `Bearer ${token}`, ...(body ? { "Content-Type": "application/json" } : {}) },
                body: body ? JSON.stringify(body) : undefined
            });
            let detail = "";
            const type = res.headers.get("content-type") ?? "";
            if (type.includes("json")) {
                const json = await res.json();
                detail = json.message ?? "";
                if (res.ok && Array.isArray(json.data)) detail = `${json.data.length} élément(s) renvoyé(s)`;
            } else {
                detail = type;
            }
            return { status: res.status, detail };
        };
        const probe = async (label, method, path, body, { listMustBeEmpty = false } = {}) => {
            const r = await call(method, path, body);
            let breach = r.status >= 200 && r.status < 300;
            if (breach && listMustBeEmpty) breach = !/^0 élément/.test(r.detail);
            results.push({ label, method, path, status: r.status, detail: r.detail, breach });
        };

        const ay = B.year.id, p = B.period.id, c = B.cls.id, s = B.subject.id, t = B.teacher.id, st = B.student.id;
        const e = B.enrollment.id, ta = B.assignment.id, a = B.assessment.id, g = B.grade.id, at = B.attendance.id;
        const sc = B.schedule.id, tf = B.fee.id, pay = B.payment.id, rc = B.reportCard.id, arc = B.annualReportCard.id, gu = B.guardian.id, u = B.staffUser.id, link = B.link.id;

        // Lecture
        for (const [label, path] of [
            ["année scolaire", `/academic-years/${ay}`], ["période", `/periods/${p}`], ["classe", `/classes/${c}`],
            ["export liste élèves (PDF)", `/classes/${c}/students/export`], ["export emploi du temps (PDF)", `/classes/${c}/schedule/export`],
            ["matière", `/subjects/${s}`], ["enseignant", `/teachers/${t}`], ["élève", `/students/${st}`], ["inscription", `/enrollments/${e}`],
            ["affectation", `/teacher-assignments/${ta}`], ["évaluation", `/assessments/${a}`], ["note", `/grades/${g}`], ["présence", `/attendances/${at}`],
            ["stats présence", `/attendances/stats?student_id=${st}&period_id=${p}`], ["créneau", `/schedules/${sc}`], ["échéance", `/tuition-fees/${tf}`],
            ["facture (PDF)", `/tuition-fees/${tf}/invoice`], ["paiement", `/payments/${pay}`], ["reçu (PDF)", `/payments/${pay}/receipt`],
            ["bulletin", `/report-cards/${rc}`], ["bulletin (PDF)", `/report-cards/${rc}/pdf`], ["bulletins de classe (PDF)", `/report-cards/class-pdf?class_id=${c}&period_id=${p}`],
            ["classement", `/report-cards/ranking?class_id=${c}&period_id=${p}`], ["bulletin annuel", `/report-cards/${arc}`],
            ["bulletin annuel (PDF)", `/report-cards/${arc}/pdf`], ["bulletins annuels de classe (PDF)", `/report-cards/class-pdf?class_id=${c}&type=ANNUAL`],
            ["classement annuel", `/report-cards/ranking?class_id=${c}&type=ANNUAL`], ["tuteur", `/guardians/${gu}`], ["utilisateur", `/users/${u}`]
        ]) await probe(`lire ${label}`, "GET", path);

        // Listes filtrées sur des identifiants de l'école B (doivent être refusées ou vides)
        for (const [label, path] of [
            ["inscriptions de la classe B", `/enrollments?class_id=${c}`], ["inscriptions de l'élève B", `/enrollments?student_id=${st}`],
            ["notes de l'évaluation B", `/grades?assessment_id=${a}`], ["notes de l'élève B", `/grades?student_id=${st}`],
            ["présences de la classe B", `/attendances?class_id=${c}`], ["présences de l'élève B", `/attendances?student_id=${st}`],
            ["échéances de l'élève B", `/tuition-fees?student_id=${st}`], ["échéances de l'année B", `/tuition-fees?academic_year_id=${ay}`],
            ["paiements de l'échéance B", `/payments?tuition_fee_id=${tf}`], ["tuteurs de l'élève B", `/student-guardians?student_id=${st}`],
            ["classes de l'année B", `/classes?academic_year_id=${ay}`], ["périodes de l'année B", `/periods?academic_year_id=${ay}`],
            ["évaluations de l'affectation B", `/assessments?teacher_assignment_id=${ta}`], ["affectations de la classe B", `/teacher-assignments?class_id=${c}`],
            ["créneaux de la classe B", `/schedules?class_id=${c}`], ["créneaux de l'enseignant B", `/schedules?teacher_id=${t}`],
            ["bulletins de la classe B", `/report-cards?class_id=${c}`], ["bulletins de l'élève B", `/report-cards?student_id=${st}`],
            ["bulletins annuels de l'année B", `/report-cards?academic_year_id=${ay}&type=ANNUAL`]
        ]) await probe(`lister ${label}`, "GET", path, undefined, { listMustBeEmpty: true });

        // Créations qui pointent vers l'école B
        await probe("créer une inscription dans la classe B", "POST", "/enrollments", { student_id: st, class_id: c });
        await probe("créer une note sur l'évaluation B", "POST", "/grades", { assessment_id: a, student_id: st, score: 20 });
        await probe("créer une présence dans la classe B", "POST", "/attendances", { student_id: st, class_id: c, date: "2026-10-02", session: "MORNING" });
        await probe("faire l'appel dans la classe B", "POST", "/attendances/roll-call", { class_id: c, date: "2026-10-03", session: "MORNING", entries: [{ student_id: st, status: "PRESENT" }] });
        await probe("créer une échéance pour l'élève B", "POST", "/tuition-fees", { student_id: st, academic_year_id: ay, label: "pirate", amount: 1 });
        await probe("enregistrer un paiement sur l'échéance B", "POST", "/payments", { tuition_fee_id: tf, amount: 1, payment_date: "2026-10-02" });
        await probe("créer une évaluation sur l'affectation B", "POST", "/assessments", { teacher_assignment_id: ta, period_id: p, name: "pirate" });
        await probe("créer un créneau sur l'affectation B", "POST", "/schedules", { teacher_assignment_id: ta, day_of_week: "TUESDAY", start_time: "08:00:00", end_time: "09:00:00" });
        await probe("créer une affectation dans la classe B", "POST", "/teacher-assignments", { teacher_id: t, class_id: c, subject_id: s });
        await probe("créer un bulletin pour l'élève B", "POST", "/report-cards", { student_id: st, period_id: p });
        await probe("créer un bulletin annuel pour l'élève B", "POST", "/report-cards", { student_id: st, type: "ANNUAL", academic_year_id: ay });
        await probe("rattacher un tuteur à l'élève B", "POST", "/student-guardians", { student_id: st, guardian_id: gu, relationship: "PERE" });
        await probe("créer une classe dans l'année B", "POST", "/classes", { academic_year_id: ay, name: "pirate" });
        await probe("créer une période dans l'année B", "POST", "/periods", { academic_year_id: ay, label: "pirate", start_date: "2027-01-01", end_date: "2027-03-01" });

        // Modifications
        for (const [label, path, body] of [
            ["année scolaire", `/academic-years/${ay}`, { label: "piraté" }], ["période", `/periods/${p}`, { label: "piraté" }],
            ["classe", `/classes/${c}`, { name: "piraté" }], ["matière", `/subjects/${s}`, { name: "piraté" }],
            ["enseignant", `/teachers/${t}`, { specialty: "piraté" }], ["élève", `/students/${st}`, { first_name: "piraté" }],
            ["inscription", `/enrollments/${e}`, { status: "WITHDRAWN" }], ["évaluation", `/assessments/${a}`, { name: "piraté" }],
            ["note", `/grades/${g}`, { score: 0 }], ["présence", `/attendances/${at}`, { status: "PRESENT" }],
            ["créneau", `/schedules/${sc}`, { room: "piraté" }], ["échéance", `/tuition-fees/${tf}`, { amount: 1 }],
            ["tuteur", `/guardians/${gu}`, { first_name: "piraté" }], ["utilisateur", `/users/${u}`, { first_name: "piraté" }]
        ]) await probe(`modifier ${label}`, "PUT", path, body);
        await probe("définir l'année B comme courante", "PATCH", `/academic-years/${ay}/set-current`);
        await probe("valider le bulletin B", "PATCH", `/report-cards/${rc}/validate`);
        await probe("promouvoir la classe B", "POST", `/classes/${c}/promote`, { promotions: [{ student_id: st, target_class_id: c }] });
        await probe("donner un accès à l'élève B", "POST", `/students/${st}/grant-access`, { email: `pirate-${Date.now()}@example.com`, password: "Secret123!" });
        await probe("donner un accès au tuteur B", "POST", `/guardians/${gu}/grant-access`, { email: `pirate2-${Date.now()}@example.com`, password: "Secret123!" });
        await probe("changer le statut de l'utilisateur B", "PATCH", `/users/${u}/status`, { status: "suspended" });
        await probe("changer le mot de passe de l'utilisateur B", "PUT", `/users/${u}/change-password`, { new_password: "Pirate123!" });

        // Suppressions (en dernier)
        for (const [label, path] of [
            ["paiement", `/payments/${pay}`], ["note", `/grades/${g}`], ["présence", `/attendances/${at}`], ["créneau", `/schedules/${sc}`],
            ["appel de la classe B", `/attendances/roll-call?class_id=${c}&date=2026-10-01&session=MORNING`],
            ["bulletin", `/report-cards/${rc}`], ["bulletin annuel", `/report-cards/${arc}`], ["rattachement tuteur", `/student-guardians/${link}`], ["tuteur", `/guardians/${gu}`],
            ["échéance", `/tuition-fees/${tf}`], ["évaluation", `/assessments/${a}`], ["affectation", `/teacher-assignments/${ta}`],
            ["inscription", `/enrollments/${e}`], ["utilisateur", `/users/${u}`], ["élève", `/students/${st}`], ["enseignant", `/teachers/${t}`],
            ["matière", `/subjects/${s}`], ["période", `/periods/${p}`], ["classe", `/classes/${c}`], ["année scolaire", `/academic-years/${ay}`]
        ]) await probe(`supprimer ${label}`, "DELETE", path);

        const breaches = results.filter((r) => r.breach);
        for (const r of results) console.log(`${r.breach ? "FAILLE" : "ok    "} ${String(r.status).padEnd(4)} ${r.label}${r.breach ? `  → ${r.method} ${r.path} (${r.detail})` : ""}`);
        console.log(`\n${results.length} tentatives depuis l'école A vers l'école B : ${breaches.length} faille(s).`);
        process.exitCode = breaches.length ? 1 : 0;
    } catch (err) {
        console.error("ERREUR", err);
        process.exitCode = 1;
    } finally {
        server.close();
        await cleanup();
        await m.sequelize.close();
    }
})();
