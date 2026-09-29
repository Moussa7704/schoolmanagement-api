/**
 * @swagger
 * tags:
 *   name: Enseignants
 *   description: Gestion des enseignants (compte + profil métier)
 */

/**
 * @swagger
 * /teachers:
 *   post:
 *     summary: Créer un enseignant (crée le compte de connexion et le profil ensemble)
 *     tags: [Enseignants]
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
 *             properties:
 *               school_id:
 *                 type: integer
 *                 description: Requis uniquement pour un SUPER_ADMIN
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
 *               specialty:
 *                 type: string
 *                 example: Mathématiques
 *               hire_date:
 *                 type: string
 *                 format: date
 *               employee_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [M, F]
 *                 description: Civilité dans l'emploi du temps (Mr / Mme). Facultatif.
 *     responses:
 *       201:
 *         description: Enseignant créé (User + Teacher)
 *       400:
 *         description: Champs manquants ou email déjà utilisé
 *       404:
 *         description: École introuvable
 */

/**
 * @swagger
 * /teachers:
 *   get:
 *     summary: Liste des enseignants
 *     description: Un SCHOOL_ADMIN ne voit que les enseignants de sa propre école.
 *     tags: [Enseignants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des enseignants
 */

/**
 * @swagger
 * /teachers/{id}:
 *   get:
 *     summary: Détail d'un enseignant
 *     tags: [Enseignants]
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
 *         description: Enseignant trouvé
 *       403:
 *         description: Accès refusé (école différente)
 *       404:
 *         description: Enseignant introuvable
 */

/**
 * @swagger
 * /teachers/{id}:
 *   put:
 *     summary: Modifier un enseignant (specialty, hire_date, employee_number, gender)
 *     tags: [Enseignants]
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
 *               specialty:
 *                 type: string
 *               hire_date:
 *                 type: string
 *                 format: date
 *               employee_number:
 *                 type: string
 *               gender:
 *                 type: string
 *                 enum: [M, F]
 *                 nullable: true
 *                 description: Absent = inchangé ; null ou "" = effacé.
 *     responses:
 *       200:
 *         description: Enseignant modifié
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Enseignant introuvable
 */

/**
 * @swagger
 * /teachers/{id}:
 *   delete:
 *     summary: Supprimer un enseignant
 *     description: Supprime aussi le compte de connexion lié (créé uniquement pour ce profil).
 *     tags: [Enseignants]
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
 *         description: Enseignant supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Enseignant introuvable
 */
