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

    const allNewPermissions = [
      'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
      'grades.view', 'grades.create', 'grades.update', 'grades.delete',
      'report_cards.view', 'report_cards.create', 'report_cards.delete', 'report_cards.validate'
    ];

    grant('SUPER_ADMIN', allNewPermissions);
    grant('SCHOOL_ADMIN', allNewPermissions);

    // TEACHER : uniquement la saisie des évaluations/notes, scopée à ses propres
    // affectations en service (pas de gestion des bulletins).
    grant('TEACHER', [
      'assessments.view', 'assessments.create', 'assessments.update', 'assessments.delete',
      'grades.view', 'grades.create', 'grades.update', 'grades.delete'
    ]);

    // DIRECTOR : première permission jamais accordée à ce rôle.
    grant('DIRECTOR', [
      'report_cards.view',
      'report_cards.validate'
    ]);

    await queryInterface.bulkInsert('RolePermissions', rows);
  },

  async down(queryInterface, Sequelize) {
    const permissions = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name IN (
        'assessments.view','assessments.create','assessments.update','assessments.delete',
        'grades.view','grades.create','grades.update','grades.delete',
        'report_cards.view','report_cards.create','report_cards.delete','report_cards.validate'
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
