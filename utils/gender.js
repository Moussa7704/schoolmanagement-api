// Student.gender est un champ libre (pas d'enum en base) : on normalise pour
// accepter aussi bien "M"/"F" que "Homme"/"Femme" saisis dans /students.
const BOY_VALUES = new Set(['M', 'H', 'MALE', 'HOMME', 'GARCON']);
const GIRL_VALUES = new Set(['F', 'FEMALE', 'FEMME', 'FILLE']);

const normalizeGender = (value) => {
    if (!value) return null;
    const normalized = value.toString().trim().toUpperCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, ''); // enlève les accents
    if (BOY_VALUES.has(normalized)) return 'M';
    if (GIRL_VALUES.has(normalized)) return 'F';
    return null;
};

module.exports = { normalizeGender };
