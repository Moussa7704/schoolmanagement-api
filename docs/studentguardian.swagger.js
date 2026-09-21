/**
 * @swagger
 * tags:
 *   name: Liens élève-tuteur
 *   description: Rattachement des tuteurs/responsables aux élèves
 */

/**
 * @swagger
 * /student-guardians:
 *   post:
 *     summary: Attacher un tuteur/responsable à un élève
 *     description: L'élève doit appartenir à l'école de l'utilisateur (sauf SUPER_ADMIN).
 *     tags: [Liens élève-tuteur]
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
 *               - guardian_id
 *               - relationship
 *             properties:
 *               student_id:
 *                 type: integer
 *               guardian_id:
 *                 type: integer
 *               relationship:
 *                 type: string
 *                 enum: [PERE, MERE, TUTEUR, AUTRE]
 *               is_primary_contact:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Lien créé
 *       400:
 *         description: Champs manquants ou lien déjà existant
 *       403:
 *         description: Élève d'une autre école
 *       404:
 *         description: Élève ou tuteur introuvable
 */

/**
 * @swagger
 * /student-guardians:
 *   get:
 *     summary: Liste des liens élève-responsable
 *     tags: [Liens élève-tuteur]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: guardian_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des liens
 */

/**
 * @swagger
 * /student-guardians/{id}:
 *   delete:
 *     summary: Détacher un responsable d'un élève
 *     tags: [Liens élève-tuteur]
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
 *         description: Lien supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Lien introuvable
 */
