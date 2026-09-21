'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Roles', [
      {
        name: 'SUPER_ADMIN',
        description: 'Administrateur global de la plateforme. Accès complet à toutes les écoles, utilisateurs et paramètres.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'SCHOOL_ADMIN',
        description: 'Administrateur d\'une école. Gère les utilisateurs, classes et opérations de son établissement.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'DIRECTOR',
        description: 'Direction pédagogique de l\'école. Supervise les enseignants et valide les bulletins.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'ACCOUNTANT',
        description: 'Gère la scolarité, les frais et les paiements de l\'école.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'TEACHER',
        description: 'Enseignant. Gère ses classes, matières, notes et présences.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'STUDENT',
        description: 'Élève. Consulte son dossier, ses notes et son emploi du temps.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'PARENT',
        description: 'Parent ou tuteur. Consulte le dossier de ses enfants.',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'STAFF',
        description: 'Personnel administratif générique de l\'école.',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Roles', null, {});
  }
};
