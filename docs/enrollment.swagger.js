/**
 * @swagger
 * tags:
 *   name: Inscriptions
 *   description: Inscription des élèves dans les classes (historique conservé d'une année sur l'autre)
 */

/**
 * @swagger
 * /enrollments:
 *   post:
 *     summary: Inscrire un élève dans une classe
 *     description: L'année scolaire est dérivée automatiquement de la classe. Une seule inscription ACTIVE par élève et par année scolaire est autorisée (garanti en base).
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - class_id
 *             properties:
 *               student_id:
 *                 type: integer
 *               class_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, TRANSFERRED, REPEATING, WITHDRAWN]
 *                 default: ACTIVE
 *               enrollment_date:
 *                 type: string
 *                 format: date
 *               registration_number:
 *                 type: string
 *     responses:
 *       201:
 *         description: Élève inscrit
 *       400:
 *         description: Champs manquants, élève déjà inscrit dans cette classe, ou déjà une inscription active cette année
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe ou élève introuvable
 */

/**
 * @swagger
 * /enrollments:
 *   get:
 *     summary: Liste des inscriptions
 *     tags: [Inscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des inscriptions
 */

/**
 * @swagger
 * /enrollments/{id}:
 *   get:
 *     summary: Détail d'une inscription
 *     tags: [Inscriptions]
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
 *         description: Inscription trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Inscription introuvable
 */

/**
 * @swagger
 * /enrollments/{id}:
 *   put:
 *     summary: Modifier une inscription (changement de statut, transfert, redoublement...)
 *     tags: [Inscriptions]
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
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, TRANSFERRED, REPEATING, WITHDRAWN]
 *               enrollment_date:
 *                 type: string
 *                 format: date
 *               registration_number:
 *                 type: string
 *     responses:
 *       200:
 *         description: Inscription modifiée
 *       400:
 *         description: Remise à ACTIVE refusée si une autre inscription active existe déjà cette année
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Inscription introuvable
 */

/**
 * @swagger
 * /enrollments/{id}:
 *   delete:
 *     summary: Supprimer une inscription
 *     tags: [Inscriptions]
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
 *         description: Inscription supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Inscription introuvable
 */
