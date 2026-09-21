/**
 * @swagger
 * tags:
 *   name: Élèves
 *   description: Gestion des élèves (compte de connexion optionnel)
 */

/**
 * @swagger
 * /students:
 *   post:
 *     summary: Créer un élève (sans compte de connexion)
 *     tags: [Élèves]
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
 *               school_id:
 *                 type: integer
 *                 description: Requis uniquement pour un SUPER_ADMIN
 *               student_number:
 *                 type: string
 *                 example: ST-2026-001
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *     responses:
 *       201:
 *         description: Élève créé (user_id nul)
 *       400:
 *         description: Champs manquants
 *       404:
 *         description: École introuvable
 */

/**
 * @swagger
 * /students:
 *   get:
 *     summary: Liste des élèves
 *     description: Un SCHOOL_ADMIN ne voit que les élèves de sa propre école.
 *     tags: [Élèves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des élèves
 */

/**
 * @swagger
 * /students/{id}:
 *   get:
 *     summary: Détail d'un élève
 *     tags: [Élèves]
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
 *         description: Élève trouvé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève introuvable
 */

/**
 * @swagger
 * /students/{id}:
 *   put:
 *     summary: Modifier un élève
 *     tags: [Élèves]
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
 *         description: Élève modifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève introuvable
 */

/**
 * @swagger
 * /students/{id}:
 *   delete:
 *     summary: Supprimer un élève
 *     description: Supprime aussi le compte de connexion lié s'il existe.
 *     tags: [Élèves]
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
 *         description: Élève supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève introuvable
 */

/**
 * @swagger
 * /students/{id}/grant-access:
 *   post:
 *     summary: Créer un compte de connexion pour un élève qui n'en a pas encore
 *     description: N'affecte pas le dossier académique — ajoute uniquement un accès.
 *     tags: [Élèves]
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
 *         description: L'élève a déjà un compte, ou email déjà utilisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève introuvable
 */
