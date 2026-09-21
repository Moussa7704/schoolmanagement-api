'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'attendances.view', description: 'Voir les présences', createdAt: now, updatedAt: now },
      { name: 'attendances.create', description: 'Marquer une présence', createdAt: now, updatedAt: now },
      { name: 'attendances.update', description: 'Modifier une présence (justification, statut)', createdAt: now, updatedAt: now },
      { name: 'attendances.delete', description: 'Supprimer une présence', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: ['attendances.view', 'attendances.create', 'attendances.update', 'attendances.delete']
    }, {});
  }
};
