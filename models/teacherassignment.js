'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TeacherAssignment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      TeacherAssignment.belongsTo(models.Teacher, {
        foreignKey: "teacher_id",
        as: "Teacher"
      });
      TeacherAssignment.belongsTo(models.Class, {
        foreignKey: "class_id",
        as: "Class"
      });
      TeacherAssignment.belongsTo(models.Subject, {
        foreignKey: "subject_id",
        as: "Subject"
      });
      TeacherAssignment.belongsTo(models.AcademicYear, {
        foreignKey: "academic_year_id",
        as: "AcademicYear"
      });
    }
  }
  TeacherAssignment.init({
    teacher_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    academic_year_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TeacherAssignment',
  });
  return TeacherAssignment;
};
