const express = require("express")
const router = express.Router()
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
