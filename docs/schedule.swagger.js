/**
 * @swagger
 * tags:
 *   name: Emploi du temps
 *   description: Créneaux horaires hebdomadaires récurrents, rattachés à une affectation enseignant/classe/matière
 */

/**
 * @swagger
 * /schedules:
 *   post:
 *     summary: Créer un créneau horaire
 *     description: Rejeté si la classe ou l'enseignant de l'affectation a déjà un créneau qui chevauche celui-ci le même jour.
 *     tags: [Emploi du temps]
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
 *               - day_of_week
 *               - start_time
 *               - end_time
 *             properties:
 *               teacher_assignment_id:
 *                 type: integer
 *               day_of_week:
 *                 type: string
 *                 enum: [MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY]
 *               start_time:
 *                 type: string
 *                 example: "08:00:00"
 *               end_time:
 *                 type: string
 *                 example: "10:00:00"
 *               room:
 *                 type: string
 *     responses:
 *       201:
 *         description: Créneau créé
 *       400:
 *         description: Champs manquants, heure de fin avant l'heure de début, ou conflit avec un créneau existant (classe ou enseignant déjà occupé)
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Affectation introuvable
 */

/**
 * @swagger
 * /schedules:
 *   get:
 *     summary: Liste des créneaux
 *     tags: [Emploi du temps]
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
 *       - in: query
 *         name: teacher_assignment_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des créneaux, triée par jour puis heure, avec l'affectation (enseignant/classe/matière) jointe
 */

/**
 * @swagger
 * /schedules/{id}:
 *   get:
 *     summary: Détail d'un créneau
 *     tags: [Emploi du temps]
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
 *         description: Créneau trouvé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Créneau introuvable
 */

/**
 * @swagger
 * /schedules/{id}:
 *   put:
 *     summary: Modifier un créneau
 *     tags: [Emploi du temps]
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
 *         description: Créneau modifié
 *       400:
 *         description: Conflit avec un autre créneau
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Créneau introuvable
 */

/**
 * @swagger
 * /schedules/{id}:
 *   delete:
 *     summary: Supprimer un créneau
 *     tags: [Emploi du temps]
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
 *         description: Créneau supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Créneau introuvable
 */
