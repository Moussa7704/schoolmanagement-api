/**
 * @swagger
 * tags:
 *   name: Évaluations
 *   description: Devoirs et examens rattachés à une affectation enseignant/matière/classe
 */

/**
 * @swagger
 * /assessments:
 *   post:
 *     summary: Créer une évaluation
 *     description: Un TEACHER ne peut créer que sur ses propres affectations (TeacherAssignment). La période doit appartenir à l'année scolaire de l'affectation.
 *     tags: [Évaluations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_assignment_id
 *               - period_id
 *               - name
 *             properties:
 *               teacher_assignment_id:
 *                 type: integer
 *               period_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 example: Devoir 1
 *               type:
 *                 type: string
 *                 enum: [DEVOIR, EXAMEN]
 *                 default: DEVOIR
 *               coefficient:
 *                 type: number
 *                 default: 1
 *               max_score:
 *                 type: number
 *                 default: 20
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Évaluation créée
 *       400:
 *         description: Champs manquants ou période d'une autre année scolaire
 *       403:
 *         description: Accès refusé (affectation d'un autre enseignant/école)
 *       404:
 *         description: Affectation ou période introuvable
 */

/**
 * @swagger
 * /assessments:
 *   get:
 *     summary: Liste des évaluations
 *     description: Un TEACHER ne voit que les évaluations de ses propres affectations.
 *     tags: [Évaluations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: teacher_assignment_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des évaluations
 */

/**
 * @swagger
 * /assessments/{id}:
 *   get:
 *     summary: Détail d'une évaluation
 *     tags: [Évaluations]
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
 *         description: Évaluation trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Évaluation introuvable
 */

/**
 * @swagger
 * /assessments/{id}:
 *   put:
 *     summary: Modifier une évaluation
 *     tags: [Évaluations]
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
 *         description: Évaluation modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Évaluation introuvable
 */

/**
 * @swagger
 * /assessments/{id}:
 *   delete:
 *     summary: Supprimer une évaluation
 *     tags: [Évaluations]
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
 *         description: Évaluation supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Évaluation introuvable
 */
