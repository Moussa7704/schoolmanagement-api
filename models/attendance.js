'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Attendance extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Attendance.belongsTo(models.Student, {
        foreignKey: "student_id",
        as: "Student"
      });
      Attendance.belongsTo(models.Class, {
        foreignKey: "class_id",
        as: "Class"
      });
    }
  }
  Attendance.init({
    student_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    date: DataTypes.DATEONLY,
    session: DataTypes.ENUM('MORNING', 'AFTERNOON'),
    status: {
      type: DataTypes.ENUM('PRESENT', 'ABSENT', 'LATE'),
      defaultValue: 'PRESENT'
    },
    justified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    reason: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Attendance',
  });
  return Attendance;
};
