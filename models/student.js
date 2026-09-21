'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Student extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Student.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "User"
      });
      Student.belongsTo(models.School, {
        foreignKey: "school_id",
        as: "School"
      });
      Student.belongsToMany(models.Guardian, {
        through: models.StudentGuardian,
        foreignKey: "student_id",
        otherKey: "guardian_id",
        as: "Guardians"
      });
      Student.belongsToMany(models.Class, {
        through: models.Enrollment,
        foreignKey: "student_id",
        otherKey: "class_id",
        as: "Classes"
      });
      Student.hasMany(models.Grade, {
        foreignKey: "student_id",
        as: "Grades"
      });
      Student.hasMany(models.ReportCard, {
        foreignKey: "student_id",
        as: "ReportCards"
      });
    }
  }
  Student.init({
    user_id: DataTypes.INTEGER,
    school_id: DataTypes.INTEGER,
    student_number: DataTypes.STRING,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    date_of_birth: DataTypes.DATEONLY,
    gender: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Student',
  });
  return Student;
};
