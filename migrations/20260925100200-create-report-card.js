'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ReportCards', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      class_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Classes",
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
      status: {
        type: Sequelize.ENUM('DRAFT', 'VALIDATED'),
        allowNull: false,
        defaultValue: 'DRAFT'
      },
      generated_at: {
        type: Sequelize.DATE
      },
      validated_at: {
        type: Sequelize.DATE
      },
      validated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "Users",
          key: "id"
        },
        onDelete: "SET NULL"
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

    await queryInterface.addIndex('ReportCards', ['student_id', 'period_id'], {
      unique: true,
      name: 'report_cards_student_id_period_id_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ReportCards');
  }
};
