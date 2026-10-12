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
 *     summary: Générer un bulletin (trimestriel ou annuel) pour un élève
 *     description: "Trimestriel (type TRIMESTER, par défaut) : period_id requis. Annuel (type ANNUAL) : academic_year_id requis, et le bulletin du dernier trimestre de l'élève doit déjà exister ; un seul bulletin annuel par élève et par année. La classe est résolue via l'inscription active (ou redoublant) de l'élève sur l'année scolaire."
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
 *             properties:
 *               student_id:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [TRIMESTER, ANNUAL]
 *                 default: TRIMESTER
 *               period_id:
 *                 type: integer
 *                 description: Requis pour un bulletin trimestriel
 *               academic_year_id:
 *                 type: integer
 *                 description: Requis pour un bulletin annuel
 *     responses:
 *       201:
 *         description: Bulletin généré (statut DRAFT)
 *       400:
 *         description: Champs manquants, aucune inscription active, bulletin déjà existant, ou bulletin du dernier trimestre manquant (annuel)
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
 *       - in: query
 *         name: period_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: academic_year_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [TRIMESTER, ANNUAL]
 *     responses:
 *       200:
 *         description: Liste des bulletins
 */

/**
 * @swagger
 * /report-cards/{id}:
 *   get:
 *     summary: Détail d'un bulletin (moyennes et classement calculés à la volée)
 *     description: "Trimestriel : moyenne par matière, moyenne générale et rang de l'élève dans sa classe pour la période. Annuel : par matière les Moy/20 de chaque trimestre (term_averages) et la moyenne annuelle de la matière (moyenne des trimestres notés), les moyennes générales de chaque trimestre (terms), la moyenne annuelle = Σ (moyenne annuelle matière × coef) / Σ coef, et le rang annuel. Calculés depuis les notes existantes au moment de la lecture."
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
 *         description: Requis sauf pour type=ANNUAL
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         description: ANNUAL pour le classement / les bulletins annuels (année de la classe)
 *         schema:
 *           type: string
 *           enum: [TRIMESTER, ANNUAL]
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
 * /report-cards/class-pdf:
 *   get:
 *     summary: Imprimer tous les bulletins d'une classe (deux par feuille A4)
 *     description: Bulletins déjà créés pour la classe et la période, triés par nom d'élève. A4 paysage, un bulletin réduit sur chaque moitié, trait de découpe au milieu. Interdit aux parents.
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
 *         description: Requis sauf pour type=ANNUAL
 *         schema:
 *           type: integer
 *       - in: query
 *         name: type
 *         description: ANNUAL pour le classement / les bulletins annuels (année de la classe)
 *         schema:
 *           type: string
 *           enum: [TRIMESTER, ANNUAL]
 *     responses:
 *       200:
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: class_id ou period_id manquant
 *       403:
 *         description: Accès refusé (autre école, ou parent)
 *       404:
 *         description: Classe introuvable, ou aucun bulletin créé pour cette classe sur cette période
 */

/**
 * @swagger
 * /report-cards/{id}/pdf:
 *   get:
 *     summary: Télécharger le bulletin (PDF A4)
 *     description: |
 *       Bulletin au format malien. Par matière de la classe : Devoir (moyenne simple des devoirs, sur 20),
 *       Comp (composition), Moy/20 = (Devoir + Comp × 2) / 3 (vide s'il manque la Comp ou les devoirs),
 *       Coeff, Moy Gen = Moy/20 × Coeff, appréciation. Bulletin annuel : colonnes T1, T2, T3, Moy An.
 *       Ligne TOTAL (coefficients, Moy Gen), moyenne /20 = total Moy Gen / total coefficients, rang,
 *       retards et absences de la période (en demi-journées), appréciation du travail et distinction
 *       cochées automatiquement selon la moyenne (règles dans constants/grading.js).
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
 *         description: Fichier PDF
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Bulletin introuvable
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
