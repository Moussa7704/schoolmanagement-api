'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Enrollments', {
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
      academic_year_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "AcademicYears",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      status: {
        type: Sequelize.ENUM('ACTIVE', 'TRANSFERRED', 'REPEATING', 'WITHDRAWN'),
        allowNull: false,
        defaultValue: 'ACTIVE'
      },
      enrollment_date: {
        type: Sequelize.DATEONLY
      },
      registration_number: {
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

    await queryInterface.addIndex('Enrollments', ['student_id', 'class_id'], {
      unique: true,
      name: 'enrollments_student_id_class_id_unique'
    });

    // Une seule inscription ACTIVE par élève et par année scolaire
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX enrollments_student_id_academic_year_id_active_unique
      ON "Enrollments" (student_id, academic_year_id)
      WHERE status = 'ACTIVE';
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Enrollments');
  }
};
