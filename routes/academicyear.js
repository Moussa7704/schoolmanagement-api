const express = require("express")
const router = express.Router()
const { validateIdParam } = require("../middlewares/validate")

// Tout « :id » de ces adresses doit être un entier positif (sinon 400).
router.param('id', validateIdParam)
const permissions = require("../constants/permissions")
const academicYearController = require("../controllers/academicyear.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.ACADEMIC_YEARS_CREATE),
    academicYearController.createAcademicYear
)

router.get('/',
    authenticate,
    authorize(permissions.ACADEMIC_YEARS_VIEW),
    academicYearController.listAcademicYears
)

router.get('/:id',
    authenticate,
    authorize(permissions.ACADEMIC_YEARS_VIEW),
    academicYearController.getAcademicYearById
)

router.put('/:id',
    authenticate,
    authorize(permissions.ACADEMIC_YEARS_UPDATE),
    academicYearController.updateAcademicYear
)

router.delete('/:id',
    authenticate,
    authorize(permissions.ACADEMIC_YEARS_DELETE),
    academicYearController.deleteAcademicYear
)

router.patch('/:id/set-current',
    authenticate,
    authorize(permissions.ACADEMIC_YEARS_UPDATE),
    academicYearController.setCurrent
)

module.exports = router
