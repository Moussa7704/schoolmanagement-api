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
