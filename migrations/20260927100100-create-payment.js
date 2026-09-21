'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Payments', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      tuition_fee_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "TuitionFees",
          key: "id"
        },
        onDelete: "CASCADE"
      },
      amount: {
        type: Sequelize.FLOAT,
        allowNull: false
      },
      payment_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      method: {
        type: Sequelize.ENUM('ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE'),
        allowNull: false,
        defaultValue: 'ESPECES'
      },
      reference: {
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Payments');
  }
};
