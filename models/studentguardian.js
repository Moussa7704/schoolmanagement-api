'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class StudentGuardian extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      StudentGuardian.belongsTo(models.Student, {
        foreignKey: "student_id"
      });
      StudentGuardian.belongsTo(models.Guardian, {
        foreignKey: "guardian_id"
      });
    }
  }
  StudentGuardian.init({
    // id déclaré explicitement : ce modèle sert de table de liaison
    // (belongsToMany ... through). Sans cela, Sequelize remplace l'id par une
    // clé primaire composée des deux clés étrangères — les lignes perdent leur
    // id et findByPk(id) chercherait sur la première clé étrangère.
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    student_id: DataTypes.INTEGER,
    guardian_id: DataTypes.INTEGER,
    relationship: DataTypes.ENUM('PERE', 'MERE', 'TUTEUR', 'AUTRE'),
    is_primary_contact: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    modelName: 'StudentGuardian',
  });
  return StudentGuardian;
};
