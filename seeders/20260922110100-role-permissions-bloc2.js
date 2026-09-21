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

    const newPermissions = [
      'schools.view', 'schools.create', 'schools.update', 'schools.delete',
      'academic_years.view', 'academic_years.create', 'academic_years.update', 'academic_years.delete',
      'periods.view', 'periods.create', 'periods.update', 'periods.delete'
    ];

    grant('SUPER_ADMIN', newPermissions);

    grant('SCHOOL_ADMIN', [
      'schools.view',
      'academic_years.view',
      'academic_years.create',
      'academic_years.update',
      'academic_years.delete',
      'periods.view',
      'periods.create',
      'periods.update',
      'periods.delete'
    ]);

    await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface, Sequelize) {
    const permissions = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name IN (
        'schools.view','schools.create','schools.update','schools.delete',
        'academic_years.view','academic_years.create','academic_years.update','academic_years.delete',
        'periods.view','periods.create','periods.update','periods.delete'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const ids = permissions.map((p) => p.id);
    if (ids.length) {
      await queryInterface.bulkDelete('RolePermissions', {
        permission_id: ids
      }, {});
    }
  }
};
