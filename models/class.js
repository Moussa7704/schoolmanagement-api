'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Class.belongsTo(models.AcademicYear, {
        foreignKey: "academic_year_id",
        as: "AcademicYear"
      });
      Class.belongsToMany(models.Student, {
        through: models.Enrollment,
        foreignKey: "class_id",
        otherKey: "student_id",
        as: "Students"
      });
      Class.hasMany(models.TeacherAssignment, {
        foreignKey: "class_id",
        as: "TeacherAssignments"
      });
      Class.hasMany(models.ReportCard, {
        foreignKey: "class_id",
        as: "ReportCards"
      });
      Class.hasMany(models.Attendance, {
        foreignKey: "class_id",
        as: "Attendances"
      });
    }
  }
  Class.init({
    academic_year_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    level: DataTypes.STRING,
    capacity: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Class',
  });
  return Class;
};
