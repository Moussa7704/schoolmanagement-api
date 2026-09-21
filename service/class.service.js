const { Class, AcademicYear } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

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

    async create(data, currentUser) {
        const { academic_year_id, name, level, capacity } = data;

        if (!academic_year_id || !name) {
            throw new HttpError("academic_year_id et name sont requis.", 400);
        }

        await this._assertAcademicYearAccess(academic_year_id, currentUser);

        return super.create({ academic_year_id, name, level, capacity });
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

        return this.model.findAll({
            where,
            order: [["name", "ASC"]]
        });
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
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const classRecord = await this._findWithAccess(id, currentUser);

        const { name, level, capacity } = data;

        await classRecord.update({
            name: name ?? classRecord.name,
            level: level ?? classRecord.level,
            capacity: capacity ?? classRecord.capacity
        });

        return classRecord;
    }

    async delete(id, currentUser) {
        const classRecord = await this._findWithAccess(id, currentUser);
        await classRecord.destroy();
    }
}

module.exports = new ClassService();
