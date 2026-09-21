'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Role extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Role.hasMany(models.User, {
        foreignKey: "role_id",
        as: "users"
      });
      Role.belongsToMany(models.Permission, {
        through: models.RolePermission,
        foreignKey: "role_id",
        otherKey: "permission_id",
        as: "Permissions"
      });
    }
  }
  Role.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Role',
  });
  return Role;
};