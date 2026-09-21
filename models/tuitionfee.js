'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TuitionFee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TuitionFee.belongsTo(models.Student, {
        foreignKey: "student_id",
        as: "Student"
      });
      TuitionFee.belongsTo(models.AcademicYear, {
        foreignKey: "academic_year_id",
        as: "AcademicYear"
      });
      TuitionFee.hasMany(models.Payment, {
        foreignKey: "tuition_fee_id",
        as: "Payments"
      });
    }
  }
  TuitionFee.init({
    student_id: DataTypes.INTEGER,
    academic_year_id: DataTypes.INTEGER,
    label: DataTypes.STRING,
    amount: DataTypes.FLOAT,
    due_date: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'TuitionFee',
  });
  return TuitionFee;
};
