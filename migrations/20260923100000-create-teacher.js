'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Teachers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: "Users",
          key: "id"
        },
        onDelete: "RESTRICT"
      },
      school_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Schools",
          key: "id"
        },
        onDelete: "RESTRICT"
      },
      specialty: {
        type: Sequelize.STRING
      },
      hire_date: {
        type: Sequelize.DATEONLY
      },
      employee_number: {
        type: Sequelize.STRING
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

    await queryInterface.addIndex('Teachers', ['school_id', 'employee_number'], {
      unique: true,
      name: 'teachers_school_id_employee_number_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Teachers');
  }
};
