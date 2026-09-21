/**
 * @swagger
 * tags:
 *   name: Écoles
 *   description: Gestion des établissements (multi-tenant)
 */

/**
 * @swagger
 * /schools:
 *   post:
 *     summary: Créer une école
 *     description: Réservé au SUPER_ADMIN.
 *     tags: [Écoles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Groupe Scolaire Les Lumières
 *               address:
 *                 type: string
 *                 example: Abidjan, Cocody
 *               phone:
 *                 type: string
 *                 example: "0102030405"
 *               email:
 *                 type: string
 *                 example: contact@lumieres.edu
 *     responses:
 *       201:
 *         description: École créée
 *       400:
 *         description: Nom manquant ou déjà utilisé
 */

/**
 * @swagger
 * /schools:
 *   get:
 *     summary: Liste des écoles
 *     tags: [Écoles]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des écoles
 */

/**
 * @swagger
 * /schools/{id}:
 *   get:
 *     summary: Détail d'une école
 *     tags: [Écoles]
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
 *         description: École trouvée
 *       404:
 *         description: École introuvable
 */

/**
 * @swagger
 * /schools/{id}:
 *   put:
 *     summary: Modifier une école
 *     description: Réservé au SUPER_ADMIN.
 *     tags: [Écoles]
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
 *     responses:
 *       200:
 *         description: École modifiée
 *       404:
 *         description: École introuvable
 */

/**
 * @swagger
 * /schools/{id}:
 *   delete:
 *     summary: Supprimer une école
 *     description: Réservé au SUPER_ADMIN. Refusé (contrainte FK) si des utilisateurs sont encore rattachés à l'école.
 *     tags: [Écoles]
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
 *         description: École supprimée
 *       404:
 *         description: École introuvable
 */
