'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Teacher extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Teacher.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "User"
      });
      Teacher.belongsTo(models.School, {
        foreignKey: "school_id",
        as: "School"
      });
      Teacher.hasMany(models.TeacherAssignment, {
        foreignKey: "teacher_id",
        as: "TeacherAssignments"
      });
    }
  }
  Teacher.init({
    user_id: DataTypes.INTEGER,
    school_id: DataTypes.INTEGER,
    specialty: DataTypes.STRING,
    hire_date: DataTypes.DATEONLY,
    employee_number: DataTypes.STRING,
    // "M" | "F" — sert à la civilité (Mr / Mme) dans l'emploi du temps.
    gender: DataTypes.ENUM('M', 'F')
  }, {
    sequelize,
    modelName: 'Teacher',
  });
  return Teacher;
};
