'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Payment.belongsTo(models.TuitionFee, {
        foreignKey: "tuition_fee_id",
        as: "TuitionFee"
      });
    }
  }
  Payment.init({
    tuition_fee_id: DataTypes.INTEGER,
    amount: DataTypes.FLOAT,
    payment_date: DataTypes.DATEONLY,
    method: {
      type: DataTypes.ENUM('ESPECES', 'MOBILE_MONEY', 'VIREMENT', 'CHEQUE'),
      defaultValue: 'ESPECES'
    },
    reference: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Payment',
  });
  return Payment;
};
