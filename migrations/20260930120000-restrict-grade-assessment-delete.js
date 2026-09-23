'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer une évaluation déjà notée effaçait silencieusement toutes les
    // notes des élèves dessus (Grade.assessment_id en CASCADE). On bloque
    // désormais au niveau base : il faut d'abord supprimer les notes avant de
    // pouvoir supprimer l'évaluation.
    await queryInterface.removeConstraint('Grades', 'Grades_assessment_id_fkey');
    await queryInterface.addConstraint('Grades', {
      fields: ['assessment_id'],
      type: 'foreign key',
      name: 'Grades_assessment_id_fkey',
      references: {
        table: 'Assessments',
        field: 'id'
      },
      onDelete: 'RESTRICT'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Grades', 'Grades_assessment_id_fkey');
    await queryInterface.addConstraint('Grades', {
      fields: ['assessment_id'],
      type: 'foreign key',
      name: 'Grades_assessment_id_fkey',
      references: {
        table: 'Assessments',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });
  }
};
