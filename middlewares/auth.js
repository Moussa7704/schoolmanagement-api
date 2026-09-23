const { verifyAccessToken } = require("../utils/jwt")
const { User, Role, Permission, Teacher, Guardian } = require("../models")
const roles = require("../constants/roles")

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                message: "Token manquant ou invalide"
            })
        }

        const token = authHeader.split(' ')[1]
        const decoded = verifyAccessToken(token)

        const user = await User.findByPk(decoded.id, {
            include: [{
                model: Role,
                as: 'Role',
                include: [{
                    model: Permission,
                    as: 'Permissions'
                }]
            }, {
                model: Teacher,
                as: 'Teacher',
                required: false
            }, {
                model: Guardian,
                as: 'Guardian',
                required: false
            }],
            attributes: {
                exclude: ['password']
            }
        })
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                message: "Utilisateur introuvable ou inactif"
            })
        }
        req.user = user;
        next()
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: "Token expiré"
            })
        } else {
            return res.status(401).json({
                message: "Token invalid"
            })
        }
    }
}

const authorize = (...permissionNames) => {
    return (req, res, next) => {

        if (req.user?.Role?.name === roles.SUPER_ADMIN) {
            return next()
        }

        const userPermissions = req.user?.Role?.Permissions?.map(p => p.name) || [];
        const hasPermission = permissionNames.some(p => userPermissions.includes(p));

        if (!hasPermission) {
            return res.status(403).json({
                message: "Accès refusé"
            })
        }

        next()
    }
}

module.exports = {
    authenticate,
    authorize
}
