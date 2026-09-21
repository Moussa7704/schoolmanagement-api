/**
 * @swagger
 * tags:
 *   name: Matières
 *   description: Catalogue des matières par école
 */

/**
 * @swagger
 * /subjects:
 *   post:
 *     summary: Créer une matière
 *     tags: [Matières]
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
 *               school_id:
 *                 type: integer
 *                 description: Requis uniquement pour un SUPER_ADMIN
 *               name:
 *                 type: string
 *                 example: Mathématiques
 *               coefficient_default:
 *                 type: number
 *                 example: 3
 *     responses:
 *       201:
 *         description: Matière créée
 *       400:
 *         description: Champs manquants ou nom déjà utilisé dans cette école
 *       404:
 *         description: École introuvable
 */

/**
 * @swagger
 * /subjects:
 *   get:
 *     summary: Liste des matières
 *     description: Un SCHOOL_ADMIN ne voit que les matières de sa propre école.
 *     tags: [Matières]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des matières
 */

/**
 * @swagger
 * /subjects/{id}:
 *   get:
 *     summary: Détail d'une matière
 *     tags: [Matières]
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
 *         description: Matière trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Matière introuvable
 */

/**
 * @swagger
 * /subjects/{id}:
 *   put:
 *     summary: Modifier une matière
 *     tags: [Matières]
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
 *         description: Matière modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Matière introuvable
 */

/**
 * @swagger
 * /subjects/{id}:
 *   delete:
 *     summary: Supprimer une matière
 *     tags: [Matières]
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
 *         description: Matière supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Matière introuvable
 */
