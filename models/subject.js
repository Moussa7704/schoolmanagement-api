'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Subject extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Subject.belongsTo(models.School, {
        foreignKey: "school_id",
        as: "School"
      });
      Subject.hasMany(models.TeacherAssignment, {
        foreignKey: "subject_id",
        as: "TeacherAssignments"
      });
    }
  }
  Subject.init({
    school_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    coefficient_default: {
      type: DataTypes.FLOAT,
      defaultValue: 1
    }
  }, {
    sequelize,
    modelName: 'Subject',
  });
  return Subject;
};
