/**
 * @swagger
 * tags:
 *   name: Bulletins
 *   description: Génération et validation des bulletins scolaires
 */

/**
 * @swagger
 * /report-cards:
 *   post:
 *     summary: Générer un bulletin pour un élève sur une période
 *     description: La classe est résolue automatiquement via l'inscription active de l'élève pour l'année scolaire de la période.
 *     tags: [Bulletins]
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
 *               - period_id
 *             properties:
 *               student_id:
 *                 type: integer
 *               period_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Bulletin généré (statut DRAFT)
 *       400:
 *         description: Champs manquants, aucune inscription active, ou bulletin déjà existant pour cette période
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève ou période introuvable
 */

/**
 * @swagger
 * /report-cards:
 *   get:
 *     summary: Liste des bulletins
 *     tags: [Bulletins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: class_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des bulletins
 */

/**
 * @swagger
 * /report-cards/{id}:
 *   get:
 *     summary: Détail d'un bulletin (moyennes et classement calculés à la volée)
 *     description: Retourne la moyenne par matière, la moyenne générale et le rang de l'élève dans sa classe pour cette période, calculés depuis les notes existantes au moment de la lecture.
 *     tags: [Bulletins]
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
 *         description: Bulletin trouvé, avec le détail des moyennes par matière, la moyenne générale, le rang et le nombre total d'élèves classés
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Bulletin introuvable
 */

/**
 * @swagger
 * /report-cards/ranking:
 *   get:
 *     summary: Classement des élèves d'une classe pour une période
 *     description: Classement "1224" (deux moyennes égales partagent le même rang) calculé sur tous les élèves activement inscrits dans la classe. Un parent ne peut consulter que le classement d'une classe où il a un enfant activement inscrit.
 *     tags: [Bulletins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: class_id
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
 *         description: Classement de la classe, trié par moyenne générale décroissante (élèves sans note en fin de liste, non classés)
 *       400:
 *         description: class_id ou period_id manquant
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe introuvable
 */

/**
 * @swagger
 * /report-cards/{id}/validate:
 *   patch:
 *     summary: Valider un bulletin (DRAFT → VALIDATED)
 *     description: Réservé à DIRECTOR, SCHOOL_ADMIN et SUPER_ADMIN.
 *     tags: [Bulletins]
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
 *         description: Bulletin validé
 *       400:
 *         description: Bulletin déjà validé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Bulletin introuvable
 */

/**
 * @swagger
 * /report-cards/{id}:
 *   delete:
 *     summary: Supprimer un bulletin
 *     tags: [Bulletins]
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
 *         description: Bulletin supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Bulletin introuvable
 */
