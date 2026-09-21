'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Subjects', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      coefficient_default: {
        type: Sequelize.FLOAT,
        allowNull: false,
        defaultValue: 1
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

    await queryInterface.addIndex('Subjects', ['school_id', 'name'], {
      unique: true,
      name: 'subjects_school_id_name_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Subjects');
  }
};
