'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Grade extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Grade.belongsTo(models.Assessment, {
        foreignKey: "assessment_id",
        as: "Assessment"
      });
      Grade.belongsTo(models.Student, {
        foreignKey: "student_id",
        as: "Student"
      });
    }
  }
  Grade.init({
    assessment_id: DataTypes.INTEGER,
    student_id: DataTypes.INTEGER,
    score: DataTypes.FLOAT
  }, {
    sequelize,
    modelName: 'Grade',
  });
  return Grade;
};
