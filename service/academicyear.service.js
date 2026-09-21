const { AcademicYear, School, sequelize } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class AcademicYearService extends BaseService {
    constructor() {
        super(AcademicYear);
    }

    async create(data, currentUser) {
        const { label, start_date, end_date } = data;
        let { school_id } = data;

        if (!isSuperAdmin(currentUser)) {
            school_id = currentUser.school_id;
        }

        if (!school_id || !label || !start_date || !end_date) {
            throw new HttpError("school_id, label, start_date et end_date sont requis.", 400);
        }

        const school = await School.findByPk(school_id);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }

        return super.create({
            school_id,
            label,
            start_date,
            end_date,
            is_current: false
        });
    }

    async list(currentUser, query = {}) {
        const where = {};

        if (!isSuperAdmin(currentUser)) {
            where.school_id = currentUser.school_id;
        } else if (query.school_id) {
            where.school_id = query.school_id;
        }

        return this.model.findAll({
            where,
            order: [["start_date", "DESC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const academicYear = await this.model.findByPk(id);

        if (!academicYear) {
            throw new HttpError("Année scolaire introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && academicYear.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return academicYear;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const academicYear = await this._findWithAccess(id, currentUser);

        const { label, start_date, end_date } = data;

        await academicYear.update({
            label: label ?? academicYear.label,
            start_date: start_date ?? academicYear.start_date,
            end_date: end_date ?? academicYear.end_date
        });

        return academicYear;
    }

    async delete(id, currentUser) {
        const academicYear = await this._findWithAccess(id, currentUser);
        await academicYear.destroy();
    }

    async setCurrent(id, currentUser) {
        const t = await sequelize.transaction();
        try {
            const academicYear = await this.model.findByPk(id, { transaction: t });

            if (!academicYear) {
                throw new HttpError("Année scolaire introuvable", 404);
            }

            if (!isSuperAdmin(currentUser) && academicYear.school_id !== currentUser.school_id) {
                throw new HttpError("Accès refusé", 403);
            }

            // On désactive d'abord toute autre année "courante" de l'école
            // pour ne jamais violer l'index unique partiel (school_id) WHERE is_current.
            await this.model.update(
                { is_current: false },
                { where: { school_id: academicYear.school_id }, transaction: t }
            );

            await academicYear.update({ is_current: true }, { transaction: t });

            await t.commit();

            return academicYear;
        } catch (err) {
            await t.rollback();
            throw err;
        }
    }
}

module.exports = new AcademicYearService();
