'use strict';

const crypto = require('crypto');

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  // Les refresh tokens ne sont plus stockés en clair mais sous forme de hash
  // SHA-256 (comme les jetons de réinitialisation du mot de passe). Les jetons
  // encore valides sont convertis sur place : les sessions ouvertes continuent
  // de fonctionner. Les jetons révoqués ou expirés ne servent plus à rien et
  // sont supprimés.
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `DELETE FROM "RefreshTokens" WHERE revoked = true OR expires_at < NOW()`
    );

    const [rows] = await queryInterface.sequelize.query(`SELECT id, token FROM "RefreshTokens"`);
    for (const row of rows) {
      // Un hash SHA-256 fait 64 caractères hexadécimaux ; un JWT est bien plus
      // long : on ne re-hache jamais une valeur déjà convertie.
      if (/^[0-9a-f]{64}$/.test(row.token)) continue;
      await queryInterface.sequelize.query(
        `UPDATE "RefreshTokens" SET token = :hash WHERE id = :id`,
        { replacements: { hash: sha256(row.token), id: row.id } }
      );
    }

    await queryInterface.addIndex('RefreshTokens', ['token'], { name: 'refresh_tokens_token_idx' });
  },

  // Un hash ne peut pas être « dé-haché » : revenir en arrière déconnecte tout le monde.
  async down(queryInterface) {
    await queryInterface.removeIndex('RefreshTokens', 'refresh_tokens_token_idx');
    await queryInterface.sequelize.query(`DELETE FROM "RefreshTokens"`);
  }
};
