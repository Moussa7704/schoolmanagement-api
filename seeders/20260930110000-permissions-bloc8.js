'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'schedules.view', description: 'Voir les créneaux d\'emploi du temps', createdAt: now, updatedAt: now },
      { name: 'schedules.create', description: 'Créer un créneau d\'emploi du temps', createdAt: now, updatedAt: now },
      { name: 'schedules.update', description: 'Modifier un créneau d\'emploi du temps', createdAt: now, updatedAt: now },
      { name: 'schedules.delete', description: 'Supprimer un créneau d\'emploi du temps', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: ['schedules.view', 'schedules.create', 'schedules.update', 'schedules.delete']
    }, {});
  }
};
