'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'schools.view', description: 'Voir la liste des écoles', createdAt: now, updatedAt: now },
      { name: 'schools.create', description: 'Créer une école', createdAt: now, updatedAt: now },
      { name: 'schools.update', description: 'Modifier une école', createdAt: now, updatedAt: now },
      { name: 'schools.delete', description: 'Supprimer une école', createdAt: now, updatedAt: now },

      { name: 'academic_years.view', description: 'Voir les années scolaires', createdAt: now, updatedAt: now },
      { name: 'academic_years.create', description: 'Créer une année scolaire', createdAt: now, updatedAt: now },
      { name: 'academic_years.update', description: 'Modifier une année scolaire', createdAt: now, updatedAt: now },
      { name: 'academic_years.delete', description: 'Supprimer une année scolaire', createdAt: now, updatedAt: now },

      { name: 'periods.view', description: 'Voir les périodes (trimestres/semestres)', createdAt: now, updatedAt: now },
      { name: 'periods.create', description: 'Créer une période', createdAt: now, updatedAt: now },
      { name: 'periods.update', description: 'Modifier une période', createdAt: now, updatedAt: now },
      { name: 'periods.delete', description: 'Supprimer une période', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: [
        'schools.view', 'schools.create', 'schools.update', 'schools.delete',
        'academic_years.view', 'academic_years.create', 'academic_years.update', 'academic_years.delete',
        'periods.view', 'periods.create', 'periods.update', 'periods.delete'
      ]
    }, {});
  }
};
