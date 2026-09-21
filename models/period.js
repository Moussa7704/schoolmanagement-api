'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Period extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Period.belongsTo(models.AcademicYear, {
        foreignKey: "academic_year_id",
        as: "AcademicYear"
      });
    }
  }
  Period.init({
    academic_year_id: DataTypes.INTEGER,
    label: DataTypes.STRING,
    start_date: DataTypes.DATEONLY,
    end_date: DataTypes.DATEONLY,
    position: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'Period',
  });
  return Period;
};
