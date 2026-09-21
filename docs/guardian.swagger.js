/**
 * @swagger
 * tags:
 *   name: Tuteurs
 *   description: Gestion des tuteurs/responsables (compte de connexion optionnel, non rattachés à une école)
 */

/**
 * @swagger
 * /guardians:
 *   post:
 *     summary: Créer un tuteur/responsable
 *     tags: [Tuteurs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tuteur/responsable créé
 *       400:
 *         description: Champs manquants
 */

/**
 * @swagger
 * /guardians:
 *   get:
 *     summary: Liste des tuteurs/responsables
 *     tags: [Tuteurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des tuteurs/responsables
 */

/**
 * @swagger
 * /guardians/{id}:
 *   get:
 *     summary: Détail d'un tuteur/responsable
 *     tags: [Tuteurs]
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
 *         description: Tuteur/responsable trouvé
 *       404:
 *         description: Tuteur/responsable introuvable
 */

/**
 * @swagger
 * /guardians/{id}:
 *   put:
 *     summary: Modifier un tuteur/responsable
 *     tags: [Tuteurs]
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
 *         description: Tuteur/responsable modifié
 *       404:
 *         description: Tuteur/responsable introuvable
 */

/**
 * @swagger
 * /guardians/{id}:
 *   delete:
 *     summary: Supprimer un tuteur/responsable
 *     description: Supprime aussi le compte de connexion lié s'il existe.
 *     tags: [Tuteurs]
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
 *         description: Tuteur/responsable supprimé
 *       404:
 *         description: Tuteur/responsable introuvable
 */

/**
 * @swagger
 * /guardians/{id}/grant-access:
 *   post:
 *     summary: Créer un compte de connexion pour un tuteur/responsable qui n'en a pas encore
 *     tags: [Tuteurs]
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
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Compte créé et lié
 *       400:
 *         description: Le tuteur a déjà un compte, ou email déjà utilisé
 *       404:
 *         description: Tuteur/responsable introuvable
 */
