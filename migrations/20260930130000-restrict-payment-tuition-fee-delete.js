'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Supprimer une échéance déjà réglée effaçait silencieusement l'historique
    // des paiements encaissés dessus (Payment.tuition_fee_id en CASCADE) —
    // plus grave que les cas Matière/Évaluation puisqu'il s'agit d'argent
    // réellement reçu. On bloque désormais au niveau base.
    await queryInterface.removeConstraint('Payments', 'Payments_tuition_fee_id_fkey');
    await queryInterface.addConstraint('Payments', {
      fields: ['tuition_fee_id'],
      type: 'foreign key',
      name: 'Payments_tuition_fee_id_fkey',
      references: {
        table: 'TuitionFees',
        field: 'id'
      },
      onDelete: 'RESTRICT'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Payments', 'Payments_tuition_fee_id_fkey');
    await queryInterface.addConstraint('Payments', {
      fields: ['tuition_fee_id'],
      type: 'foreign key',
      name: 'Payments_tuition_fee_id_fkey',
      references: {
        table: 'TuitionFees',
        field: 'id'
      },
      onDelete: 'CASCADE'
    });
  }
};
