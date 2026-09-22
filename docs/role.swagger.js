/**
 * @swagger
 * tags:
 *   name: Rôles
 *   description: Rôles et permissions associées (lecture seule)
 */

/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Liste des rôles avec leurs permissions
 *     tags: [Rôles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des rôles
 */

/**
 * @swagger
 * /roles/{id}:
 *   get:
 *     summary: Détail d'un rôle avec ses permissions
 *     tags: [Rôles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Rôle trouvé
 *       404:
 *         description: Rôle introuvable
 */
