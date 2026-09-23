'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Schedule.belongsTo(models.TeacherAssignment, {
        foreignKey: "teacher_assignment_id",
        as: "TeacherAssignment"
      });
    }
  }
  Schedule.init({
    teacher_assignment_id: DataTypes.INTEGER,
    day_of_week: DataTypes.ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'),
    start_time: DataTypes.TIME,
    end_time: DataTypes.TIME,
    room: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Schedule',
  });
  return Schedule;
};
