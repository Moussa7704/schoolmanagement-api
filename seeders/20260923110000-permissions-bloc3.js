'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    await queryInterface.bulkInsert('Permissions', [
      { name: 'teachers.view', description: 'Voir la liste des enseignants', createdAt: now, updatedAt: now },
      { name: 'teachers.create', description: 'Créer un enseignant (compte + profil)', createdAt: now, updatedAt: now },
      { name: 'teachers.update', description: 'Modifier un enseignant', createdAt: now, updatedAt: now },
      { name: 'teachers.delete', description: 'Supprimer un enseignant', createdAt: now, updatedAt: now },

      { name: 'students.view', description: 'Voir la liste des élèves', createdAt: now, updatedAt: now },
      { name: 'students.create', description: 'Créer un élève', createdAt: now, updatedAt: now },
      { name: 'students.update', description: 'Modifier un élève', createdAt: now, updatedAt: now },
      { name: 'students.delete', description: 'Supprimer un élève', createdAt: now, updatedAt: now },
      { name: 'students.grant_access', description: "Créer un compte de connexion pour un élève", createdAt: now, updatedAt: now },

      { name: 'guardians.view', description: 'Voir la liste des tuteurs/responsables', createdAt: now, updatedAt: now },
      { name: 'guardians.create', description: 'Créer un tuteur/responsable', createdAt: now, updatedAt: now },
      { name: 'guardians.update', description: 'Modifier un tuteur/responsable', createdAt: now, updatedAt: now },
      { name: 'guardians.delete', description: 'Supprimer un tuteur/responsable', createdAt: now, updatedAt: now },
      { name: 'guardians.grant_access', description: "Créer un compte de connexion pour un tuteur/responsable", createdAt: now, updatedAt: now },

      { name: 'student_guardians.view', description: 'Voir les liens élève-responsable', createdAt: now, updatedAt: now },
      { name: 'student_guardians.create', description: 'Attacher un responsable à un élève', createdAt: now, updatedAt: now },
      { name: 'student_guardians.delete', description: 'Détacher un responsable d\'un élève', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', {
      name: [
        'teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete',
        'students.view', 'students.create', 'students.update', 'students.delete', 'students.grant_access',
        'guardians.view', 'guardians.create', 'guardians.update', 'guardians.delete', 'guardians.grant_access',
        'student_guardians.view', 'student_guardians.create', 'student_guardians.delete'
      ]
    }, {});
  }
};
