'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AcademicYear extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AcademicYear.belongsTo(models.School, {
        foreignKey: "school_id",
        as: "School"
      });
      AcademicYear.hasMany(models.Period, {
        foreignKey: "academic_year_id",
        as: "Periods"
      });
      AcademicYear.hasMany(models.Class, {
        foreignKey: "academic_year_id",
        as: "Classes"
      });
    }
  }
  AcademicYear.init({
    school_id: DataTypes.INTEGER,
    label: DataTypes.STRING,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    is_current: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'AcademicYear',
  });
  return AcademicYear;
};
