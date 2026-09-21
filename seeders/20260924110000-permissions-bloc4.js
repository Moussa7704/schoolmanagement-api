'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'subjects.view', description: 'Voir les matières', createdAt: now, updatedAt: now },
      { name: 'subjects.create', description: 'Créer une matière', createdAt: now, updatedAt: now },
      { name: 'subjects.update', description: 'Modifier une matière', createdAt: now, updatedAt: now },
      { name: 'subjects.delete', description: 'Supprimer une matière', createdAt: now, updatedAt: now },

      { name: 'classes.view', description: 'Voir les classes', createdAt: now, updatedAt: now },
      { name: 'classes.create', description: 'Créer une classe', createdAt: now, updatedAt: now },
      { name: 'classes.update', description: 'Modifier une classe', createdAt: now, updatedAt: now },
      { name: 'classes.delete', description: 'Supprimer une classe', createdAt: now, updatedAt: now },

      { name: 'enrollments.view', description: 'Voir les inscriptions', createdAt: now, updatedAt: now },
      { name: 'enrollments.create', description: 'Inscrire un élève dans une classe', createdAt: now, updatedAt: now },
      { name: 'enrollments.update', description: "Modifier une inscription (statut, transfert...)", createdAt: now, updatedAt: now },
      { name: 'enrollments.delete', description: 'Supprimer une inscription', createdAt: now, updatedAt: now },

      { name: 'teacher_assignments.view', description: 'Voir les affectations enseignant/matière/classe', createdAt: now, updatedAt: now },
      { name: 'teacher_assignments.create', description: 'Affecter un enseignant à une matière/classe', createdAt: now, updatedAt: now },
      { name: 'teacher_assignments.delete', description: 'Retirer une affectation', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: [
        'subjects.view', 'subjects.create', 'subjects.update', 'subjects.delete',
        'classes.view', 'classes.create', 'classes.update', 'classes.delete',
        'enrollments.view', 'enrollments.create', 'enrollments.update', 'enrollments.delete',
        'teacher_assignments.view', 'teacher_assignments.create', 'teacher_assignments.delete'
      ]
    }, {});
  }
};
