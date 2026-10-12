'use strict';

// Bulletin annuel : un bulletin est soit trimestriel (period_id renseigné),
// soit annuel (period_id vide). L'année scolaire est portée par tous les
// bulletins, ce qui permet un seul bulletin annuel par élève et par année.

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ReportCards', 'type', {
      type: Sequelize.ENUM('TRIMESTER', 'ANNUAL'),
      allowNull: false,
      defaultValue: 'TRIMESTER'
    });
    await queryInterface.addColumn('ReportCards', 'academic_year_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: "AcademicYears",
        key: "id"
      },
      onDelete: "CASCADE"
    });

    // Bulletins existants (tous trimestriels) : année scolaire de leur période.
    await queryInterface.sequelize.query(`
      UPDATE "ReportCards" rc
      SET academic_year_id = p.academic_year_id
      FROM "Periods" p
      WHERE p.id = rc.period_id;
    `);

    // ALTER direct : changeColumn avec « references » recréerait une seconde
    // clé étrangère sous Postgres.
    await queryInterface.sequelize.query(`
      ALTER TABLE "ReportCards" ALTER COLUMN academic_year_id SET NOT NULL;
      ALTER TABLE "ReportCards" ALTER COLUMN period_id DROP NOT NULL;
    `);

    await queryInterface.addIndex('ReportCards', ['student_id', 'academic_year_id'], {
      unique: true,
      where: { type: 'ANNUAL' },
      name: 'report_cards_student_id_academic_year_annual_unique'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`DELETE FROM "ReportCards" WHERE type = 'ANNUAL';`);
    await queryInterface.removeIndex('ReportCards', 'report_cards_student_id_academic_year_annual_unique');
    await queryInterface.sequelize.query(`ALTER TABLE "ReportCards" ALTER COLUMN period_id SET NOT NULL;`);
    await queryInterface.removeColumn('ReportCards', 'academic_year_id');
    await queryInterface.removeColumn('ReportCards', 'type');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_ReportCards_type";');
  }
};
