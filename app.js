const dotenv = require("dotenv")
dotenv.config()
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const helmet = require("helmet")
const app = express()
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger')

// Derrière un proxy (Nginx, hébergeur…) : TRUST_PROXY=1 pour que req.ip soit
// l'adresse réelle du client (sinon les limites de requêtes compteraient tout
// le monde comme une seule adresse, celle du proxy).
if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY) || process.env.TRUST_PROXY);
}

// En-têtes de sécurité HTTP (helmet) : masque « X-Powered-By: Express », interdit
// l'affichage dans une iframe, bloque le reniflage de type MIME, impose HTTPS en
// production (HSTS), etc. CORP en « same-site » : le frontend (localhost:3000,
// ou app.mondomaine.com en production) peut charger les PDF de l'API.
const apiHelmet = helmet({
    crossOriginResourcePolicy: { policy: "same-site" }
});
// La documentation Swagger exécute des scripts et styles en ligne : politique de
// contenu (CSP) assouplie pour elle seule, le reste de l'API garde la protection complète.
const docsHelmet = helmet({
    contentSecurityPolicy: {
        directives: {
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'", "https:"],
            "img-src": ["'self'", "data:", "https:"]
        }
    }
});
app.use((req, res, next) =>
    (req.path.startsWith('/api/v1/docs') ? docsHelmet : apiHelmet)(req, res, next));

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(cookieParser());
// Taille des corps de requête bornée : une requête énorme ne peut pas saturer le serveur.
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }))

app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec,
    {
        customSiteTitle: `School Management API`,
        customCss: `
        .swagger-ui .topbar {
            display: none;
        }
    `
    }
));

// Routes
const authRoutes = require("./routes/auth")
const userRoutes = require("./routes/user")
const roleRoutes = require("./routes/roles")
const permissionRoutes = require("./routes/permission")
const schoolRoutes = require("./routes/school")
const academicYearRoutes = require("./routes/academicyear")
const periodRoutes = require("./routes/period")
const teacherRoutes = require("./routes/teacher")
const studentRoutes = require("./routes/student")
const guardianRoutes = require("./routes/guardian")
const studentGuardianRoutes = require("./routes/studentguardian")
const subjectRoutes = require("./routes/subject")
const classRoutes = require("./routes/class")
const enrollmentRoutes = require("./routes/enrollment")
const teacherAssignmentRoutes = require("./routes/teacherassignment")
const assessmentRoutes = require("./routes/assessment")
const gradeRoutes = require("./routes/grade")
const reportCardRoutes = require("./routes/reportcard")
const attendanceRoutes = require("./routes/attendance")
const tuitionFeeRoutes = require("./routes/tuitionfee")
const paymentRoutes = require("./routes/payment")
const scheduleRoutes = require("./routes/schedule")
const dashboardRoutes = require("./routes/dashboard")

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/users', userRoutes)
app.use('/api/v1/roles', roleRoutes)
app.use('/api/v1/permissions', permissionRoutes)
app.use('/api/v1/schools', schoolRoutes)
app.use('/api/v1/academic-years', academicYearRoutes)
app.use('/api/v1/periods', periodRoutes)
app.use('/api/v1/teachers', teacherRoutes)
app.use('/api/v1/students', studentRoutes)
app.use('/api/v1/guardians', guardianRoutes)
app.use('/api/v1/student-guardians', studentGuardianRoutes)
app.use('/api/v1/subjects', subjectRoutes)
app.use('/api/v1/classes', classRoutes)
app.use('/api/v1/enrollments', enrollmentRoutes)
app.use('/api/v1/teacher-assignments', teacherAssignmentRoutes)
app.use('/api/v1/assessments', assessmentRoutes)
app.use('/api/v1/grades', gradeRoutes)
app.use('/api/v1/report-cards', reportCardRoutes)
app.use('/api/v1/attendances', attendanceRoutes)
app.use('/api/v1/tuition-fees', tuitionFeeRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/schedules', scheduleRoutes)
app.use('/api/v1/dashboard', dashboardRoutes)

// Erreurs non gérées par les routes (corps trop volumineux, JSON mal formé…) :
// réponse JSON courte, jamais de trace technique renvoyée au client.
// eslint-disable-next-line no-unused-vars -- Express reconnaît un gestionnaire d'erreurs à ses 4 paramètres
app.use((err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    if (err.type === 'entity.too.large') {
        return res.status(413).json({ message: "Requête trop volumineuse." });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ message: "Corps de requête JSON invalide." });
    }
    if (status >= 500) {
        console.error(err);
    }
    return res.status(status).json({ message: status >= 500 ? "Erreur interne du serveur." : err.message });
});

module.exports = app