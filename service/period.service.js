const { Period, AcademicYear } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class PeriodService extends BaseService {
    constructor() {
        super(Period);
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
        const { academic_year_id, label, start_date, end_date, position } = data;

        if (!academic_year_id || !label || !start_date || !end_date) {
            throw new HttpError("academic_year_id, label, start_date et end_date sont requis.", 400);
        }

        await this._assertAcademicYearAccess(academic_year_id, currentUser);

        return super.create({
            academic_year_id,
            label,
            start_date,
            end_date,
            position: position ?? 1
        });
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
            order: [["position", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const period = await this.model.findByPk(id);

        if (!period) {
            throw new HttpError("Période introuvable", 404);
        }

        await this._assertAcademicYearAccess(period.academic_year_id, currentUser);

        return period;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const period = await this._findWithAccess(id, currentUser);

        const { label, start_date, end_date, position } = data;

        await period.update({
            label: label ?? period.label,
            start_date: start_date ?? period.start_date,
            end_date: end_date ?? period.end_date,
            position: position ?? period.position
        });

        return period;
    }

    async delete(id, currentUser) {
        const period = await this._findWithAccess(id, currentUser);
        await period.destroy();
    }
}

module.exports = new PeriodService();
