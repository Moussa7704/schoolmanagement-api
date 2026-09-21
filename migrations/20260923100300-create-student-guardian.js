'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StudentGuardians', {
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
      guardian_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "Guardians",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      relationship: {
        type: Sequelize.ENUM('PERE', 'MERE', 'TUTEUR', 'AUTRE'),
        allowNull: false
      },
      is_primary_contact: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
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

    await queryInterface.addIndex('StudentGuardians', ['student_id', 'guardian_id'], {
      unique: true,
      name: 'student_guardians_student_id_guardian_id_unique'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StudentGuardians');
  }
};
