'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Assessments', {
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
      period_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Periods",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('DEVOIR', 'EXAMEN'),
        allowNull: false,
        defaultValue: 'DEVOIR'
      },
      coefficient: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1
      },
      max_score: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 20
      },
      date: {
        type: Sequelize.DATEONLY
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Assessments');
  }
};
