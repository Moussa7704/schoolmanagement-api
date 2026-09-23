const paymentService = require("../service/payment.service")
const { sendResponse } = require("../utils/message")

const createPayment = async (req, res) => {
    try {
        const payment = await paymentService.create(req.body, req.user);

        return sendResponse(res, {
            message: "Paiement enregistré avec succès",
            data: payment,
            status: 201
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const listPayments = async (req, res) => {
    try {
        const payments = await paymentService.list(req.user, req.query);

        return sendResponse(res, {
            message: "Liste des paiements récupérée avec succès",
            data: payments
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const getPaymentById = async (req, res) => {
    try {
        const payment = await paymentService.getById(req.params.id, req.user);

        return sendResponse(res, {
            message: "Paiement trouvé",
            data: payment
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 500
        });
    }
};

const downloadPaymentReceipt = async (req, res) => {
    try {
        const pdfBuffer = await paymentService.generateReceiptPdf(req.params.id, req.user);

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="recu-paiement-${req.params.id}.pdf"`,
            "Content-Length": pdfBuffer.length
        });
        return res.status(200).send(pdfBuffer);

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

const deletePayment = async (req, res) => {
    try {
        await paymentService.delete(req.params.id, req.user);

        return sendResponse(res, {
            message: "Paiement supprimé avec succès"
        });

    } catch (err) {
        return sendResponse(res, {
            success: false,
            message: err.message,
            status: err.status || 400
        });
    }
};

module.exports = {
    createPayment,
    listPayments,
    getPaymentById,
    downloadPaymentReceipt,
    deletePayment
}
