'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer une matière encore utilisée effaçait silencieusement, en
    // cascade, toutes ses affectations enseignant/classe puis leurs évaluations
    // et notes (Subject -> TeacherAssignment -> Assessment -> Grade, tout en
    // CASCADE). On bloque désormais au niveau base : il faut d'abord retirer
    // les affectations de cette matière avant de pouvoir la supprimer.
    await queryInterface.removeConstraint('TeacherAssignments', 'TeacherAssignments_subject_id_fkey');
    await queryInterface.addConstraint('TeacherAssignments', {
      fields: ['subject_id'],
      type: 'foreign key',
      name: 'TeacherAssignments_subject_id_fkey',
      references: {
        table: 'Subjects',
        field: 'id'
      },
      onDelete: 'RESTRICT'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('TeacherAssignments', 'TeacherAssignments_subject_id_fkey');
    await queryInterface.addConstraint('TeacherAssignments', {
      fields: ['subject_id'],
      type: 'foreign key',
      name: 'TeacherAssignments_subject_id_fkey',
      references: {
        table: 'Subjects',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });
  }
};
