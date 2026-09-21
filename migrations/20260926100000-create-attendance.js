'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Attendances', {
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
      date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      session: {
        type: Sequelize.ENUM('MORNING', 'AFTERNOON'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('PRESENT', 'ABSENT', 'LATE'),
        allowNull: false,
        defaultValue: 'PRESENT'
      },
      justified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      reason: {
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

    await queryInterface.addIndex('Attendances', ['student_id', 'class_id', 'date', 'session'], {
      unique: true,
      name: 'attendances_student_class_date_session_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Attendances');
  }
};
