'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'tuition_fees.view', description: 'Voir les échéances de scolarité', createdAt: now, updatedAt: now },
      { name: 'tuition_fees.create', description: 'Créer une échéance de scolarité', createdAt: now, updatedAt: now },
      { name: 'tuition_fees.update', description: 'Modifier une échéance de scolarité', createdAt: now, updatedAt: now },
      { name: 'tuition_fees.delete', description: 'Supprimer une échéance de scolarité', createdAt: now, updatedAt: now },

      { name: 'payments.view', description: 'Voir les paiements', createdAt: now, updatedAt: now },
      { name: 'payments.create', description: 'Enregistrer un paiement', createdAt: now, updatedAt: now },
      { name: 'payments.delete', description: 'Supprimer un paiement', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: [
        'tuition_fees.view', 'tuition_fees.create', 'tuition_fees.update', 'tuition_fees.delete',
        'payments.view', 'payments.create', 'payments.delete'
      ]
    }, {});
  }
};
