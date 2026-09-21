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

const authRoutes = require("./routes/auth")
const schoolRoutes = require("./routes/school")
const academicYearRoutes = require("./routes/academicyear")
const periodRoutes = require("./routes/period")

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/schools', schoolRoutes)
app.use('/api/v1/academic-years', academicYearRoutes)
app.use('/api/v1/periods', periodRoutes)



module.exports = app