const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const subjectController = require("../controllers/subject.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.SUBJECTS_CREATE),
    subjectController.createSubject
)

router.get('/',
    authenticate,
    authorize(permissions.SUBJECTS_VIEW),
    subjectController.listSubjects
)

router.get('/:id',
    authenticate,
    authorize(permissions.SUBJECTS_VIEW),
    subjectController.getSubjectById
)

router.put('/:id',
    authenticate,
    authorize(permissions.SUBJECTS_UPDATE),
    subjectController.updateSubject
)

router.delete('/:id',
    authenticate,
    authorize(permissions.SUBJECTS_DELETE),
    subjectController.deleteSubject
)

module.exports = router
