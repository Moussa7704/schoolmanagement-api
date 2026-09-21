'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Permissions', [
      {
        name: 'users.view',
        description: 'Voir la liste des utilisateurs',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'users.create',
        description: 'Créer un utilisateur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'users.update',
        description: 'Modifier un utilisateur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'users.delete',
        description: 'Supprimer un utilisateur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'users.change_status',
        description: 'Activer/désactiver un utilisateur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'users.change_password',
        description: 'Réinitialiser le mot de passe d\'un utilisateur',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'roles.view',
        description: 'Voir la liste des rôles',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'roles.manage',
        description: 'Créer/modifier/supprimer des rôles et leurs permissions',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'permissions.manage',
        description: 'Gérer le catalogue des permissions',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Permissions', null, {});
  }
};
