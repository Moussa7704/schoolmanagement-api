// Calcul des moyennes (système malien), sans accès à la base : les services
// chargent les notes, ces fonctions font les calculs. Règles validées le
// 2026-10-12 ; tests : npm run test:moyennes.
//
// Par matière, sur un trimestre :
//   Devoir  = moyenne simple des devoirs faits, ramenés sur 20
//   Comp    = note de composition ramenée sur 20 (moyenne si plusieurs)
//   Moy/20  = (Devoir × poids + Comp × poids) / somme des poids (constants/grading.js)
//   Il manque la Comp ou les devoirs : la matière n'est pas notée.
// Moyenne générale = Σ (Moy/20 × coef) / Σ coef des matières notées.
// Aucun arrondi intermédiaire : seuls les résultats renvoyés sont arrondis.

const { DEVOIR_WEIGHT, COMPOSITION_WEIGHT, subjectAppreciation } = require("../constants/grading");

const mean = (values) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

// Arrondi à 2 décimales, au plus proche (12,675 → 12,68) : toPrecision(15)
// efface l'erreur des flottants (12,675 × 100 = 1267,4999999999998).
const round2 = (value) => (value === null || value === undefined
    ? null
    : Math.round(Number((value * 100).toPrecision(15))) / 100);

// Note ramenée sur 20 (15/40 → 7,5).
const toTwenty = (score, maxScore) => (Number(score) / Number(maxScore)) * 20;

// Moy/20 d'une matière à partir des notes déjà ramenées sur 20.
function subjectAverage(devoirs, compositions) {
    const devoir = mean(devoirs);
    const composition = mean(compositions);
    const average = devoir !== null && composition !== null
        ? (devoir * DEVOIR_WEIGHT + composition * COMPOSITION_WEIGHT) / (DEVOIR_WEIGHT + COMPOSITION_WEIGHT)
        : null;
    return { devoir, composition, average };
}

// Σ (moyenne × coef) / Σ coef sur les seules lignes notées (moyenne non nulle).
function weightedTotals(rows) {
    let totalCoefficient = 0;
    let totalWeighted = 0;
    for (const row of rows) {
        if (row.average === null) continue;
        totalCoefficient += row.coefficient;
        totalWeighted += row.average * row.coefficient;
    }
    return {
        overall: totalCoefficient ? totalWeighted / totalCoefficient : null,
        total_coefficient: totalCoefficient,
        total_weighted: totalWeighted
    };
}

// Bulletin trimestriel. subjects : [{ subject_id, subject_name, coefficient,
// devoirs: [notes /20], compositions: [notes /20] }], dans l'ordre d'affichage.
function termAverages(subjects) {
    const rows = subjects.map((s) => {
        const { devoir, composition, average } = subjectAverage(s.devoirs, s.compositions);
        return { ...s, devoir, composition, average };
    });
    const totals = weightedTotals(rows);

    return {
        subjects: rows.map((r) => ({
            subject_id: r.subject_id,
            subject_name: r.subject_name,
            coefficient: r.coefficient,
            devoir_average: round2(r.devoir),
            devoir_count: r.devoirs.length,
            composition_average: round2(r.composition),
            average: round2(r.average),
            weighted_average: r.average === null ? null : round2(r.average * r.coefficient),
            // Sur la moyenne affichée : 11,996 imprimé « 12,00 » a l'appréciation de 12.
            appreciation: subjectAppreciation(round2(r.average))
        })),
        overall_average: round2(totals.overall),
        total_coefficient: totals.total_coefficient,
        total_weighted: round2(totals.total_weighted),
        // Valeur exacte, pour la moyenne annuelle (pas d'arrondi intermédiaire).
        _exact: { rows, overall: totals.overall }
    };
}

// Bulletin annuel. terms : [{ period_id, label, result }] dans l'ordre des
// trimestres, où result est le retour de termAverages. Moyenne annuelle d'une
// matière = moyenne des trimestres où elle est notée ; moyenne annuelle =
// Σ (moyenne annuelle matière × coef) / Σ coef (cohérente avec le TOTAL).
function annualAverages(terms) {
    const bySubject = new Map();
    terms.forEach((term, index) => {
        for (const row of term.result._exact.rows) {
            if (!bySubject.has(row.subject_id)) {
                bySubject.set(row.subject_id, {
                    subject_id: row.subject_id,
                    subject_name: row.subject_name,
                    coefficient: row.coefficient,
                    terms: terms.map(() => null)
                });
            }
            bySubject.get(row.subject_id).terms[index] = row.average;
        }
    });

    const rows = Array.from(bySubject.values()).map((s) => ({
        ...s,
        average: mean(s.terms.filter((t) => t !== null))
    }));
    const totals = weightedTotals(rows);

    return {
        terms: terms.map((t) => ({
            period_id: t.period_id,
            label: t.label,
            overall_average: t.result.overall_average
        })),
        subjects: rows.map((r) => ({
            subject_id: r.subject_id,
            subject_name: r.subject_name,
            coefficient: r.coefficient,
            term_averages: r.terms.map(round2),
            average: round2(r.average),
            weighted_average: r.average === null ? null : round2(r.average * r.coefficient),
            appreciation: subjectAppreciation(round2(r.average))
        })),
        overall_average: round2(totals.overall),
        total_coefficient: totals.total_coefficient,
        total_weighted: round2(totals.total_weighted)
    };
}

// Classement « 1224 » : deux moyennes égales partagent le rang, le suivant
// saute d'autant. Les élèves sans moyenne finissent en bas, sans rang.
// entries : [{ ..., overall_average }] ; renvoie une copie triée avec rank.
function rankEntries(entries) {
    const sorted = entries.map((e) => ({ ...e, rank: null })).sort((a, b) => {
        if (a.overall_average === null && b.overall_average === null) return 0;
        if (a.overall_average === null) return 1;
        if (b.overall_average === null) return -1;
        return b.overall_average - a.overall_average;
    });

    let rank = 0;
    let previous = null;
    sorted.forEach((entry, index) => {
        if (entry.overall_average === null) return;
        if (entry.overall_average !== previous) {
            rank = index + 1;
            previous = entry.overall_average;
        }
        entry.rank = rank;
    });
    return sorted;
}

module.exports = {
    round2,
    toTwenty,
    subjectAverage,
    termAverages,
    annualAverages,
    rankEntries
};
