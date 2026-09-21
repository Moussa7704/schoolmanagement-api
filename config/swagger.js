const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "School Management API",
            version: "1.0.0",
            description: `API de gestion scolaire permettant l'authentification des utilisateurs, la gestion des comptes et des rôles au sein d'un établissement.`,
        },
        servers: [
            {
                url: "http://localhost:9090/api/v1",
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: [
        "./routes/*.js",
        "./docs/*.swagger.js"
    ], // 👈 où sont tes routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
