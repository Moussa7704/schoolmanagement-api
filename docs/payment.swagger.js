/**
 * @swagger
 * tags:
 *   name: Paiements
 *   description: Paiements enregistrés contre une échéance de scolarité (partiels ou totaux)
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Enregistrer un paiement
 *     description: Le montant est plafonné au solde restant dû de l'échéance — un dépassement est refusé.
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tuition_fee_id
 *               - amount
 *               - payment_date
 *             properties:
 *               tuition_fee_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_date:
 *                 type: string
 *                 format: date
 *               method:
 *                 type: string
 *                 enum: [ESPECES, MOBILE_MONEY, VIREMENT, CHEQUE]
 *                 default: ESPECES
 *               reference:
 *                 type: string
 *     responses:
 *       201:
 *         description: Paiement enregistré
 *       400:
 *         description: Champs manquants ou montant supérieur au solde restant dû
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Échéance introuvable
 */

/**
 * @swagger
 * /payments:
 *   get:
 *     summary: Liste des paiements
 *     tags: [Paiements]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: tuition_fee_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Liste des paiements
 */

/**
 * @swagger
 * /payments/{id}:
 *   get:
 *     summary: Détail d'un paiement
 *     tags: [Paiements]
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
 *         description: Paiement trouvé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Paiement introuvable
 */

/**
 * @swagger
 * /payments/{id}/receipt:
 *   get:
 *     summary: Télécharger le reçu de paiement au format PDF
 *     tags: [Paiements]
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
 *         description: Fichier PDF du reçu
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Paiement introuvable
 */

/**
 * @swagger
 * /payments/{id}:
 *   delete:
 *     summary: Supprimer un paiement (correction)
 *     tags: [Paiements]
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
 *         description: Paiement supprimé
 *       403:
 *         description: Accès refusé
 *       404:
 *         description: Paiement introuvable
 */
