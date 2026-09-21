/**
 * @swagger
 * /roles:
 *   get:
 *     summary: Récupérer la liste des rôles disponibles selon le niveau d'accès de l'utilisateur
 *     tags: [Roles]
 *     security:
 *       - bearerAuth: []
 *     description: |
 *       Retourne les rôles accessibles en fonction du rôle de l'utilisateur connecté :
 *
 *       - SUPER_ADMIN → tous les rôles
 *       - COMPAGNY_ADMIN → AGENCY_ADMIN, AGENT, CONTROLLER, DRIVER
 *       - AGENCY_ADMIN → AGENT, CONTROLLER, DRIVER
 *
 *     responses:
 *       200:
 *         description: Liste des rôles récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Liste des rôles récupérés avec succès
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: DRIVER
 *                       createdAt:
 *                         type: string
 *                         example: 2026-01-01T10:00:00.000Z
 *                       updatedAt:
 *                         type: string
 *                         example: 2026-01-01T10:00:00.000Z
 *
 *       403:
 *         description: Accès refusé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Accès refusé
 *
 *       500:
 *         description: Erreur serveur
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Internal server error
 */
