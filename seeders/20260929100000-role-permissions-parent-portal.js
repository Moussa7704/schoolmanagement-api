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

    // "Suivi des enfants" : le rôle PARENT peut lire (jamais créer/modifier/supprimer)
    // les notes, présences, bulletins et éléments financiers — le scoping "ses
    // enfants uniquement" est appliqué dans chaque service (voir utils/parentAccess.js),
    // ces permissions ne font que déverrouiller les routes existantes.
    const parentViewPermissions = [
      'grades.view',
      'attendances.view',
      'report_cards.view',
      'tuition_fees.view',
      'payments.view'
    ];

    const rows = [];
    const rId = roleId('PARENT');
    if (rId) {
      parentViewPermissions.forEach((permissionName) => {
        const pId = permissionId(permissionName);
        if (!pId) return;
        rows.push({
          role_id: rId,
          permission_id: pId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      });
    }

    if (rows.length) {
      await queryInterface.bulkInsert('RolePermissions', rows);
    }
  },

  async down(queryInterface, Sequelize) {
    const roles = await queryInterface.sequelize.query(
      `SELECT id FROM "Roles" WHERE name = 'PARENT';`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const roleIds = roles.map((r) => r.id);
    if (!roleIds.length) return;

    const permissions = await queryInterface.sequelize.query(
      `SELECT id FROM "Permissions" WHERE name IN (
        'grades.view', 'attendances.view', 'report_cards.view', 'tuition_fees.view', 'payments.view'
      );`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const permissionIds = permissions.map((p) => p.id);
    if (!permissionIds.length) return;

    await queryInterface.bulkDelete('RolePermissions', {
      role_id: roleIds,
      permission_id: permissionIds
    }, {});
  }
};
