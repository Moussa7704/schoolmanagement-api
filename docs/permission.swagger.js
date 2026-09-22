/**
 * @swagger
 * tags:
 *   name: Permissions
 *   description: Catalogue des permissions disponibles sur la plateforme (lecture seule -- fixées par le code, non créables via l'API)
 */

/**
 * @swagger
 * /permissions:
 *   get:
 *     summary: Liste de toutes les permissions disponibles
 *     tags: [Permissions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des permissions
 */
