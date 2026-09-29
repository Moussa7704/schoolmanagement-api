const { Class, AcademicYear, Enrollment, Student } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");
const enrollmentService = require("./enrollment.service");
const { normalizeGender } = require("../utils/gender");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

const CYCLES = ['PRESCOLAIRE', 'PRIMAIRE', 'COLLEGE', 'LYCEE', 'SUPERIEUR'];

class ClassService extends BaseService {
    constructor() {
        super(Class);
    }

    async _assertAcademicYearAccess(academicYearId, currentUser) {
        const academicYear = await AcademicYear.findByPk(academicYearId);

        if (!academicYear) {
            throw new HttpError("Année scolaire introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && academicYear.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return academicYear;
    }

    async _genderCounts(classId) {
        const enrollments = await Enrollment.findAll({
            where: { class_id: classId, status: 'ACTIVE' },
            include: [{ model: Student, attributes: ["gender"] }]
        });

        let boys_count = 0;
        let girls_count = 0;
        for (const enrollment of enrollments) {
            const gender = normalizeGender(enrollment.Student?.gender);
            if (gender === 'M') boys_count++;
            else if (gender === 'F') girls_count++;
        }

        return { students_count: enrollments.length, boys_count, girls_count };
    }

    async _enrich(classRecord) {
        const counts = await this._genderCounts(classRecord.id);
        return { ...classRecord.toJSON(), ...counts };
    }

    _assertValidCycle(cycle) {
        if (cycle !== undefined && cycle !== null && !CYCLES.includes(cycle)) {
            throw new HttpError(`cycle doit être l'un de : ${CYCLES.join(', ')}.`, 400);
        }
    }

    async create(data, currentUser) {
        const { academic_year_id, name, level, cycle, capacity } = data;

        if (!academic_year_id || !name) {
            throw new HttpError("academic_year_id et name sont requis.", 400);
        }
        this._assertValidCycle(cycle);

        await this._assertAcademicYearAccess(academic_year_id, currentUser);

        return super.create({ academic_year_id, name, level, cycle, capacity });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (query.academic_year_id) {
            where.academic_year_id = query.academic_year_id;
            await this._assertAcademicYearAccess(query.academic_year_id, currentUser);
        } else if (!isSuperAdmin(currentUser)) {
            const academicYears = await AcademicYear.findAll({
                where: { school_id: currentUser.school_id },
                attributes: ["id"]
            });
            where.academic_year_id = academicYears.map((a) => a.id);
        }

        if (query.cycle) {
            where.cycle = query.cycle;
        }

        const classes = await this.model.findAll({
            where,
            order: [["name", "ASC"]]
        });

        return Promise.all(classes.map((c) => this._enrich(c)));
    }

    async _findWithAccess(id, currentUser) {
        const classRecord = await this.model.findByPk(id);

        if (!classRecord) {
            throw new HttpError("Classe introuvable", 404);
        }

        await this._assertAcademicYearAccess(classRecord.academic_year_id, currentUser);

        return classRecord;
    }

    async getById(id, currentUser) {
        const classRecord = await this._findWithAccess(id, currentUser);
        return this._enrich(classRecord);
    }

    async update(id, data, currentUser) {
        const classRecord = await this._findWithAccess(id, currentUser);

        const { name, level, cycle, capacity } = data;
        this._assertValidCycle(cycle);

        await classRecord.update({
            name: name ?? classRecord.name,
            level: level ?? classRecord.level,
            cycle: cycle ?? classRecord.cycle,
            capacity: capacity ?? classRecord.capacity
        });

        return classRecord;
    }

    async delete(id, currentUser) {
        const classRecord = await this._findWithAccess(id, currentUser);
        await classRecord.destroy();
    }

    // "Classe suivante" : promeut en masse les élèves actuellement ACTIVE de
    // cette classe vers une classe cible (généralement l'année scolaire
    // suivante). L'inscription de l'année en cours n'est jamais modifiée —
    // conformément au modèle "Enrollment = historique par année" (voir
    // data_model_phase1) — on crée uniquement de nouvelles inscriptions.
    // `promotions` permet d'envoyer des élèves vers des classes différentes en
    // une seule opération (ex: la majorité passe en classe supérieure, certains
    // redoublent dans une classe de même niveau, statut REPEATING).
    async promote(id, promotions, currentUser) {
        const sourceClass = await this._findWithAccess(id, currentUser);

        if (!Array.isArray(promotions) || promotions.length === 0) {
            throw new HttpError("La liste des promotions (promotions: [{ student_id, target_class_id }]) est requise.", 400);
        }

        const activeEnrollments = await Enrollment.findAll({
            where: { class_id: sourceClass.id, status: 'ACTIVE' }
        });
        const activeStudentIds = new Set(activeEnrollments.map((e) => e.student_id));

        const results = [];
        for (const entry of promotions) {
            const { student_id, target_class_id, status } = entry;

            if (!student_id || !target_class_id) {
                throw new HttpError("student_id et target_class_id sont requis pour chaque promotion.", 400);
            }
            if (!activeStudentIds.has(Number(student_id))) {
                throw new HttpError(`L'élève ${student_id} n'a pas d'inscription active dans cette classe.`, 400);
            }

            const enrollment = await enrollmentService.create(
                { student_id, class_id: target_class_id, status: status ?? 'ACTIVE' },
                currentUser
            );
            results.push(enrollment);
        }

        return results;
    }
}

module.exports = new ClassService();
