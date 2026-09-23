const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const classController = require("../controllers/class.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.CLASSES_CREATE),
    classController.createClass
)

router.get('/',
    authenticate,
    authorize(permissions.CLASSES_VIEW),
    classController.listClasses
)

router.get('/:id',
    authenticate,
    authorize(permissions.CLASSES_VIEW),
    classController.getClassById
)

router.put('/:id',
    authenticate,
    authorize(permissions.CLASSES_UPDATE),
    classController.updateClass
)

router.post('/:id/promote',
    authenticate,
    authorize(permissions.ENROLLMENTS_CREATE),
    classController.promoteClass
)

router.delete('/:id',
    authenticate,
    authorize(permissions.CLASSES_DELETE),
    classController.deleteClass
)

module.exports = router
