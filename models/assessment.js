'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Assessment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Assessment.belongsTo(models.TeacherAssignment, {
        foreignKey: "teacher_assignment_id",
        as: "TeacherAssignment"
      });
      Assessment.belongsTo(models.Period, {
        foreignKey: "period_id",
        as: "Period"
      });
      Assessment.hasMany(models.Grade, {
        foreignKey: "assessment_id",
        as: "Grades"
      });
    }
  }
  Assessment.init({
    teacher_assignment_id: DataTypes.INTEGER,
    period_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    type: {
      type: DataTypes.ENUM('DEVOIR', 'COMPOSITION'),
      defaultValue: 'DEVOIR'
    },
    coefficient: {
      type: DataTypes.FLOAT,
      defaultValue: 1
    },
    max_score: {
      type: DataTypes.FLOAT,
      defaultValue: 20
    },
    date: DataTypes.DATEONLY
  }, {
    sequelize,
    modelName: 'Assessment',
  });
  return Assessment;
};
