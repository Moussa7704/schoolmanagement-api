/**
 * @swagger
 * tags:
 *   name: Affectations enseignants
 *   description: Affectation d'un enseignant à une matière pour une classe donnée
 */

/**
 * @swagger
 * /teacher-assignments:
 *   post:
 *     summary: Affecter un enseignant à une matière pour une classe
 *     description: Un seul enseignant titulaire par (classe, matière). L'année scolaire est dérivée de la classe.
 *     tags: [Affectations enseignants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - teacher_id
 *               - class_id
 *               - subject_id
 *             properties:
 *               teacher_id:
 *                 type: integer
 *               class_id:
 *                 type: integer
 *               subject_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Affectation créée
 *       400:
 *         description: Champs manquants, enseignant/matière d'une autre école, ou déjà un titulaire pour cette matière/classe
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe, enseignant ou matière introuvable
 */

/**
 * @swagger
 * /teacher-assignments:
 *   get:
 *     summary: Liste des affectations
 *     tags: [Affectations enseignants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: teacher_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des affectations
 */

/**
 * @swagger
 * /teacher-assignments/{id}:
 *   get:
 *     summary: Détail d'une affectation
 *     tags: [Affectations enseignants]
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
 *         description: Affectation trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Affectation introuvable
 */

/**
 * @swagger
 * /teacher-assignments/{id}:
 *   delete:
 *     summary: Retirer une affectation
 *     tags: [Affectations enseignants]
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
 *         description: Affectation supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Affectation introuvable
 */
