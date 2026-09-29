'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Civilité de l'enseignant (« Mr Bamba » / « Mme Konate » dans l'emploi du
    // temps). Nullable : les enseignants déjà créés restent valides et sont
    // complétés depuis la page Enseignants.
    await queryInterface.addColumn('Teachers', 'gender', {
      type: Sequelize.ENUM('M', 'F'),
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Teachers', 'gender');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Teachers_gender";');
  }
};
