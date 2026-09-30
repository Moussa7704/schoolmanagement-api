const express = require("express")
const router = express.Router()
const permissions = require("../constants/permissions")
const reportCardController = require("../controllers/reportcard.controller")
const { authenticate, authorize } = require("../middlewares/auth")

router.post('/',
    authenticate,
    authorize(permissions.REPORT_CARDS_CREATE),
    reportCardController.createReportCard
)

router.get('/',
    authenticate,
    authorize(permissions.REPORT_CARDS_VIEW),
    reportCardController.listReportCards
)

router.get('/ranking',
    authenticate,
    authorize(permissions.REPORT_CARDS_VIEW),
    reportCardController.getClassRanking
)

// Bulletins d'une classe pour une période, deux par feuille A4 (à découper).
// Déclarée avant '/:id' pour ne pas être capturée comme un identifiant.
router.get('/class-pdf',
    authenticate,
    authorize(permissions.REPORT_CARDS_VIEW),
    reportCardController.downloadClassReportCardsPdf
)

router.get('/:id',
    authenticate,
    authorize(permissions.REPORT_CARDS_VIEW),
    reportCardController.getReportCardById
)

// Bulletin imprimable (PDF A4), même accès que la consultation du bulletin.
router.get('/:id/pdf',
    authenticate,
    authorize(permissions.REPORT_CARDS_VIEW),
    reportCardController.downloadReportCardPdf
)

router.patch('/:id/validate',
    authenticate,
    authorize(permissions.REPORT_CARDS_VALIDATE),
    reportCardController.validateReportCard
)

router.delete('/:id',
    authenticate,
    authorize(permissions.REPORT_CARDS_DELETE),
    reportCardController.deleteReportCard
)

module.exports = router
