'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Durcissement des OTP de connexion :
  // - attempts   : nombre de mauvais codes saisis (le code est invalidé au-delà
  //                de la limite, voir service/auth.service.js) ;
  // - send_count : nombre d'envois pour la même tentative de connexion (limite
  //                des renvois).
  // Les codes sont désormais stockés hachés : les codes en clair encore en base
  // ne pourraient plus être vérifiés, ils sont donc supprimés (l'utilisateur se
  // reconnecte simplement pour en recevoir un nouveau).
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Otps', 'attempts', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
    await queryInterface.addColumn('Otps', 'send_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1
    });
    await queryInterface.bulkDelete('Otps', {});
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('Otps', 'send_count');
    await queryInterface.removeColumn('Otps', 'attempts');
  }
};
