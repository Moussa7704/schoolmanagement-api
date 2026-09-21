'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Roles";',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permissions = await queryInterface.sequelize.query(
      'SELECT id, name FROM "Permissions";',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const roleId = (name) => roles.find((r) => r.name === name)?.id;
    const permissionId = (name) => permissions.find((p) => p.name === name)?.id;

    const rows = [];
    const grant = (roleName, permissionNames) => {
      const rId = roleId(roleName);
      if (!rId) return;
      permissionNames.forEach((permissionName) => {
        const pId = permissionId(permissionName);
        if (!pId) return;
        rows.push({
          role_id: rId,
          permission_id: pId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    };

    grant('SUPER_ADMIN', permissions.map((p) => p.name));

    grant('SCHOOL_ADMIN', [
      'users.view',
      'users.create',
      'users.update',
      'users.delete',
      'users.change_status',
      'users.change_password',
      'roles.view'
    ]);

    await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RolePermissions', null, {});
  }
};
