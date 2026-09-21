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
      'subjects.view', 'subjects.create', 'subjects.update', 'subjects.delete',
      'classes.view', 'classes.create', 'classes.update', 'classes.delete',
      'enrollments.view', 'enrollments.create', 'enrollments.update', 'enrollments.delete',
      'teacher_assignments.view', 'teacher_assignments.create', 'teacher_assignments.delete'
    ];

    grant('SUPER_ADMIN', newPermissions);
    grant('SCHOOL_ADMIN', newPermissions);

    await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface, Sequelize) {
    const permissions = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name IN (
        'subjects.view','subjects.create','subjects.update','subjects.delete',
        'classes.view','classes.create','classes.update','classes.delete',
        'enrollments.view','enrollments.create','enrollments.update','enrollments.delete',
        'teacher_assignments.view','teacher_assignments.create','teacher_assignments.delete'
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
