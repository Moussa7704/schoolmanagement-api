const PDFDocument = require("pdfkit");
const { Payment, Student, TuitionFee, School } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const tuitionFeeService = require("./tuitionfee.service");
const roles = require("../constants/roles");
const { isParent, getChildStudentIds, assertParentCanAccessStudent } = require("../utils/parentAccess");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class PaymentService extends BaseService {
    constructor() {
        super(Payment);
    }

    async _currentBalance(tuitionFee) {
        const payments = await this.model.findAll({ where: { tuition_fee_id: tuitionFee.id } });
        const paid_amount = payments.reduce((sum, p) => sum + p.amount, 0);
        return Number((tuitionFee.amount - paid_amount).toFixed(2));
    }

    async create(data, currentUser) {
        const { tuition_fee_id, amount, payment_date, method, reference } = data;

        if (!tuition_fee_id || !amount || !payment_date) {
            throw new HttpError("tuition_fee_id, amount et payment_date sont requis.", 400);
        }

        const tuitionFee = await tuitionFeeService._findWithAccess(tuition_fee_id, currentUser);

        const balance = await this._currentBalance(tuitionFee);
        if (amount > balance) {
            throw new HttpError(`Le paiement dépasse le solde restant dû (${balance}).`, 400);
        }

        return super.create({
            tuition_fee_id,
            amount,
            payment_date,
            method: method ?? 'ESPECES',
            reference
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.tuition_fee_id) {
            where.tuition_fee_id = query.tuition_fee_id;
            await tuitionFeeService._findReadable(query.tuition_fee_id, currentUser);
        } else if (query.student_id) {
            if (isParent(currentUser)) {
                await assertParentCanAccessStudent(query.student_id, currentUser);
            } else {
                await tuitionFeeService._assertStudentAccess(query.student_id, currentUser);
            }
            const tuitionFees = await tuitionFeeService.model.findAll({
                where: { student_id: query.student_id },
                attributes: ["id"]
            });
            where.tuition_fee_id = tuitionFees.map((tf) => tf.id);
        } else if (isParent(currentUser)) {
            const childIds = await getChildStudentIds(currentUser);
            const tuitionFees = await tuitionFeeService.model.findAll({
                where: { student_id: childIds },
                attributes: ["id"]
            });
            where.tuition_fee_id = tuitionFees.map((tf) => tf.id);
        } else if (!isSuperAdmin(currentUser)) {
            const students = await Student.findAll({
                where: { school_id: currentUser.school_id },
                attributes: ["id"]
            });
            const tuitionFees = await tuitionFeeService.model.findAll({
                where: { student_id: students.map((s) => s.id) },
                attributes: ["id"]
            });
            where.tuition_fee_id = tuitionFees.map((tf) => tf.id);
        }

        return this.model.findAll({
            where,
            order: [["payment_date", "DESC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const payment = await this.model.findByPk(id);
        if (!payment) {
            throw new HttpError("Paiement introuvable", 404);
        }
        await tuitionFeeService._findWithAccess(payment.tuition_fee_id, currentUser);
        return payment;
    }

    async _findReadable(id, currentUser) {
        const payment = await this.model.findByPk(id);
        if (!payment) {
            throw new HttpError("Paiement introuvable", 404);
        }
        await tuitionFeeService._findReadable(payment.tuition_fee_id, currentUser);
        return payment;
    }

    async getById(id, currentUser) {
        return this._findReadable(id, currentUser);
    }

    async delete(id, currentUser) {
        const payment = await this._findWithAccess(id, currentUser);
        await payment.destroy();
    }

    // Numéro de reçu dérivé de l'id du paiement : unique, séquentiel et déjà
    // garanti par la base — pas besoin d'une colonne/compteur séparé qui
    // pourrait se désynchroniser ou entrer en conflit sous charge concurrente.
    _receiptNumber(paymentId) {
        return `REC-${String(paymentId).padStart(6, "0")}`;
    }

    async generateReceiptPdf(id, currentUser) {
        const payment = await this._findReadable(id, currentUser);

        const tuitionFee = await TuitionFee.findByPk(payment.tuition_fee_id, {
            include: [{ model: Student, as: "Student", include: [{ model: School, as: "School" }] }]
        });
        const student = tuitionFee.Student;
        const school = student.School;
        const balance = await this._currentBalance(tuitionFee);

        return new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", margin: 50 });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            doc.fontSize(16).text(school?.name || "Établissement scolaire", { align: "center" });
            if (school?.address) {
                doc.fontSize(10).text(school.address, { align: "center" });
            }
            doc.moveDown(2);

            doc.fontSize(14).text("REÇU DE PAIEMENT", { align: "center", underline: true });
            doc.moveDown(1.5);

            doc.fontSize(11);
            doc.text(`Reçu N° : ${this._receiptNumber(payment.id)}`);
            doc.text(`Date de paiement : ${payment.payment_date}`);
            doc.moveDown();

            doc.text(`Élève : ${student.first_name} ${student.last_name}`);
            doc.text(`Matricule : ${student.student_number || "-"}`);
            doc.moveDown();

            doc.text(`Motif : ${tuitionFee.label}`);
            doc.text(`Montant payé : ${payment.amount.toFixed(2)}`);
            doc.text(`Mode de paiement : ${payment.method}`);
            if (payment.reference) {
                doc.text(`Référence : ${payment.reference}`);
            }
            doc.moveDown();

            doc.text(`Montant total de l'échéance : ${tuitionFee.amount.toFixed(2)}`);
            doc.text(`Solde restant dû : ${balance.toFixed(2)}`);
            doc.moveDown(3);

            doc.text("Signature : ______________________", { align: "right" });

            doc.end();
        });
    }
}

module.exports = new PaymentService();
