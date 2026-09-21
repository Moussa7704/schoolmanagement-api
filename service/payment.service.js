const { Payment, Student } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const tuitionFeeService = require("./tuitionfee.service");
const roles = require("../constants/roles");

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
            await tuitionFeeService._findWithAccess(query.tuition_fee_id, currentUser);
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

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async delete(id, currentUser) {
        const payment = await this._findWithAccess(id, currentUser);
        await payment.destroy();
    }
}

module.exports = new PaymentService();
