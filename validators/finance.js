const { z, id, text, date, amount } = require("./common");

// Schémas des échéances (routes/tuitionfee.js) et des paiements (routes/payment.js).

const PAYMENT_METHODS = ["ESPECES", "MOBILE_MONEY", "VIREMENT", "CHEQUE"];

module.exports = {
    createTuitionFee: {
        body: z.object({
            student_id: id,
            academic_year_id: id,
            label: text(120),
            amount,
            due_date: date.optional().nullable()
        })
    },

    updateTuitionFee: {
        body: z.object({
            label: text(120).optional(),
            amount: amount.optional(),
            due_date: date.optional().nullable()
        })
    },

    createPayment: {
        body: z.object({
            tuition_fee_id: id,
            amount,
            payment_date: date,
            method: z.enum(PAYMENT_METHODS, {
                errorMap: () => ({ message: `doit valoir ${PAYMENT_METHODS.join(", ")}` })
            }).optional(),
            reference: z.string().trim().max(100, "est trop long").optional().nullable()
        })
    }
};
