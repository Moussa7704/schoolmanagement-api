/**
 * @swagger
 * tags:
 *   name: Utilisateurs
 *   description: Comptes de connexion "directs" sans fiche métier dédiée (SCHOOL_ADMIN, DIRECTOR, ACCOUNTANT, STAFF). Les enseignants passent par /teachers, les élèves/parents par grant-access.
 */

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Créer un utilisateur
 *     description: Rôles autorisés uniquement -- SCHOOL_ADMIN, DIRECTOR, ACCOUNTANT, STAFF. TEACHER doit passer par /teachers, STUDENT/PARENT par grant-access, SUPER_ADMIN n'est jamais créé via cette route.
 *     tags: [Utilisateurs]
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
 *               - email
 *               - password
 *               - role
 *             properties:
 *               school_id:
 *                 type: integer
 *                 description: Ignoré si l'appelant n'est pas SUPER_ADMIN (utilise alors son école)
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SCHOOL_ADMIN, DIRECTOR, ACCOUNTANT, STAFF]
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *       400:
 *         description: Champs manquants, rôle non géré par cette route ou email déjà utilisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: École ou rôle introuvable
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Liste des utilisateurs
 *     tags: [Utilisateurs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 */

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Détail d'un utilisateur
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur trouvé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Modifier un utilisateur (nom, téléphone, email)
 *     description: Refusé si ce compte est lié à une fiche enseignant/élève/tuteur -- passez alors par /teachers, /students ou /guardians.
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur modifié
 *       400:
 *         description: Compte lié à une fiche métier ou email déjà utilisé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur
 *     description: Refusé pour un compte SUPER_ADMIN ou lié à une fiche enseignant/élève/tuteur.
 *     tags: [Utilisateurs]
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
 *         description: Utilisateur supprimé
 *       400:
 *         description: Suppression refusée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */

/**
 * @swagger
 * /users/{id}/status:
 *   patch:
 *     summary: Changer le statut d'un utilisateur
 *     tags: [Utilisateurs]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, suspended, pending]
 *     responses:
 *       200:
 *         description: Statut modifié
 *       400:
 *         description: Statut invalide
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */

/**
 * @swagger
 * /users/{id}/change-password:
 *   put:
 *     summary: Réinitialiser le mot de passe d'un utilisateur (par un administrateur)
 *     tags: [Utilisateurs]
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
 *               - new_password
 *             properties:
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe modifié
 *       400:
 *         description: Mot de passe trop court
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Utilisateur introuvable
 */
