'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AcademicYears', {
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
        onDelete: "CASCADE"
      },
      label: {
        type: Sequelize.STRING,
        allowNull: false
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      is_current: {
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

    // Une seule année "courante" par école
    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX academic_years_school_id_current_unique
      ON "AcademicYears" (school_id)
      WHERE is_current = true;
    `);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AcademicYears');
  }
};
