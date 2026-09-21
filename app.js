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



app.use('/api/v1/auth', authRoutes)



module.exports = app