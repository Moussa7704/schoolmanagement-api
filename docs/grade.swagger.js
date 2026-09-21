/**
 * @swagger
 * tags:
 *   name: Notes
 *   description: Notes des élèves pour une évaluation
 */

/**
 * @swagger
 * /grades:
 *   post:
 *     summary: Saisir une note
 *     description: L'élève doit être inscrit activement dans la classe de l'affectation. La note doit être comprise entre 0 et max_score de l'évaluation.
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assessment_id
 *               - student_id
 *               - score
 *             properties:
 *               assessment_id:
 *                 type: integer
 *               student_id:
 *                 type: integer
 *               score:
 *                 type: number
 *     responses:
 *       201:
 *         description: Note enregistrée
 *       400:
 *         description: Note hors limites, élève non inscrit, ou note déjà existante pour cet élève/évaluation
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Évaluation introuvable
 */

/**
 * @swagger
 * /grades:
 *   get:
 *     summary: Liste des notes
 *     tags: [Notes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: assessment_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des notes
 */

/**
 * @swagger
 * /grades/{id}:
 *   get:
 *     summary: Détail d'une note
 *     tags: [Notes]
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
 *         description: Note trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Note introuvable
 */

/**
 * @swagger
 * /grades/{id}:
 *   put:
 *     summary: Modifier une note
 *     tags: [Notes]
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
 *               - score
 *             properties:
 *               score:
 *                 type: number
 *     responses:
 *       200:
 *         description: Note modifiée
 *       400:
 *         description: Note hors limites
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Note introuvable
 */

/**
 * @swagger
 * /grades/{id}:
 *   delete:
 *     summary: Supprimer une note
 *     tags: [Notes]
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
 *         description: Note supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Note introuvable
 */
