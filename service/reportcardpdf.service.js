const PDFDocument = require("pdfkit");
const { Student, Class, Period, AcademicYear, School, Enrollment } = require("../models");
const reportCardService = require("./reportcard.service");
const { WORK_APPRECIATIONS, DISTINCTIONS } = require("../constants/grading");
const { fitText, slug } = require("../utils/pdf");

// Un bulletin est dessiné sur une zone de BULLETIN_WIDTH points de large
// (largeur utile d'un A4 portrait : 595 − 2 × 36), à partir de son coin
// haut-gauche. Pour deux bulletins par feuille, la même zone est réduite
// (transformation de l'échelle) et posée sur chaque moitié d'un A4 paysage.
const MARGIN = 36;
const BULLETIN_WIDTH = 523;
const ROW_HEIGHT = 18;
const PADDING = 4;
const COLORS = {
    ink: "#1f1f1f",
    muted: "#6b6b6b",
    headerFill: "#e8eef7",
    totalFill: "#f5f5f3",
    rule: "#8a8a85"
};

// Deux bulletins par feuille : A4 paysage coupé en deux A5 portrait.
const HALF_MARGIN = 18;

// Tableau des matières : mêmes colonnes que le bulletin papier.
const COLUMNS = [
    { header: "Matières", key: "subject_name", width: 150, align: "left" },
    { header: "Devoir", key: "devoir_average", width: 50, number: true },
    { header: "Comp", key: "composition_average", width: 50, number: true },
    { header: "Moy/20", key: "average", width: 55, number: true },
    { header: "Coeff", key: "coefficient", width: 45, number: true, integerLike: true },
    { header: "Moy Gen", key: "weighted_average", width: 60, number: true },
    { header: "Appréciations", key: "appreciation", width: 113, align: "left" }
];

// 12.5 -> "12,50" ; 4 -> "4" pour les coefficients entiers ; null -> ""
const formatNumber = (value, integerLike = false) => {
    if (value === null || value === undefined) return "";
    if (integerLike && Number.isInteger(value)) return String(value);
    return value.toFixed(2).replace(".", ",");
};

const formatDate = (value) => {
    if (!value) return "";
    const [y, m, d] = String(value).slice(0, 10).split("-");
    return `${d}/${m}/${y}`;
};

const genderLabel = (value) => {
    const v = String(value || "").trim().toUpperCase();
    if (["M", "H", "MASCULIN", "HOMME", "GARCON", "GARÇON"].includes(v)) return "Masculin";
    if (["F", "FEMININ", "FÉMININ", "FEMME", "FILLE"].includes(v)) return "Féminin";
    return value || "";
};

// Cadre + texte d'une cellule, texte tronqué avec « … » s'il déborde.
function cell(doc, x, y, width, height, text, { bold = false, align = "center", fill = null, size = 9 } = {}) {
    if (fill) doc.rect(x, y, width, height).fill(fill);
    doc.lineWidth(0.5).strokeColor(COLORS.rule).rect(x, y, width, height).stroke();
    if (text === "" || text === null || text === undefined) return;
    doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(size).fillColor(COLORS.ink);
    const inner = width - PADDING * 2;
    doc.text(fitText(doc, String(text), inner), x + PADDING, y + (height - size) / 2 + 1, { width: inner, align, lineBreak: false });
}

// Texte centré sur une ligne, sans retour à la ligne (hauteur maîtrisée).
function centered(doc, text, y, { font = "Helvetica", size = 10, color = COLORS.ink } = {}) {
    doc.font(font).fontSize(size).fillColor(color);
    doc.text(fitText(doc, text, BULLETIN_WIDTH), 0, y, { width: BULLETIN_WIDTH, align: "center", lineBreak: false });
    return y + size + 4;
}

// Liste d'options avec une case cochée (X) sur celle retenue.
function checklist(doc, x, y, width, labels, selected) {
    const boxWidth = 40;
    labels.forEach((label, i) => {
        const rowY = y + i * ROW_HEIGHT;
        cell(doc, x, rowY, width - boxWidth, ROW_HEIGHT, label, { align: "left", size: 9 });
        cell(doc, x + width - boxWidth, rowY, boxWidth, ROW_HEIGHT, label === selected ? "X" : "", { bold: true, size: 10 });
    });
    return y + labels.length * ROW_HEIGHT;
}

// Dessine un bulletin complet dans le repère courant, coin haut-gauche en
// (0, 0), sur BULLETIN_WIDTH de large. Renvoie la hauteur utilisée.
function drawBulletin(doc, { data, student, classRecord, period, academicYear, school, enrollment }) {
    // En-tête officiel : ministère, académie et école à gauche ; République,
    // devise et téléphone de l'école à droite. Les lignes absentes (académie
    // ou téléphone non renseignés) sont simplement omises.
    const columnWidth = 230;
    const leftLines = [
        { text: "MINISTÈRE DE L'ÉDUCATION NATIONALE", font: "Helvetica-Bold", size: 9 },
        school?.academy && { text: school.academy, font: "Helvetica", size: 9 },
        { text: school?.name || "Établissement scolaire", font: "Helvetica-Bold", size: 10 }
    ].filter(Boolean);
    const rightLines = [
        { text: "RÉPUBLIQUE DU MALI", font: "Helvetica-Bold", size: 9 },
        { text: "Un Peuple – Un But – Une Foi", font: "Helvetica-Oblique", size: 8.5 },
        school?.phone && { text: `Tél : ${school.phone}`, font: "Helvetica", size: 9 }
    ].filter(Boolean);
    const headerBlock = (lines, x) => {
        let lineY = 0;
        lines.forEach((line, i) => {
            if (i > 0) {
                // Petit trait de séparation entre les lignes, comme sur les en-têtes officiels.
                doc.lineWidth(0.5).strokeColor(COLORS.muted)
                    .moveTo(x + columnWidth / 2 - 15, lineY + 1).lineTo(x + columnWidth / 2 + 15, lineY + 1).stroke();
                lineY += 5;
            }
            doc.font(line.font).fontSize(line.size).fillColor(COLORS.ink);
            doc.text(fitText(doc, line.text, columnWidth), x, lineY, { width: columnWidth, align: "center", lineBreak: false });
            lineY += line.size + 4;
        });
        return lineY;
    };
    let y = Math.max(headerBlock(leftLines, 0), headerBlock(rightLines, BULLETIN_WIDTH - columnWidth));

    y += 10;
    y = centered(doc, `BULLETIN DE NOTES — ${period?.label || ""}`.trim(), y, { font: "Helvetica-Bold", size: 13 });
    y = centered(doc, `Année scolaire : ${academicYear?.label || "-"}`, y, { size: 10 });

    // Identité de l'élève.
    y += 8;
    const half = BULLETIN_WIDTH / 2;
    const info = [
        [["Nom et prénom", `${student?.last_name || ""} ${student?.first_name || ""}`.trim()], ["Classe", classRecord?.name || ""]],
        [["Matricule", student?.student_number || ""], ["Effectif", data.total_students ? String(data.total_students) : ""]],
        [["Sexe", genderLabel(student?.gender)], ["Date de naissance", formatDate(student?.date_of_birth)]],
        [["N° d'inscription", enrollment?.registration_number || ""], ["Statut", data.status === "VALIDATED" ? "Validé" : "Brouillon"]]
    ];
    for (const row of info) {
        row.forEach(([label, value], i) => {
            const x = i * half;
            cell(doc, x, y, 105, ROW_HEIGHT, label, { bold: true, align: "left", fill: COLORS.totalFill });
            cell(doc, x + 105, y, half - 105, ROW_HEIGHT, value, { align: "left" });
        });
        y += ROW_HEIGHT;
    }

    // Tableau des matières.
    y += 12;
    let x = 0;
    for (const column of COLUMNS) {
        cell(doc, x, y, column.width, ROW_HEIGHT, column.header, { bold: true, fill: COLORS.headerFill });
        x += column.width;
    }
    y += ROW_HEIGHT;

    for (const subject of data.subjects) {
        x = 0;
        for (const column of COLUMNS) {
            const raw = subject[column.key];
            const text = column.number ? formatNumber(raw, column.integerLike) : (raw || "");
            cell(doc, x, y, column.width, ROW_HEIGHT, text, { align: column.align || "center", bold: column.key === "subject_name" });
            x += column.width;
        }
        y += ROW_HEIGHT;
    }
    if (data.subjects.length === 0) {
        cell(doc, 0, y, BULLETIN_WIDTH, ROW_HEIGHT, "Aucune matière affectée à cette classe.");
        y += ROW_HEIGHT;
    }

    // TOTAL : total des coefficients et des Moy Gen (matières notées).
    const offsetOf = (key) => COLUMNS.slice(0, COLUMNS.findIndex((c) => c.key === key)).reduce((s, c) => s + c.width, 0);
    const coeffCol = COLUMNS.find((c) => c.key === "coefficient");
    const genCol = COLUMNS.find((c) => c.key === "weighted_average");
    cell(doc, 0, y, offsetOf("coefficient"), ROW_HEIGHT, "TOTAL", { bold: true, align: "left", fill: COLORS.totalFill });
    cell(doc, offsetOf("coefficient"), y, coeffCol.width, ROW_HEIGHT, formatNumber(data.total_coefficient, true), { bold: true, fill: COLORS.totalFill });
    cell(doc, offsetOf("weighted_average"), y, genCol.width, ROW_HEIGHT, formatNumber(data.total_weighted), { bold: true, fill: COLORS.totalFill });
    const restX = offsetOf("weighted_average") + genCol.width;
    cell(doc, restX, y, BULLETIN_WIDTH - restX, ROW_HEIGHT, "", { fill: COLORS.totalFill });
    y += ROW_HEIGHT;

    // Moyenne /20 | Rang | Retards | Absences
    const summary = [
        { text: "Moyenne", width: 70, bold: true, align: "left" },
        { text: data.overall_average === null ? "" : `${formatNumber(data.overall_average)} /20`, width: 110, bold: true, size: 11 },
        { text: "Rang", width: 45, align: "left" },
        { text: data.rank ? String(data.rank) : "", width: 40, bold: true },
        { text: "Retards", width: 60 },
        { text: String(data.late_count ?? 0), width: 35, bold: true },
        { text: "Absences", width: 100 },
        { text: String(data.absence_count ?? 0), width: BULLETIN_WIDTH - 460, bold: true }
    ];
    x = 0;
    for (const part of summary) {
        cell(doc, x, y, part.width, ROW_HEIGHT + 4, part.text, { bold: part.bold, align: part.align || "center", size: part.size || 9 });
        x += part.width;
    }
    y += ROW_HEIGHT + 4 + 16;

    // Appréciation du travail (gauche) et distinctions / sanctions (droite).
    const blockWidth = 240;
    const rightX = BULLETIN_WIDTH - blockWidth;
    const leftEnd = checklist(doc, 0, y, blockWidth, WORK_APPRECIATIONS.map((w) => w.label), data.work_appreciation);
    const rightEnd = checklist(doc, rightX, y, blockWidth, DISTINCTIONS.map((d) => d.label), data.distinction);
    y = Math.max(leftEnd, rightEnd) + 18;

    // Observations du conseil (cadre à remplir) et visa du chef d'établissement.
    doc.font("Helvetica-Bold").fontSize(10).fillColor(COLORS.ink)
        .text("Observations du conseil des professeurs", 0, y, { width: blockWidth, lineBreak: false });
    doc.text("Le Chef d'Établissement", rightX, y, { width: blockWidth, align: "center", lineBreak: false });
    doc.lineWidth(0.5).strokeColor(COLORS.rule).rect(0, y + 16, blockWidth, 70).stroke();

    return y + 16 + 70;
}

// Hauteur qu'occupe un bulletin, mesurée en le dessinant sur un document
// jetable (jamais écrit) : sert à choisir l'échelle qui le fait tenir en A5.
function measureBulletin(context) {
    const scratch = new PDFDocument({ size: [BULLETIN_WIDTH, 5000], margin: 0 });
    const height = drawBulletin(scratch, context);
    scratch.end();
    return height;
}

// Document PDF en mémoire -> Buffer.
function renderPdf(options, draw) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument(options);
        const chunks = [];
        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
        draw(doc);
        doc.end();
    });
}

class ReportCardPdfService {
    // Fiches liées à un bulletin (élève, classe, période, école, inscription).
    async _context(data) {
        const [student, classRecord, period] = await Promise.all([
            data.Student ? Promise.resolve(data.Student) : Student.findByPk(data.student_id),
            Class.findByPk(data.class_id),
            Period.findByPk(data.period_id)
        ]);
        const academicYear = classRecord ? await AcademicYear.findByPk(classRecord.academic_year_id) : null;
        const school = academicYear ? await School.findByPk(academicYear.school_id) : null;
        const enrollment = await Enrollment.findOne({ where: { student_id: data.student_id, class_id: data.class_id } });
        return { data, student, classRecord, period, academicYear, school, enrollment };
    }

    // Un bulletin en pleine page A4 portrait.
    async generate(id, currentUser) {
        // getById porte le contrôle d'accès (école, parent) et tous les calculs.
        const context = await this._context(await reportCardService.getById(id, currentUser));

        const buffer = await renderPdf({ size: "A4", margin: MARGIN }, (doc) => {
            doc.save();
            doc.translate(MARGIN, MARGIN);
            drawBulletin(doc, context);
            doc.restore();
        });

        const { student, period } = context;
        const studentName = student ? `${student.last_name}-${student.first_name}` : String(context.data.student_id);
        const filename = `bulletin-${slug(studentName)}-${slug(period?.label || "")}.pdf`.replace(/-\.pdf$/, ".pdf");
        return { buffer, filename };
    }

    // Tous les bulletins d'une classe pour une période, deux par feuille :
    // A4 paysage, un bulletin réduit sur chaque moitié, trait de découpe au milieu.
    async generateForClass(classId, periodId, currentUser) {
        const details = await reportCardService.getClassDetails(classId, periodId, currentUser);
        const contexts = [];
        for (const data of details) {
            contexts.push(await this._context(data));
        }

        const buffer = await renderPdf({ size: "A4", layout: "landscape", margin: 0 }, (doc) => {
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;
            const slotWidth = pageWidth / 2 - HALF_MARGIN * 2;
            const slotHeight = pageHeight - HALF_MARGIN * 2;

            contexts.forEach((context, index) => {
                const slot = index % 2;
                if (index > 0 && slot === 0) doc.addPage({ size: "A4", layout: "landscape", margin: 0 });

                // Échelle : la plus grande qui fait tenir le bulletin en largeur ET en hauteur.
                const scale = Math.min(slotWidth / BULLETIN_WIDTH, slotHeight / measureBulletin(context));
                const originX = slot * (pageWidth / 2) + HALF_MARGIN + (slotWidth - BULLETIN_WIDTH * scale) / 2;

                doc.save();
                doc.translate(originX, HALF_MARGIN);
                doc.scale(scale);
                drawBulletin(doc, context);
                doc.restore();

                // Trait de découpe entre les deux bulletins d'une même feuille.
                if (slot === 1 || index === contexts.length - 1) {
                    doc.save();
                    doc.moveTo(pageWidth / 2, 8).lineTo(pageWidth / 2, pageHeight - 8)
                        .dash(4, { space: 4 }).lineWidth(0.5).strokeColor(COLORS.muted).stroke();
                    doc.restore();
                }
            });
        });

        const { classRecord, period } = contexts[0];
        const filename = `bulletins-${slug(classRecord?.name || String(classId))}-${slug(period?.label || "")}.pdf`.replace(/-\.pdf$/, ".pdf");
        return { buffer, filename, count: contexts.length };
    }
}

module.exports = new ReportCardPdfService();
