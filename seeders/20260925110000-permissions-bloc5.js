'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'assessments.view', description: 'Voir les évaluations', createdAt: now, updatedAt: now },
      { name: 'assessments.create', description: 'Créer une évaluation', createdAt: now, updatedAt: now },
      { name: 'assessments.update', description: 'Modifier une évaluation', createdAt: now, updatedAt: now },
      { name: 'assessments.delete', description: 'Supprimer une évaluation', createdAt: now, updatedAt: now },

      { name: 'grades.view', description: 'Voir les notes', createdAt: now, updatedAt: now },
      { name: 'grades.create', description: 'Saisir une note', createdAt: now, updatedAt: now },
      { name: 'grades.update', description: 'Modifier une note', createdAt: now, updatedAt: now },
      { name: 'grades.delete', description: 'Supprimer une note', createdAt: now, updatedAt: now },

      { name: 'report_cards.view', description: 'Voir un bulletin', createdAt: now, updatedAt: now },
      { name: 'report_cards.create', description: 'Générer un bulletin', createdAt: now, updatedAt: now },
      { name: 'report_cards.delete', description: 'Supprimer un bulletin', createdAt: now, updatedAt: now },
      { name: 'report_cards.validate', description: 'Valider un bulletin (DRAFT → VALIDATED)', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: [
        'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
        'grades.view', 'grades.create', 'grades.update', 'grades.delete',
        'report_cards.view', 'report_cards.create', 'report_cards.delete', 'report_cards.validate'
      ]
    }, {});
  }
};
