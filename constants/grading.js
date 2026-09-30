// Règles de calcul et de présentation du bulletin (système malien).
// Regroupées ici pour être ajustées en un seul endroit — et, plus tard,
// devenir des réglages par école.

// Moyenne d'une matière sur 20 :
//   Moy/20 = (Devoir × DEVOIR_WEIGHT + Comp × COMPOSITION_WEIGHT) / (somme des poids)
// Devoir = moyenne simple des devoirs de la période (somme / nombre de devoirs),
// Comp   = note de composition (moyenne si plusieurs). S'il n'y a que l'une des
// deux, elle sert seule de moyenne.
const DEVOIR_WEIGHT = 1;
const COMPOSITION_WEIGHT = 2;

// Appréciation par matière, selon la Moy/20 (première borne atteinte).
const SUBJECT_APPRECIATIONS = [
    { min: 16, label: "Très bien" },
    { min: 14, label: "Bien" },
    { min: 12, label: "Assez bien" },
    { min: 10, label: "Passable" },
    { min: 8, label: "Insuffisant" },
    { min: 0, label: "Faible" }
];

// Appréciation du travail (une case cochée), selon la moyenne générale.
const WORK_APPRECIATIONS = [
    { min: 12, label: "Satisfaisant doit continuer" },
    { min: 10, label: "Peut Mieux Faire" },
    { min: 8, label: "Insuffisant" },
    { min: 6, label: "Risque de Redoubler" },
    { min: 0, label: "Risque l'exclusion" }
];

// Distinctions / sanctions (une case au plus), selon la moyenne générale.
// Le blâme est une sanction disciplinaire : jamais coché automatiquement.
const DISTINCTIONS = [
    { label: "Félicitations", min: 16 },
    { label: "Encouragement", min: 14 },
    { label: "Tableau d'honneur", min: 12 },
    { label: "Avertissement", max: 8 },
    { label: "Blâme" }
];

const pickByMin = (scale, value) => (value === null || value === undefined
    ? null
    : scale.find((entry) => value >= entry.min)?.label ?? null);

const subjectAppreciation = (average) => pickByMin(SUBJECT_APPRECIATIONS, average);
const workAppreciation = (average) => pickByMin(WORK_APPRECIATIONS, average);

const distinction = (average) => {
    if (average === null || average === undefined) return null;
    const match = DISTINCTIONS.find((d) =>
        (d.min !== undefined && average >= d.min) || (d.max !== undefined && average < d.max));
    return match ? match.label : null;
};

module.exports = {
    DEVOIR_WEIGHT,
    COMPOSITION_WEIGHT,
    WORK_APPRECIATIONS,
    DISTINCTIONS,
    subjectAppreciation,
    workAppreciation,
    distinction
};
