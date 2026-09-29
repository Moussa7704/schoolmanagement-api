 const PDFDocument = require("pdfkit");
const { AcademicYear, School, Enrollment, Student } = require("../models");
const classService = require("./class.service");
const { normalizeGender } = require("../utils/gender");
const { fitText, slug } = require("../utils/pdf");

// Élèves réellement assis dans la classe cette année : un redoublant est
// inscrit comme les autres, un transféré ou un retiré ne l'est plus.
const PRESENT_STATUSES = ['ACTIVE', 'REPEATING'];

// Largeurs en points pour un A4 paysage (842 pt) avec 36 pt de marge de
// chaque côté : leur somme fait exactement la largeur utile (770 pt).
const COLUMNS = [
    { header: "N°", key: "rank", width: 36, align: "right" },
    { header: "Matricule", key: "student_number", width: 100 },
    { header: "Nom", key: "last_name", width: 190 },
    { header: "Prénom", key: "first_name", width: 190 },
    { header: "Sexe", key: "gender", width: 60, align: "center" },
    { header: "Date de naissance", key: "date_of_birth", width: 94 },
    { header: "N° inscription", key: "registration_number", width: 100 }
];

const MARGIN = 36;
const ROW_HEIGHT = 18;
const CELL_PADDING = 4;
const FOOTER_SPACE = 24;
const COLORS = {
    ink: "#1f1f1f",
    muted: "#6b6b6b",
    headerFill: "#e8eef7",
    stripe: "#f5f5f3",
    rule: "#c3c2b7"
};

// "2026-09-15" -> "15/09/2026" (format de lecture habituel des écoles).
const formatDate = (value) => {
    if (!value) return "";
    const [y, m, d] = String(value).slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};

class ClassExportService {
    // Lignes du tableau : élèves présents de la classe, triés par nom.
    async _studentRows(classId) {
        const enrollments = await Enrollment.findAll({
            where: { class_id: classId, status: PRESENT_STATUSES }
        });
        const studentIds = enrollments.map((e) => e.student_id);

        const students = await Student.findAll({ where: { id: studentIds } });
        const studentById = new Map(students.map((s) => [s.id, s]));

        return enrollments
            .map((enrollment) => {
                const student = studentById.get(enrollment.student_id);
                return {
                    student_number: student?.student_number || "",
                    last_name: student?.last_name || "",
                    first_name: student?.first_name || "",
                    gender: normalizeGender(student?.gender) || "",
                    date_of_birth: formatDate(student?.date_of_birth),
                    registration_number: enrollment.registration_number || ""
                };
            })
            .sort((a, b) => a.last_name.localeCompare(b.last_name, "fr") || a.first_name.localeCompare(b.first_name, "fr"))
            .map((row, index) => ({ rank: index + 1, ...row }));
    }

    _drawRow(doc, y, values, { bold = false, fill = null } = {}) {
        const tableWidth = COLUMNS.reduce((sum, c) => sum + c.width, 0);
        if (fill) {
            doc.rect(MARGIN, y, tableWidth, ROW_HEIGHT).fill(fill);
        }
        doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5).fillColor(COLORS.ink);

        let x = MARGIN;
        COLUMNS.forEach((column, i) => {
            const width = column.width - CELL_PADDING * 2;
            doc.text(fitText(doc, String(values[i] ?? ""), width), x + CELL_PADDING, y + 5, {
                width,
                align: column.align || "left",
                lineBreak: false
            });
            x += column.width;
        });

        doc.moveTo(MARGIN, y + ROW_HEIGHT).lineTo(MARGIN + tableWidth, y + ROW_HEIGHT)
            .lineWidth(0.5).strokeColor(COLORS.rule).stroke();
    }

    async exportStudents(classId, currentUser) {
        // Même contrôle d'accès que GET /classes/:id (404 / 403 selon l'école).
        const classRecord = await classService._findWithAccess(classId, currentUser);
        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        const school = academicYear ? await School.findByPk(academicYear.school_id) : null;
        const rows = await this._studentRows(classRecord.id);

        const boys = rows.filter((r) => r.gender === "M").length;
        const girls = rows.filter((r) => r.gender === "F").length;

        const buffer = await new Promise((resolve, reject) => {
            // bufferPages : permet de revenir numéroter chaque page à la fin,
            // une fois le nombre total de pages connu.
            const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN, bufferPages: true });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const contentWidth = doc.page.width - MARGIN * 2;
            const bottomLimit = doc.page.height - MARGIN - FOOTER_SPACE;

            // En-tête du document (première page uniquement).
            doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.ink)
                .text(school?.name || "Établissement scolaire", MARGIN, MARGIN, { width: contentWidth, align: "center" });
            if (school?.address) {
                doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
                    .text(school.address, { width: contentWidth, align: "center" });
            }
            doc.moveDown(0.8);
            doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.ink)
                .text(`Liste des élèves — ${classRecord.name}${classRecord.level ? ` (${classRecord.level})` : ""}`,
                    { width: contentWidth, align: "center" });
            doc.moveDown(0.4);
            doc.font("Helvetica").fontSize(10).fillColor(COLORS.ink)
                .text(`Année scolaire : ${academicYear?.label || "-"}     ·     Effectif : ${rows.length} élève(s) — ${boys} garçon(s), ${girls} fille(s)`,
                    { width: contentWidth, align: "center" });

            const headerValues = COLUMNS.map((c) => c.header);
            let y = doc.y + 14;
            this._drawRow(doc, y, headerValues, { bold: true, fill: COLORS.headerFill });
            y += ROW_HEIGHT;

            if (rows.length === 0) {
                doc.font("Helvetica-Oblique").fontSize(10).fillColor(COLORS.muted)
                    .text("Aucun élève inscrit dans cette classe.", MARGIN, y + 10, { width: contentWidth, align: "center" });
            }

            rows.forEach((row, i) => {
                // Nouvelle page : on répète la ligne de titres des colonnes.
                if (y + ROW_HEIGHT > bottomLimit) {
                    doc.addPage();
                    y = MARGIN;
                    this._drawRow(doc, y, headerValues, { bold: true, fill: COLORS.headerFill });
                    y += ROW_HEIGHT;
                }
                this._drawRow(doc, y, COLUMNS.map((c) => row[c.key]), { fill: i % 2 === 1 ? COLORS.stripe : null });
                y += ROW_HEIGHT;
            });

            // Pied de page « Page X / Y » sur chaque page. La marge basse est
            // levée le temps d'écrire, sinon pdfkit ouvrirait une page vide.
            const range = doc.bufferedPageRange();
            for (let i = range.start; i < range.start + range.count; i++) {
                doc.switchToPage(i);
                const bottomMargin = doc.page.margins.bottom;
                doc.page.margins.bottom = 0;
                doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
                    .text(`${classRecord.name} — ${academicYear?.label || ""}`, MARGIN, doc.page.height - MARGIN, { width: contentWidth / 2, lineBreak: false })
                    .text(`Page ${i - range.start + 1} / ${range.count}`, MARGIN + contentWidth / 2, doc.page.height - MARGIN, { width: contentWidth / 2, align: "right", lineBreak: false });
                doc.page.margins.bottom = bottomMargin;
            }

            doc.end();
        });

        const filename = `eleves-${slug(classRecord.name) || classRecord.id}${academicYear ? `-${slug(academicYear.label)}` : ""}.pdf`;
        return { buffer, filename };
    }
}

module.exports = new ClassExportService();
