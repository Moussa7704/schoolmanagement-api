/**
 * @swagger
 * tags:
 *   name: Présences
 *   description: Présences/absences par classe et par séance
 */

/**
 * @swagger
 * /attendances:
 *   post:
 *     summary: Marquer une présence
 *     description: L'élève doit être inscrit activement dans la classe. Un TEACHER doit être affecté à la classe (n'importe quelle matière).
 *     tags: [Présences]
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
 *               - date
 *               - session
 *             properties:
 *               student_id:
 *                 type: integer
 *               class_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               session:
 *                 type: string
 *                 enum: [MORNING, AFTERNOON]
 *               status:
 *                 type: string
 *                 enum: [PRESENT, ABSENT, LATE]
 *                 default: PRESENT
 *               justified:
 *                 type: boolean
 *                 default: false
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Présence enregistrée
 *       400:
 *         description: Champs manquants, élève non inscrit, ou double saisie pour cette date/séance
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe ou élève introuvable
 */

/**
 * @swagger
 * /attendances/roll-call:
 *   post:
 *     summary: Faire l'appel d'une classe (toutes les présences d'une date et d'une séance)
 *     description: "Enregistre en une fois le statut de chaque élève. Une présence déjà saisie pour ce créneau est mise à jour au lieu d'être dupliquée (correction de l'appel, qui demande aussi attendances.update). Tout ou rien : un élève non inscrit dans la classe annule l'ensemble. Un TEACHER ne peut faire l'appel que dans ses propres classes."
 *     tags: [Présences]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class_id, date, session, entries]
 *             properties:
 *               class_id:
 *                 type: integer
 *               date:
 *                 type: string
 *                 format: date
 *               session:
 *                 type: string
 *                 enum: [MORNING, AFTERNOON]
 *               entries:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [student_id]
 *                   properties:
 *                     student_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, LATE]
 *                       default: PRESENT
 *                     justified:
 *                       type: boolean
 *                     reason:
 *                       type: string
 *     responses:
 *       201:
 *         description: "Appel enregistré { created, updated, attendances }"
 *       400:
 *         description: Données invalides ou élève non inscrit dans la classe
 *       403:
 *         description: Classe hors de portée, ou correction d'un appel sans attendances.update
 *   delete:
 *     summary: Supprimer l'appel d'un créneau (classe + date + séance)
 *     description: "Annule un appel fait par erreur (ex. mauvaise séance) : toutes les présences de la classe pour cette date et cette séance sont supprimées. Un TEACHER ne peut le faire que dans ses propres classes."
 *     tags: [Présences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: session
 *         required: true
 *         schema:
 *           type: string
 *           enum: [MORNING, AFTERNOON]
 *     responses:
 *       200:
 *         description: "Appel supprimé { deleted }"
 *       400:
 *         description: Paramètres manquants ou invalides
 *       403:
 *         description: Classe hors de portée
 *       404:
 *         description: Aucun appel enregistré pour ce créneau
 */

/**
 * @swagger
 * /attendances/stats:
 *   get:
 *     summary: Taux d'absentéisme d'un élève sur une période
 *     description: Calculé à la volée en filtrant les présences de la classe active de l'élève dans les bornes de la période.
 *     tags: [Présences]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: period_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistiques calculées (total_sessions, present_count, absent_count, late_count, absenteeism_rate)
 *       400:
 *         description: Champs manquants ou aucune inscription active
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève ou période introuvable
 */

/**
 * @swagger
 * /attendances:
 *   get:
 *     summary: Liste des présences
 *     tags: [Présences]
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
 *         description: Liste des présences
 */

/**
 * @swagger
 * /attendances/{id}:
 *   get:
 *     summary: Détail d'une présence
 *     tags: [Présences]
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
 *         description: Présence trouvée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Présence introuvable
 */

/**
 * @swagger
 * /attendances/{id}:
 *   put:
 *     summary: Modifier une présence (statut, justification)
 *     tags: [Présences]
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
 *                 enum: [PRESENT, ABSENT, LATE]
 *               justified:
 *                 type: boolean
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Présence modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Présence introuvable
 */

/**
 * @swagger
 * /attendances/{id}:
 *   delete:
 *     summary: Supprimer une présence
 *     tags: [Présences]
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
 *         description: Présence supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Présence introuvable
 */
