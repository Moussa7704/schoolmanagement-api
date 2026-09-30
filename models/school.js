'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class School extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      School.hasMany(models.User, {
        foreignKey: "school_id",
        as: "Users"
      });
      School.hasMany(models.AcademicYear, {
        foreignKey: "school_id",
        as: "AcademicYears"
      });
      School.hasMany(models.Subject, {
        foreignKey: "school_id",
        as: "Subjects"
      });
    }
  }
  School.init({
    name: DataTypes.STRING,
    address: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    // Académie d'enseignement de rattachement, pour l'en-tête des bulletins.
    academy: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'School',
  });
  return School;
};
