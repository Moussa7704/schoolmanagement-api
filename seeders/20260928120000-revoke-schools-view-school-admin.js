'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const [role] = await queryInterface.sequelize.query(
      `SELECT id FROM "Roles" WHERE name = 'SCHOOL_ADMIN';`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [permission] = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name = 'schools.view';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!role || !permission) return;

    await queryInterface.bulkDelete('RolePermissions', {
      role_id: role.id,
      permission_id: permission.id
    }, {});
  },

  async down(queryInterface, Sequelize) {
    const [role] = await queryInterface.sequelize.query(
      `SELECT id FROM "Roles" WHERE name = 'SCHOOL_ADMIN';`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const [permission] = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name = 'schools.view';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!role || !permission) return;

    await queryInterface.bulkInsert('RolePermissions', [{
      role_id: role.id,
      permission_id: permission.id,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  }
};
