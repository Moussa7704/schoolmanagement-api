'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [role] = await queryInterface.sequelize.query(
      `SELECT id FROM "Roles" WHERE name = 'SUPER_ADMIN' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!role) {
      throw new Error("Le rôle SUPER_ADMIN n'existe pas encore — exécuter le seeder de rôles d'abord.");
    }

    const hashedPassword = await bcrypt.hash('passer2026', 10);

    await queryInterface.bulkInsert('Users', [{
      school_id: null,
      role_id: role.id,
      first_name: 'Coulibaly',
      last_name: 'Moussa',
      phone: null,
      email: 'lilgas19@gmail.com',
      password: hashedPassword,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', { email: 'lilgas19@gmail.com' }, {});
  }
};
