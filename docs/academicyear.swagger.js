/**
 * @swagger
 * tags:
 *   name: Années scolaires
 *   description: Gestion des années scolaires d'une école
 */

/**
 * @swagger
 * /academic-years:
 *   post:
 *     summary: Créer une année scolaire
 *     description: SCHOOL_ADMIN → toujours sur sa propre école. SUPER_ADMIN → doit préciser school_id.
 *     tags: [Années scolaires]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - label
 *               - start_date
 *               - end_date
 *             properties:
 *               school_id:
 *                 type: integer
 *                 description: Requis uniquement pour un SUPER_ADMIN
 *                 example: 1
 *               label:
 *                 type: string
 *                 example: "2026-2027"
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2026-09-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2027-06-30"
 *     responses:
 *       201:
 *         description: Année scolaire créée
 *       400:
 *         description: Champs manquants
 *       404:
 *         description: École introuvable
 */

/**
 * @swagger
 * /academic-years:
 *   get:
 *     summary: Liste des années scolaires
 *     description: SCHOOL_ADMIN ne voit que celles de sa propre école.
 *     tags: [Années scolaires]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: school_id
 *         schema:
 *           type: integer
 *         description: Filtre (utilisable uniquement par un SUPER_ADMIN)
 *     responses:
 *       200:
 *         description: Liste des années scolaires
 */

/**
 * @swagger
 * /academic-years/{id}:
 *   get:
 *     summary: Détail d'une année scolaire
 *     tags: [Années scolaires]
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
 *         description: Année scolaire trouvée
 *       403:
 *         description: Accès refusé (école différente)
 *       404:
 *         description: Année scolaire introuvable
 */

/**
 * @swagger
 * /academic-years/{id}:
 *   put:
 *     summary: Modifier une année scolaire
 *     tags: [Années scolaires]
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
 *               label:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Année scolaire modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Année scolaire introuvable
 */

/**
 * @swagger
 * /academic-years/{id}:
 *   delete:
 *     summary: Supprimer une année scolaire
 *     tags: [Années scolaires]
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
 *         description: Année scolaire supprimée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Année scolaire introuvable
 */

/**
 * @swagger
 * /academic-years/{id}/set-current:
 *   patch:
 *     summary: Définir cette année scolaire comme l'année courante de l'école
 *     description: Désactive automatiquement l'ancienne année courante de la même école (une seule année courante par école, garanti en base).
 *     tags: [Années scolaires]
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
 *         description: Année scolaire définie comme courante
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Année scolaire introuvable
 */
