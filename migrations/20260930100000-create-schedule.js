'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Schedules', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      teacher_assignment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TeacherAssignments",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      day_of_week: {
        type: Sequelize.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      room: {
        type: Sequelize.STRING,
        allowNull: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('Schedules', ['teacher_assignment_id']);
    await queryInterface.addIndex('Schedules', ['day_of_week']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('Schedules');
  }
};
