/**
 * @swagger
 * tags:
 *   name: Scolarité
 *   description: Échéances de frais scolaires par élève
 */

/**
 * @swagger
 * /tuition-fees:
 *   post:
 *     summary: Créer une échéance de scolarité
 *     tags: [Scolarité]
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
 *               - academic_year_id
 *               - label
 *               - amount
 *             properties:
 *               student_id:
 *                 type: integer
 *               academic_year_id:
 *                 type: integer
 *               label:
 *                 type: string
 *                 example: Échéance 1
 *               amount:
 *                 type: number
 *                 example: 100000
 *               due_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Échéance créée
 *       400:
 *         description: Champs manquants
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Élève introuvable
 */

/**
 * @swagger
 * /tuition-fees:
 *   get:
 *     summary: Liste des échéances (avec solde et statut calculés)
 *     tags: [Scolarité]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: student_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: academic_year_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des échéances, chacune enrichie de paid_amount, balance et status (PENDING/PARTIAL/PAID/OVERDUE)
 */

/**
 * @swagger
 * /tuition-fees/{id}:
 *   get:
 *     summary: Détail d'une échéance (solde et statut calculés à la volée)
 *     tags: [Scolarité]
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
 *         description: Échéance trouvée, avec paid_amount, balance et status
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Échéance introuvable
 */

/**
 * @swagger
 * /tuition-fees/{id}:
 *   put:
 *     summary: Modifier une échéance
 *     tags: [Scolarité]
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
 *         description: Échéance modifiée
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Échéance introuvable
 */

/**
 * @swagger
 * /tuition-fees/{id}/invoice:
 *   get:
 *     summary: Télécharger la facture au format PDF
 *     tags: [Scolarité]
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
 *         description: Fichier PDF de la facture
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Échéance introuvable
 */

/**
 * @swagger
 * /tuition-fees/{id}:
 *   delete:
 *     summary: Supprimer une échéance
 *     description: Rejeté si des paiements existent déjà sur cette échéance (ils doivent être supprimés d'abord).
 *     tags: [Scolarité]
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
 *         description: Échéance supprimée
 *       400:
 *         description: Des paiements existent déjà sur cette échéance
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Échéance introuvable
 */
