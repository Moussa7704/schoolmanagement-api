// Petits utilitaires partagés par les exports PDF (pdfkit).

// Une valeur trop longue est coupée avec « … » plutôt que de passer à la
// ligne et de chevaucher la ligne suivante (l'option ellipsis de pdfkit ne
// suffit pas quand le retour à la ligne est désactivé). La mesure dépend de
// la police et de la taille courantes du document : les régler avant l'appel.
const fitText = (doc, text, width) => {
    if (doc.widthOfString(text) <= width) return text;
    let cut = text;
    while (cut.length > 1 && doc.widthOfString(`${cut}…`) > width) {
        cut = cut.slice(0, -1);
    }
    return `${cut.trimEnd()}…`;
};

// Nom de fichier sans caractères refusés par Windows ni accents.
const slug = (value) => String(value || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

module.exports = { fitText, slug };
