'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Grades', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      assessment_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Assessments",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      student_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Students",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      score: {
        type: Sequelize.FLOAT,
        allowNull: false
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

    await queryInterface.addIndex('Grades', ['assessment_id', 'student_id'], {
      unique: true,
      name: 'grades_assessment_id_student_id_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Grades');
  }
};
