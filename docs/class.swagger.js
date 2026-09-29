/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: Classes rattachées à une année scolaire
 */

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: Créer une classe
 *     tags: [Classes]
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
 *               - name
 *             properties:
 *               academic_year_id:
 *                 type: integer
 *               name:
 *                 type: string
 *                 example: 6ème A
 *               level:
 *                 type: string
 *                 example: 6ème
 *               capacity:
 *                 type: integer
 *                 example: 40
 *     responses:
 *       201:
 *         description: Classe créée
 *       400:
 *         description: Champs manquants
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Année scolaire introuvable
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: Liste des classes (avec effectifs calculés)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: academic_year_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des classes, chacune enrichie de students_count, boys_count et girls_count (calculés depuis les inscriptions actives)
 */

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: Détail d'une classe (effectifs calculés à la volée)
 *     tags: [Classes]
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
 *         description: Classe trouvée, avec students_count, boys_count et girls_count
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe introuvable
 */

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: Modifier une classe
 *     tags: [Classes]
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
 *         description: Classe modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe introuvable
 */

/**
 * @swagger
 * /classes/{id}/promote:
 *   post:
 *     summary: "Classe suivante : promouvoir en masse les élèves actifs de cette classe vers une autre"
 *     description: Ne modifie jamais l'inscription de l'année en cours (historique préservé) — crée une nouvelle inscription par élève dans la classe cible (généralement l'année scolaire suivante). Permet d'envoyer certains élèves vers une autre classe que les autres (ex redoublement, statut REPEATING).
 *     tags: [Classes]
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
 *               - promotions
 *             properties:
 *               promotions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - student_id
 *                     - target_class_id
 *                   properties:
 *                     student_id:
 *                       type: integer
 *                     target_class_id:
 *                       type: integer
 *                     status:
 *                       type: string
 *                       enum: [ACTIVE, REPEATING]
 *                       default: ACTIVE
 *     responses:
 *       201:
 *         description: Nouvelles inscriptions créées dans les classes cibles
 *       400:
 *         description: Élève sans inscription active dans la classe source, ou déjà inscrit dans la classe cible
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe source, élève ou classe cible introuvable
 */

/**
 * @swagger
 * /classes/{id}/students/export:
 *   get:
 *     summary: Exporter la liste des élèves inscrits dans la classe (PDF)
 *     description: Élèves dont l'inscription est ACTIVE ou REPEATING, triés par nom. Colonnes : N°, matricule, nom, prénom, sexe, date de naissance, n° d'inscription. PDF A4 paysage : en-tête avec école, classe, année scolaire et effectif garçons/filles ; titres de colonnes répétés et numéro de page sur chaque page.
 *     tags: [Classes]
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
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Accès refusé (classe d'une autre école, ou permission enrollments.view manquante)
 *       404:
 *         description: Classe introuvable
 */

/**
 * @swagger
 * /classes/{id}/schedule/export:
 *   get:
 *     summary: Exporter l'emploi du temps de la classe (PDF)
 *     description: PDF A4 paysage sur une page. Lignes = tranches horaires utilisées par la classe, colonnes = lundi → samedi (dimanche seulement s'il y a cours), cellules = matière, enseignant et salle.
 *     tags: [Classes]
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
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Accès refusé (classe d'une autre école, ou permission schedules.view manquante)
 *       404:
 *         description: Classe introuvable
 */

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: Supprimer une classe
 *     tags: [Classes]
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
 *         description: Classe supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Classe introuvable
 */
