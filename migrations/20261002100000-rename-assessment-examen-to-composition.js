'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // « Examen » ne correspond pas au vocabulaire des écoles maliennes : on
  // parle de Devoir et de Composition. Renommer la valeur de l'enum convertit
  // d'un coup les évaluations existantes, sans toucher aux notes liées.
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Assessments_type" RENAME VALUE 'EXAMEN' TO 'COMPOSITION';`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_Assessments_type" RENAME VALUE 'COMPOSITION' TO 'EXAMEN';`
    );
  }
};
