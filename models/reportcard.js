'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ReportCard extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      ReportCard.belongsTo(models.Student, {
        foreignKey: "student_id",
        as: "Student"
      });
      ReportCard.belongsTo(models.Class, {
        foreignKey: "class_id",
        as: "Class"
      });
      ReportCard.belongsTo(models.Period, {
        foreignKey: "period_id",
        as: "Period"
      });
      ReportCard.belongsTo(models.User, {
        foreignKey: "validated_by",
        as: "ValidatedBy"
      });
    }
  }
  ReportCard.init({
    student_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    period_id: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM('DRAFT', 'VALIDATED'),
      defaultValue: 'DRAFT'
    },
    generated_at: DataTypes.DATE,
    validated_at: DataTypes.DATE,
    validated_by: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ReportCard',
  });
  return ReportCard;
};
