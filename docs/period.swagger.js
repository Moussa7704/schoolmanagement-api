/**
 * @swagger
 * tags:
 *   name: Périodes
 *   description: Trimestres/semestres d'une année scolaire
 */

/**
 * @swagger
 * /periods:
 *   post:
 *     summary: Créer une période
 *     tags: [Périodes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - academic_year_id
 *               - label
 *               - start_date
 *               - end_date
 *             properties:
 *               academic_year_id:
 *                 type: integer
 *                 example: 1
 *               label:
 *                 type: string
 *                 example: "Trimestre 1"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-12-20"
 *               position:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Période créée
 *       400:
 *         description: Champs manquants
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Année scolaire introuvable
 */

/**
 * @swagger
 * /periods:
 *   get:
 *     summary: Liste des périodes
 *     tags: [Périodes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academic_year_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des périodes
 */

/**
 * @swagger
 * /periods/{id}:
 *   get:
 *     summary: Détail d'une période
 *     tags: [Périodes]
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
 *         description: Période trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Période introuvable
 */

/**
 * @swagger
 * /periods/{id}:
 *   put:
 *     summary: Modifier une période
 *     tags: [Périodes]
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
 *             properties:
 *               label:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               position:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Période modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Période introuvable
 */

/**
 * @swagger
 * /periods/{id}:
 *   delete:
 *     summary: Supprimer une période
 *     tags: [Périodes]
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
 *         description: Période supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Période introuvable
 */
