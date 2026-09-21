'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addConstraint('Roles', {
      fields: ['name'],
      type: 'unique',
      name: 'roles_name_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Roles', 'roles_name_unique');
  }
};
