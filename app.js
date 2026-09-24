const dotenv = require("dotenv")
dotenv.config()
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const app = express()
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger')

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:3000",
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))

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



module.exports = app