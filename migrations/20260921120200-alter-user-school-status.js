'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'school_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('Users', 'status', {
      type: Sequelize.ENUM('active', 'inactive', 'suspended', 'pending'),
      allowNull: false,
      defaultValue: 'active'
    });

    await queryInterface.removeColumn('Users', 'compagny_id');
    await queryInterface.removeColumn('Users', 'agency_id');
    await queryInterface.removeColumn('Users', 'is_active');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('Users', 'compagny_id', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('Users', 'agency_id', {
      type: Sequelize.INTEGER
    });
    await queryInterface.addColumn('Users', 'is_active', {
      type: Sequelize.BOOLEAN
    });

    await queryInterface.removeColumn('Users', 'school_id');
    await queryInterface.removeColumn('Users', 'status');

    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_status";');
    }
  }
};
