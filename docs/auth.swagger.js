/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Gestion de l'authentification et de la sécurité
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion utilisateur (étape 1) - envoie un OTP par email
 *     tags: [Authentication]
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
 *                 example: moussa@email.com
 *               password:
 *                 type: string
 *                 example: Password123@
 *     responses:
 *       200:
 *         description: OTP envoyé à l'utilisateur
 *       400:
 *         description: Email ou mot de passe incorrect
 */

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Vérifier le code OTP (étape 2) - retourne l'access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - code
 *             properties:
 *               user_id:
 *                 type: integer
 *               code:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Connexion réussie, le refresh token est déposé dans un cookie httpOnly (refreshToken)
 *       400:
 *         description: OTP invalide ou expiré
 */

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Renvoyer un OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: OTP renvoyé avec succès
 */

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     summary: Générer un nouveau access token à partir du refresh token (cookie httpOnly)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Nouveau token généré, le cookie refreshToken est renouvelé
 *       401:
 *         description: Aucun refresh token fourni
 *       403:
 *         description: Refresh token invalide, expiré ou révoqué
 */

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Déconnexion utilisateur
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 */

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Récupérer l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Informations utilisateur
 *       401:
 *         description: Non authentifié
 */

/**
 * @swagger
 * /auth/me:
 *   put:
 *     summary: Mettre à jour le profil de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profil mis à jour avec succès
 *       400:
 *         description: Email déjà utilisé
 *       401:
 *         description: Non authentifié
 */

/**
 * @swagger
 * /auth/me/password:
 *   put:
 *     summary: Changer le mot de passe de l'utilisateur connecté
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - current_password
 *               - new_password
 *             properties:
 *               current_password:
 *                 type: string
 *               new_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe modifié avec succès
 *       400:
 *         description: Mot de passe actuel incorrect
 *       401:
 *         description: Non authentifié
 */

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Demande de réinitialisation du mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email de réinitialisation envoyé
 *       404:
 *         description: Aucun utilisateur trouvé avec cette adresse email
 */

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Réinitialiser le mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - confirm_password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *               confirm_password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Mot de passe réinitialisé
 *       400:
 *         description: Token invalide, expiré, ou mots de passe différents
 */
