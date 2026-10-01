const express = require("express")
const router = express.Router()
const { validateIdParam } = require("../middlewares/validate")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const schoolController = require("../controllers/school.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.SCHOOLS_CREATE),
    schoolController.createSchool
)

router.get('/',
    authenticate,
    authorize(permissions.SCHOOLS_VIEW),
    schoolController.listSchools
)

router.get('/:id',
    authenticate,
    authorize(permissions.SCHOOLS_VIEW),
    schoolController.getSchoolById
)

// Réservé à SUPER_ADMIN uniquement (aucun nom de permission ne passe le
// bypass explicite de `authorize` pour ce rôle dans middlewares/auth.js) —
// SCHOOL_ADMIN ne doit pas pouvoir exporter les données d'une école.
router.get('/:id/export',
    authenticate,
    authorize(),
    schoolController.exportSchoolData
)

router.put('/:id',
    authenticate,
    authorize(permissions.SCHOOLS_UPDATE),
    schoolController.updateSchool
)

router.delete('/:id',
    authenticate,
    authorize(permissions.SCHOOLS_DELETE),
    schoolController.deleteSchool
)

module.exports = router
