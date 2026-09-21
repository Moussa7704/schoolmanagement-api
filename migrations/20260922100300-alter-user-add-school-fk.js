'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Users', {
      fields: ['school_id'],
      type: 'foreign key',
      name: 'users_school_id_fkey',
      references: {
        table: 'Schools',
        field: 'id'
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Users', 'users_school_id_fkey');
  }
};
