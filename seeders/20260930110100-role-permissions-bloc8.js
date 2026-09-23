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

    const allSchedulePermissions = ['schedules.view', 'schedules.create', 'schedules.update', 'schedules.delete'];

    grant('SUPER_ADMIN', allSchedulePermissions);
    grant('SCHOOL_ADMIN', allSchedulePermissions);
    grant('DIRECTOR', allSchedulePermissions);
    // Un enseignant consulte son propre emploi du temps mais ne le construit pas.
    grant('TEACHER', ['schedules.view']);

    await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface, Sequelize) {
    const permissions = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name IN (
        'schedules.view','schedules.create','schedules.update','schedules.delete'
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
