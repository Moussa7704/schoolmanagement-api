// Tests du calcul des moyennes (système malien), règles validées le 2026-10-12.
// Lancer : npm run test:moyennes (aucune base de données nécessaire).

const test = require("node:test");
const assert = require("node:assert/strict");
const { round2, toTwenty, subjectAverage, termAverages, annualAverages, rankEntries } = require("../utils/averages");
const { subjectAppreciation, workAppreciation, distinction } = require("../constants/grading");

const subject = (id, name, coefficient, devoirs, compositions) =>
    ({ subject_id: id, subject_name: name, coefficient, devoirs, compositions });

// --- Arrondi et notes sur 20 ---------------------------------------------------

test("arrondi à 2 décimales, au plus proche, malgré les flottants", () => {
    assert.equal(round2(12.675), 12.68);
    assert.equal(round2(1.005), 1.01);
    assert.equal(round2(38 / 3), 12.67);
    assert.equal(round2(null), null);
});

test("une note est ramenée sur 20", () => {
    assert.equal(toTwenty(15, 40), 7.5);
    assert.equal(toTwenty(8, 10), 16);
    assert.equal(toTwenty(14, 20), 14);
});

// --- Moyenne d'une matière ------------------------------------------------------

test("Devoir = moyenne simple des devoirs faits", () => {
    assert.equal(subjectAverage([12, 16], [10]).devoir, 14);
    assert.equal(round2(subjectAverage([10, 13, 15], [10]).devoir), 12.67);
});

test("Moy/20 = (Devoir + Comp × 2) ÷ 3", () => {
    // Devoir 14, Comp 11 → (14 + 22) / 3 = 12
    assert.equal(subjectAverage([12, 16], [11]).average, 12);
});

test("il manque la Comp ou les devoirs : matière non notée", () => {
    const sansComp = subjectAverage([12, 16], []);
    assert.equal(sansComp.devoir, 14);
    assert.equal(sansComp.average, null);

    const sansDevoir = subjectAverage([], [15]);
    assert.equal(sansDevoir.composition, 15);
    assert.equal(sansDevoir.average, null);
});

// --- Bulletin trimestriel -------------------------------------------------------

test("moyenne générale = Σ Moy×coef ÷ Σ coef des matières notées", () => {
    const result = termAverages([
        subject(1, "Maths", 4, [12, 16], [11]),   // 12 × 4 = 48
        subject(2, "Français", 3, [10], [14]),    // 38/3 × 3 = 38
        subject(3, "EPS", 1, [15], []),           // pas de Comp : non notée
        subject(4, "Dessin", 1, [], [])           // aucune note
    ]);

    assert.equal(result.total_coefficient, 7);
    assert.equal(result.total_weighted, 86);       // pas 86,01 : aucun arrondi intermédiaire
    assert.equal(result.overall_average, 12.29);   // 86 / 7

    const [maths, francais, eps, dessin] = result.subjects;
    assert.equal(maths.average, 12);
    assert.equal(maths.weighted_average, 48);
    assert.equal(francais.average, 12.67);
    assert.equal(francais.weighted_average, 38);
    assert.equal(eps.devoir_average, 15);
    assert.equal(eps.average, null);
    assert.equal(eps.weighted_average, null);
    assert.equal(dessin.average, null);
});

test("aucune matière notée : pas de moyenne générale", () => {
    const result = termAverages([subject(1, "Maths", 4, [12], [])]);
    assert.equal(result.overall_average, null);
    assert.equal(result.total_coefficient, 0);
});

test("l'appréciation suit la moyenne affichée", () => {
    // Devoir 11,988, Comp 12 → 11,996 affiché 12,00 → « Assez bien »
    const result = termAverages([subject(1, "Maths", 1, [11.988], [12])]);
    assert.equal(result.subjects[0].average, 12);
    assert.equal(result.subjects[0].appreciation, "Assez bien");
});

// --- Bulletin annuel ------------------------------------------------------------

const year = () => {
    const t1 = termAverages([subject(1, "Maths", 4, [12, 16], [11]), subject(2, "Français", 3, [10], [14])]);
    const t2 = termAverages([subject(1, "Maths", 4, [14], [14]), subject(2, "Français", 3, [10], [10])]);
    const t3 = termAverages([subject(1, "Maths", 4, [15], []), subject(2, "Français", 3, [11], [11])]);
    return [
        { period_id: 1, label: "1er trimestre", result: t1 },
        { period_id: 2, label: "2e trimestre", result: t2 },
        { period_id: 3, label: "3e trimestre", result: t3 }
    ];
};

test("moyenne annuelle d'une matière = moyenne des trimestres où elle est notée", () => {
    const result = annualAverages(year());
    const [maths, francais] = result.subjects;

    assert.deepEqual(maths.term_averages, [12, 14, null]);
    assert.equal(maths.average, 13);                // (12 + 14) / 2, T3 non noté
    assert.equal(maths.weighted_average, 52);

    assert.deepEqual(francais.term_averages, [12.67, 10, 11]);
    assert.equal(francais.average, 11.22);          // (38/3 + 10 + 11) / 3 = 101/9
    assert.equal(francais.weighted_average, 33.67);
});

test("moyenne annuelle = Σ (moy. annuelle matière × coef) ÷ Σ coef", () => {
    const result = annualAverages(year());
    assert.equal(result.total_coefficient, 7);
    assert.equal(result.total_weighted, 85.67);     // 52 + 101/3
    assert.equal(result.overall_average, 12.24);    // 257/21, et non la moyenne des 3 trimestres
    assert.deepEqual(result.terms.map((t) => t.overall_average), [12.29, 12.29, 11]);
});

test("élève arrivé au 2e trimestre : seuls les trimestres notés comptent", () => {
    const terms = year();
    terms[0] = { ...terms[0], result: termAverages([subject(1, "Maths", 4, [], []), subject(2, "Français", 3, [], [])]) };
    const result = annualAverages(terms);

    assert.equal(result.terms[0].overall_average, null);
    assert.equal(result.subjects[0].average, 14);   // Maths : T2 seul
    assert.equal(result.subjects[1].average, 10.5); // Français : (10 + 11) / 2
    assert.equal(result.overall_average, 12.5);     // (56 + 31,5) / 7
});

// --- Classement -----------------------------------------------------------------

test("classement : ex-æquo au même rang (1, 2, 2, 4), sans moyenne en fin de liste", () => {
    const ranking = rankEntries([
        { student_id: 1, overall_average: 12 },
        { student_id: 2, overall_average: null },
        { student_id: 3, overall_average: 15 },
        { student_id: 4, overall_average: 10 },
        { student_id: 5, overall_average: 12 }
    ]);
    assert.deepEqual(ranking.map((e) => [e.student_id, e.rank]), [[3, 1], [1, 2], [5, 2], [4, 4], [2, null]]);
});

// --- Barèmes --------------------------------------------------------------------

test("appréciations par matière à leurs seuils", () => {
    assert.equal(subjectAppreciation(16), "Très bien");
    assert.equal(subjectAppreciation(14), "Bien");
    assert.equal(subjectAppreciation(12), "Assez bien");
    assert.equal(subjectAppreciation(10), "Passable");
    assert.equal(subjectAppreciation(9.99), "Insuffisant");
    assert.equal(subjectAppreciation(8), "Insuffisant");
    assert.equal(subjectAppreciation(7.99), "Faible");
    assert.equal(subjectAppreciation(null), null);
});

test("appréciation du travail selon la moyenne générale", () => {
    assert.equal(workAppreciation(12), "Satisfaisant doit continuer");
    assert.equal(workAppreciation(11.99), "Peut Mieux Faire");
    assert.equal(workAppreciation(8), "Insuffisant");
    assert.equal(workAppreciation(6), "Risque de Redoubler");
    assert.equal(workAppreciation(5.99), "Risque l'exclusion");
});

test("distinctions : seuils, et blâme jamais automatique", () => {
    assert.equal(distinction(16), "Félicitations");
    assert.equal(distinction(14), "Encouragement");
    assert.equal(distinction(12), "Tableau d'honneur");
    assert.equal(distinction(11.99), null);
    assert.equal(distinction(8), null);
    assert.equal(distinction(7.99), "Avertissement");
    assert.equal(distinction(0), "Avertissement");
    assert.equal(distinction(null), null);
});
