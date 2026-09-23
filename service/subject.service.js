const { Subject, School, TeacherAssignment } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");
const roles = require("../constants/roles");

const isSuperAdmin = (currentUser) => currentUser?.Role?.name === roles.SUPER_ADMIN;

class SubjectService extends BaseService {
    constructor() {
        super(Subject);
    }

    async create(data, currentUser) {
        const { name, coefficient_default } = data;
        let { school_id } = data;

        if (!isSuperAdmin(currentUser)) {
            school_id = currentUser.school_id;
        }

        if (!school_id || !name) {
            throw new HttpError("school_id et name sont requis.", 400);
        }

        const school = await School.findByPk(school_id);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }

        const existing = await this.model.findOne({ where: { school_id, name } });
        if (existing) {
            throw new HttpError("Cette école possède déjà une matière avec ce nom.", 400);
        }

        return super.create({
            school_id,
            name,
            coefficient_default: coefficient_default ?? 1
        });
    }

    async list(currentUser) {
        const where = {};

        if (!isSuperAdmin(currentUser)) {
            where.school_id = currentUser.school_id;
        }

        return this.model.findAll({
            where,
            order: [["name", "ASC"]]
        });
    }

    async _findWithAccess(id, currentUser) {
        const subject = await this.model.findByPk(id);

        if (!subject) {
            throw new HttpError("Matière introuvable", 404);
        }

        if (!isSuperAdmin(currentUser) && subject.school_id !== currentUser.school_id) {
            throw new HttpError("Accès refusé", 403);
        }

        return subject;
    }

    async getById(id, currentUser) {
        return this._findWithAccess(id, currentUser);
    }

    async update(id, data, currentUser) {
        const subject = await this._findWithAccess(id, currentUser);

        const { name, coefficient_default } = data;

        await subject.update({
            name: name ?? subject.name,
            coefficient_default: coefficient_default ?? subject.coefficient_default
        });

        return subject;
    }

    async delete(id, currentUser) {
        const subject = await this._findWithAccess(id, currentUser);

        // La contrainte DB bloque déjà la suppression (ON DELETE RESTRICT) pour
        // éviter d'effacer en cascade les affectations/évaluations/notes liées à
        // cette matière ; ce contrôle applicatif sert juste à renvoyer un message
        // clair plutôt qu'une erreur SQL brute.
        const assignmentCount = await TeacherAssignment.count({ where: { subject_id: subject.id } });
        if (assignmentCount > 0) {
            throw new HttpError(
                "Impossible de supprimer cette matière : elle est encore affectée à au moins une classe/enseignant. Retirez d'abord ces affectations.",
                400
            );
        }

        await subject.destroy();
    }
}

module.exports = new SubjectService();
