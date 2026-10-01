const PDFDocument = require("pdfkit");
const { TuitionFee, Student, Payment, School, AcademicYear } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");
const { isParent, getChildStudentIds, assertParentCanAccessStudent } = require("../utils/parentAccess");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class TuitionFeeService extends BaseService {
    constructor() {
        super(TuitionFee);
    }

    async _assertStudentAccess(studentId, currentUser) {
        const student = await Student.findByPk(studentId);
        if (!student) {
            throw new HttpError("Élève introuvable", 404);
        }
        if (!isSuperAdmin(currentUser) && student.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }
        return student;
    }

    async _findWithAccess(id, currentUser) {
        const tuitionFee = await this.model.findByPk(id);
        if (!tuitionFee) {
            throw new HttpError("Échéance introuvable", 404);
        }
        await this._assertStudentAccess(tuitionFee.student_id, currentUser);
        return tuitionFee;
    }

    _enrich(tuitionFee, payments) {
        const paid_amount = payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = Number((tuitionFee.amount - paid_amount).toFixed(2));

        let status;
        if (balance <= 0) {
            status = 'PAID';
        } else if (tuitionFee.due_date && new Date(tuitionFee.due_date) < new Date()) {
            status = 'OVERDUE';
        } else if (paid_amount > 0) {
            status = 'PARTIAL';
        } else {
            status = 'PENDING';
        }

        return {
            ...tuitionFee.toJSON(),
            paid_amount: Number(paid_amount.toFixed(2)),
            balance,
            status
        };
    }

    async create(data, currentUser) {
        const { student_id, academic_year_id, label, amount, due_date } = data;

        if (!student_id || !academic_year_id || !label || !amount) {
            throw new HttpError("student_id, academic_year_id, label et amount sont requis.", 400);
        }

        await this._assertStudentAccess(student_id, currentUser);

        return super.create({ student_id, academic_year_id, label, amount, due_date });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.student_id) {
            where.student_id = query.student_id;
            if (isParent(currentUser)) {
                await assertParentCanAccessStudent(query.student_id, currentUser);
            } else {
                await this._assertStudentAccess(query.student_id, currentUser);
            }
        } else if (isParent(currentUser)) {
            where.student_id = await getChildStudentIds(currentUser);
        } else if (!isSuperAdmin(currentUser)) {
            const students = await Student.findAll({
                where: { school_id: currentUser.school_id },
                attributes: ["id"]
            });
            where.student_id = students.map((s) => s.id);
        }

        // Filtre par année scolaire : toujours EN PLUS du cloisonnement ci-dessus,
        // jamais à sa place (sinon une autre école lisait les échéances de l'année
        // d'une autre école). Une année d'une autre école est refusée explicitement.
        if (query.academic_year_id) {
            if (!isSuperAdmin(currentUser) && !isParent(currentUser)) {
                const academicYear = await AcademicYear.findByPk(query.academic_year_id);
                if (!academicYear || academicYear.school_id !== currentUser.school_id) {
                    throw new HttpError("Accès refusé", 403);
                }
            }
            where.academic_year_id = query.academic_year_id;
        }

        const tuitionFees = await this.model.findAll({
            where,
            include: [{ model: Payment, as: "Payments" }],
            order: [["due_date", "ASC"]]
        });

        return tuitionFees.map((tf) => this._enrich(tf, tf.Payments));
    }

    async _findReadable(id, currentUser) {
        if (isParent(currentUser)) {
            const tuitionFee = await this.model.findByPk(id);
            if (!tuitionFee) {
                throw new HttpError("Échéance introuvable", 404);
            }
            await assertParentCanAccessStudent(tuitionFee.student_id, currentUser);
            return tuitionFee;
        }
        return this._findWithAccess(id, currentUser);
    }

    async getById(id, currentUser) {
        const tuitionFee = await this._findReadable(id, currentUser);
        const payments = await Payment.findAll({ where: { tuition_fee_id: tuitionFee.id } });
        return this._enrich(tuitionFee, payments);
    }

    async update(id, data, currentUser) {
        const tuitionFee = await this._findWithAccess(id, currentUser);

        const { label, amount, due_date } = data;

        await tuitionFee.update({
            label: label ?? tuitionFee.label,
            amount: amount ?? tuitionFee.amount,
            due_date: due_date ?? tuitionFee.due_date
        });

        return tuitionFee;
    }

    async delete(id, currentUser) {
        const tuitionFee = await this._findWithAccess(id, currentUser);

        // La contrainte DB bloque déjà la suppression (ON DELETE RESTRICT) pour
        // ne pas effacer silencieusement l'historique des paiements déjà reçus ;
        // ce contrôle applicatif renvoie juste un message clair.
        const paymentCount = await Payment.count({ where: { tuition_fee_id: tuitionFee.id } });
        if (paymentCount > 0) {
            throw new HttpError(
                "Impossible de supprimer cette échéance : des paiements ont déjà été enregistrés dessus. Supprimez d'abord ces paiements.",
                400
            );
        }

        await tuitionFee.destroy();
    }

    // Numéro de facture dérivé de l'id de l'échéance — même principe que le
    // numéro de reçu côté Payment : unique et séquentiel sans colonne dédiée.
    _invoiceNumber(tuitionFeeId) {
        return `FACT-${String(tuitionFeeId).padStart(6, "0")}`;
    }

    async generateInvoicePdf(id, currentUser) {
        const tuitionFee = await this._findReadable(id, currentUser);

        const [student, academicYear, payments] = await Promise.all([
            Student.findByPk(tuitionFee.student_id, { include: [{ model: School, as: "School" }] }),
            AcademicYear.findByPk(tuitionFee.academic_year_id),
            Payment.findAll({ where: { tuition_fee_id: tuitionFee.id } })
        ]);
        const school = student.School;
        const enriched = this._enrich(tuitionFee, payments);

        const STATUS_LABELS = {
            PAID: "Payée",
            OVERDUE: "En retard",
            PARTIAL: "Partiellement payée",
            PENDING: "En attente"
        };

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

            doc.fontSize(14).text("FACTURE", { align: "center", underline: true });
            doc.moveDown(1.5);

            doc.fontSize(11);
            doc.text(`Facture N° : ${this._invoiceNumber(tuitionFee.id)}`);
            doc.text(`Année scolaire : ${academicYear?.label || "-"}`);
            if (tuitionFee.due_date) {
                doc.text(`Échéance le : ${tuitionFee.due_date}`);
            }
            doc.moveDown();

            doc.text(`Élève : ${student.first_name} ${student.last_name}`);
            doc.text(`Matricule : ${student.student_number || "-"}`);
            doc.moveDown();

            doc.text(`Motif : ${tuitionFee.label}`);
            doc.text(`Montant dû : ${tuitionFee.amount.toFixed(2)}`);
            doc.text(`Montant déjà payé : ${enriched.paid_amount.toFixed(2)}`);
            doc.font("Helvetica-Bold");
            doc.text(`Solde restant dû : ${enriched.balance.toFixed(2)}`);
            doc.text(`Statut : ${STATUS_LABELS[enriched.status]}`);
            doc.font("Helvetica");
            doc.moveDown(3);

            doc.text("Cachet et signature : ______________________", { align: "right" });

            doc.end();
        });
    }
}

module.exports = new TuitionFeeService();
