const { School } = require("../models")
const BaseService = require("./base-service");
const HttpError = require("../utils/httpError");

class SchoolService extends BaseService {
    constructor() {
        super(School);
    }

    async create(data) {
        const { name, address, phone, email, academy } = data;

        if (!name) {
            throw new HttpError("Le nom de l'école est requis.", 400);
        }

        const existing = await this.model.findOne({ where: { name } });
        if (existing) {
            throw new HttpError("Une école possède déjà ce nom.", 400);
        }

        return super.create({ name, address, phone, email, academy });
    }

    async list() {
        return this.model.findAll({ order: [["id", "ASC"]] });
    }

    async getById(id) {
        const school = await this.model.findByPk(id);
        if (!school) {
            throw new HttpError("École introuvable", 404);
        }
        return school;
    }

    async update(id, data) {
        const school = await this.getById(id);

        const { name, address, phone, email, academy } = data;

        if (name && name !== school.name) {
            const existing = await this.model.findOne({ where: { name } });
            if (existing) {
                throw new HttpError("Une école possède déjà ce nom.", 400);
            }
        }

        await school.update({
            name: name ?? school.name,
            address: address ?? school.address,
            phone: phone ?? school.phone,
            email: email ?? school.email,
            academy: academy ?? school.academy
        });

        return school;
    }

    async delete(id) {
        const school = await this.getById(id);
        await school.destroy();
    }
}

module.exports = new SchoolService();
