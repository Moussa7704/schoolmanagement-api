'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Guardian extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Guardian.belongsTo(models.User, {
        foreignKey: "user_id",
        as: "User"
      });
      Guardian.belongsToMany(models.Student, {
        through: models.StudentGuardian,
        foreignKey: "guardian_id",
        otherKey: "student_id",
        as: "Students"
      });
    }
  }
  Guardian.init({
    user_id: DataTypes.INTEGER,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Guardian',
  });
  return Guardian;
};
