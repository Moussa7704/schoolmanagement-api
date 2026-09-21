'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      User.belongsTo(models.Role, {
        foreignKey: "role_id",
        as: "Role"
      });
      User.belongsTo(models.School, {
        foreignKey: "school_id",
        as: "School"
      });
      User.hasOne(models.Teacher, {
        foreignKey: "user_id",
        as: "Teacher"
      });
      User.hasOne(models.Student, {
        foreignKey: "user_id",
        as: "Student"
      });
      User.hasOne(models.Guardian, {
        foreignKey: "user_id",
        as: "Guardian"
      });
    }
  }
  User.init({
    school_id: DataTypes.INTEGER,
    role_id: DataTypes.INTEGER,
    first_name: DataTypes.STRING,
    last_name: DataTypes.STRING,
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended', 'pending'),
      defaultValue: 'active',
      validate: {
        isIn: [['active', 'inactive', 'suspended', 'pending']]
      }
    }
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};