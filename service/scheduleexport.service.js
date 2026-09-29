const PDFDocument = require("pdfkit");
const { AcademicYear, School, Schedule, TeacherAssignment, Teacher, Subject, User } = require("../models");
const classService = require("./class.service");
const { fitText, slug } = require("../utils/pdf");

// Colonnes du tableau : lundi → samedi. Le dimanche n'est ajouté que si la
// classe a au moins un cours ce jour-là.
const DAYS = [
    { key: "MONDAY", label: "Lundi" },
    { key: "TUESDAY", label: "Mardi" },
    { key: "WEDNESDAY", label: "Mercredi" },
    { key: "THURSDAY", label: "Jeudi" },
    { key: "FRIDAY", label: "Vendredi" },
    { key: "SATURDAY", label: "Samedi" }
];
const SUNDAY = { key: "SUNDAY", label: "Dimanche" };

const MARGIN = 36;
const TIME_COLUMN_WIDTH = 78;
const HEADER_ROW_HEIGHT = 22;
const CELL_PADDING = 5;
const FOOTER_SPACE = 24;
const MIN_ROW_HEIGHT = 34;
const MAX_ROW_HEIGHT = 72;
const COLORS = {
    ink: "#1f1f1f",
    muted: "#6b6b6b",
    headerFill: "#e8eef7",
    timeFill: "#f5f5f3",
    rule: "#c3c2b7"
};

// "08:00:00" -> "08h", "10:30:00" -> "10h30"
const formatHour = (time) => {
    const [h, m] = String(time).split(":");
    return m === "00" ? `${h}h` : `${h}h${m}`;
};

// « Mr Bamba » / « Mme Konate » quand le genre est renseigné ; sinon prénom et
// nom complets plutôt que de deviner une civilité.
const TITLES = { M: "Mr", F: "Mme" };
const teacherName = (teacher) => {
    const user = teacher?.User;
    if (!user) return "";
    const title = TITLES[teacher.gender];
    if (title && user.last_name) return `${title} ${user.last_name}`;
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
};

class ScheduleExportService {
    // Créneaux de la classe avec matière et enseignant (nom porté par son compte User).
    async _loadSlots(classId) {
        const slots = await Schedule.findAll({
            include: [{
                model: TeacherAssignment,
                as: "TeacherAssignment",
                where: { class_id: classId },
                include: [
                    { model: Subject, as: "Subject" },
                    { model: Teacher, as: "Teacher", include: [{ model: User, as: "User", attributes: ["first_name", "last_name"] }] }
                ]
            }]
        });

        return slots.map((slot) => ({
            day: slot.day_of_week,
            start: slot.start_time,
            end: slot.end_time,
            subject: slot.TeacherAssignment?.Subject?.name || "",
            teacher: teacherName(slot.TeacherAssignment?.Teacher),
            room: slot.room || ""
        }));
    }

    // Lignes = tranches horaires réellement utilisées par la classe, triées.
    // Cellules = cours de cette tranche pour chaque jour.
    _buildGrid(slots) {
        const days = slots.some((s) => s.day === SUNDAY.key) ? [...DAYS, SUNDAY] : DAYS;

        const ranges = new Map();
        for (const slot of slots) {
            const key = `${slot.start}|${slot.end}`;
            if (!ranges.has(key)) {
                ranges.set(key, { start: slot.start, end: slot.end, cells: new Map() });
            }
            const cell = ranges.get(key).cells;
            if (!cell.has(slot.day)) cell.set(slot.day, []);
            cell.get(slot.day).push(slot);
        }

        const rows = [...ranges.values()]
            .sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));

        return { days, rows };
    }

    // Contenu d'une case centré horizontalement et verticalement : on mesure
    // d'abord la hauteur du bloc (matière, enseignant, salle) puis on le place
    // au milieu de la case.
    _drawCell(doc, x, y, width, height, lessons) {
        const innerWidth = width - CELL_PADDING * 2;
        const lines = [];
        lessons.forEach((lesson, i) => {
            if (i > 0) lines.push({ gap: 3 });
            lines.push({ text: lesson.subject, font: "Helvetica-Bold", size: 8.5, color: COLORS.ink, height: 11 });
            if (lesson.teacher) lines.push({ text: lesson.teacher, font: "Helvetica", size: 8, color: COLORS.ink, height: 10 });
            if (lesson.room) lines.push({ text: `Salle ${lesson.room}`, font: "Helvetica", size: 7, color: COLORS.muted, height: 9 });
        });

        // Ce qui ne tient pas dans la case est abandonné plutôt que de déborder.
        const maxHeight = height - CELL_PADDING * 2;
        const visible = [];
        let blockHeight = 0;
        for (const line of lines) {
            const h = line.gap ?? line.height;
            if (blockHeight + h > maxHeight) break;
            visible.push(line);
            blockHeight += h;
        }

        let textY = y + (height - blockHeight) / 2;
        for (const line of visible) {
            if (line.gap) {
                textY += line.gap;
                continue;
            }
            doc.font(line.font).fontSize(line.size).fillColor(line.color);
            doc.text(fitText(doc, line.text, innerWidth), x + CELL_PADDING, textY, { width: innerWidth, align: "center", lineBreak: false });
            textY += line.height;
        }
    }

    async exportSchedule(classId, currentUser) {
        // Même contrôle d'accès que GET /classes/:id (404 / 403 selon l'école).
        const classRecord = await classService._findWithAccess(classId, currentUser);
        const academicYear = await AcademicYear.findByPk(classRecord.academic_year_id);
        const school = academicYear ? await School.findByPk(academicYear.school_id) : null;
        const { days, rows } = this._buildGrid(await this._loadSlots(classRecord.id));

        const buffer = await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGIN });
            const chunks = [];
            doc.on("data", (chunk) => chunks.push(chunk));
            doc.on("end", () => resolve(Buffer.concat(chunks)));
            doc.on("error", reject);

            const contentWidth = doc.page.width - MARGIN * 2;

            // En-tête : même présentation que la liste des élèves.
            doc.font("Helvetica-Bold").fontSize(15).fillColor(COLORS.ink)
                .text(school?.name || "Établissement scolaire", MARGIN, MARGIN, { width: contentWidth, align: "center" });
            if (school?.address) {
                doc.font("Helvetica").fontSize(9).fillColor(COLORS.muted)
                    .text(school.address, { width: contentWidth, align: "center" });
            }
            doc.moveDown(0.8);
            doc.font("Helvetica-Bold").fontSize(13).fillColor(COLORS.ink)
                .text(`Emploi du temps — ${classRecord.name}${classRecord.level ? ` (${classRecord.level})` : ""}`,
                    { width: contentWidth, align: "center" });
            doc.moveDown(0.4);
            doc.font("Helvetica").fontSize(10).fillColor(COLORS.ink)
                .text(`Année scolaire : ${academicYear?.label || "-"}`, { width: contentWidth, align: "center" });

            const tableTop = doc.y + 14;
            const dayWidth = (contentWidth - TIME_COLUMN_WIDTH) / days.length;
            const available = doc.page.height - MARGIN - FOOTER_SPACE - tableTop - HEADER_ROW_HEIGHT;
            // Tout le tableau tient sur une page : la hauteur des lignes s'adapte
            // au nombre de tranches horaires, dans des bornes lisibles.
            const rowHeight = rows.length
                ? Math.max(MIN_ROW_HEIGHT, Math.min(MAX_ROW_HEIGHT, available / rows.length))
                : MIN_ROW_HEIGHT;

            // Ligne de titres : « Horaires » puis les jours.
            doc.rect(MARGIN, tableTop, contentWidth, HEADER_ROW_HEIGHT).fill(COLORS.headerFill);
            doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink)
                .text("Horaires", MARGIN, tableTop + 7, { width: TIME_COLUMN_WIDTH, align: "center", lineBreak: false });
            days.forEach((day, i) => {
                doc.text(day.label, MARGIN + TIME_COLUMN_WIDTH + i * dayWidth, tableTop + 7, { width: dayWidth, align: "center", lineBreak: false });
            });

            let y = tableTop + HEADER_ROW_HEIGHT;
            if (rows.length === 0) {
                doc.font("Helvetica-Oblique").fontSize(10).fillColor(COLORS.muted)
                    .text("Aucun créneau saisi pour cette classe.", MARGIN, y + 14, { width: contentWidth, align: "center" });
                y += MIN_ROW_HEIGHT;
            }

            rows.forEach((row) => {
                doc.rect(MARGIN, y, TIME_COLUMN_WIDTH, rowHeight).fill(COLORS.timeFill);
                doc.font("Helvetica-Bold").fontSize(9).fillColor(COLORS.ink)
                    .text(`${formatHour(row.start)} – ${formatHour(row.end)}`, MARGIN, y + rowHeight / 2 - 5,
                        { width: TIME_COLUMN_WIDTH, align: "center", lineBreak: false });

                days.forEach((day, i) => {
                    const lessons = row.cells.get(day.key);
                    if (lessons) {
                        this._drawCell(doc, MARGIN + TIME_COLUMN_WIDTH + i * dayWidth, y, dayWidth, rowHeight, lessons);
                    }
                });
                y += rowHeight;
            });

            // Quadrillage fin : lignes horizontales puis séparateurs de colonnes.
            const tableBottom = y;
            doc.lineWidth(0.5).strokeColor(COLORS.rule);
            doc.rect(MARGIN, tableTop, contentWidth, tableBottom - tableTop).stroke();
            for (let lineY = tableTop + HEADER_ROW_HEIGHT; lineY < tableBottom; lineY += rows.length ? rowHeight : MIN_ROW_HEIGHT) {
                doc.moveTo(MARGIN, lineY).lineTo(MARGIN + contentWidth, lineY).stroke();
            }
            // Sans créneau, les séparateurs s'arrêtent sous les titres pour ne
            // pas barrer le message « Aucun créneau ».
            const columnBottom = rows.length ? tableBottom : tableTop + HEADER_ROW_HEIGHT;
            for (let i = 0; i <= days.length - 1; i++) {
                const x = MARGIN + TIME_COLUMN_WIDTH + i * dayWidth;
                doc.moveTo(x, tableTop).lineTo(x, columnBottom).stroke();
            }

            doc.font("Helvetica").fontSize(8).fillColor(COLORS.muted)
                .text(`${classRecord.name} — ${academicYear?.label || ""}`, MARGIN, doc.page.height - MARGIN - 10,
                    { width: contentWidth, lineBreak: false });

            doc.end();
        });

        const filename = `emploi-du-temps-${slug(classRecord.name) || classRecord.id}${academicYear ? `-${slug(academicYear.label)}` : ""}.pdf`;
        return { buffer, filename };
    }
}

module.exports = new ScheduleExportService();
