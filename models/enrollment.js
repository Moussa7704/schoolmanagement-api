'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Enrollment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Enrollment.belongsTo(models.Student, {
        foreignKey: "student_id"
      });
      Enrollment.belongsTo(models.Class, {
        foreignKey: "class_id"
      });
      Enrollment.belongsTo(models.AcademicYear, {
        foreignKey: "academic_year_id"
      });
    }
  }
  Enrollment.init({
    student_id: DataTypes.INTEGER,
    class_id: DataTypes.INTEGER,
    academic_year_id: DataTypes.INTEGER,
    status: {
      type: DataTypes.ENUM('ACTIVE', 'TRANSFERRED', 'REPEATING', 'WITHDRAWN'),
      defaultValue: 'ACTIVE'
    },
    enrollment_date: DataTypes.DATEONLY,
    registration_number: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Enrollment',
  });
  return Enrollment;
};
