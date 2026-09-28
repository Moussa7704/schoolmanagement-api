'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Champ structuré, distinct de `level` (texte libre du type "6ème") — sert
    // à regrouper/filtrer/rapporter par grand cycle éducatif plutôt que par
    // classe précise. Nullable : les classes déjà créées ne sont pas cassées,
    // à reclasser au fil de l'eau depuis l'UI.
    await queryInterface.addColumn('Classes', 'cycle', {
      type: Sequelize.ENUM('PRESCOLAIRE', 'PRIMAIRE', 'COLLEGE', 'LYCEE', 'SUPERIEUR'),
      allowNull: true
    });
    await queryInterface.addIndex('Classes', ['cycle']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Classes', 'cycle');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Classes_cycle";');
  }
};
