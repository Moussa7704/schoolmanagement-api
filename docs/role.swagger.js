/**
 * @swagger
 * tags:
 *   name: Rôles
 *   description: Rôles fixes de la plateforme et gestion de leurs permissions
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

/**
 * @swagger
 * /roles/{id}/permissions:
 *   put:
 *     summary: Remplacer la liste des permissions d'un rôle
 *     description: "Réservé à SUPER_ADMIN. Remplace intégralement l'ensemble des permissions du rôle (tableau vide = retire tout). Le rôle SUPER_ADMIN ne peut pas être modifié ici, car il contourne toujours la vérification des permissions, donc éditer ses lignes n'aurait aucun effet réel."
 *     tags: [Rôles]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permission_ids
 *             properties:
 *               permission_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Permissions mises à jour, rôle retourné avec sa nouvelle liste de permissions
 *       400:
 *         description: permission_ids invalide, permission_id introuvable, ou tentative de modifier SUPER_ADMIN
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Rôle introuvable
 */
