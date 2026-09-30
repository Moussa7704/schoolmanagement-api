'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Académie d'enseignement de rattachement (ex. « Académie d'Enseignement de
  // Bamako Rive Droite »), imprimée dans l'en-tête officiel des bulletins.
  // Nullable : les écoles existantes restent valides et sont complétées depuis
  // la page Écoles.
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Schools', 'academy', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Schools', 'academy');
  }
};
