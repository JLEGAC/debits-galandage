import { solveRelations } from "./formulas.js";

export const clone = value => structuredClone(value);

export function validateConfiguration(candidate, defaults) {
  if (!candidate || candidate.format !== "regles-calcul-pwa" || candidate.version !== 1) throw Error("Le fichier n’est pas une configuration reconnue.");
  const titre = String(candidate.titre || "").trim();
  if (!titre || titre.length > 80) throw Error("Le titre doit contenir de 1 à 80 caractères.");
  const regles = candidate.regles;
  if (!regles || regles.version !== defaults.version) throw Error("La version des règles n’est pas compatible.");

  const libelles = regles.libelles;
  if (!libelles || Object.keys(libelles).length !== Object.keys(defaults.libelles).length) throw Error("La liste des libellés ne correspond pas aux cotes disponibles.");
  for (const key of Object.keys(defaults.libelles)) {
    if (typeof libelles[key] !== "string" || !libelles[key].trim() || libelles[key].length > 100) throw Error(`Libellé invalide pour ${key}.`);
  }
  const knownDimensions = new Set(Object.keys(defaults.libelles));

  if (!Array.isArray(regles.relations) || regles.relations.length !== defaults.relations.length) throw Error("Le nombre de relations ne correspond pas au jeu de règles d’origine.");
  const ids = new Set();
  const relations = regles.relations.map(relation => {
    const base = defaults.relations.find(item => item.id === relation.id);
    if (!base || ids.has(relation.id)) throw Error("Une relation est inconnue ou présente plusieurs fois.");
    ids.add(relation.id);
    if (typeof relation.equation !== "string" || relation.equation.length > 180 || relation.equation.split("=").length !== 2) throw Error(`Équation invalide : ${relation.id}.`);
    const [target, expression] = relation.equation.split("=").map(part => part.trim());
    if (!knownDimensions.has(target)) throw Error(`La cote de résultat « ${target} » n’existe pas.`);
    const variables = expression.match(/[A-Za-zÀ-ÿ_][\wÀ-ÿ]*/g) || [];
    if (variables.some(name => !knownDimensions.has(name))) throw Error(`Une cote de la relation « ${relation.id} » n’existe pas.`);
    try { solveRelations([{ equation:relation.equation }], {}); } catch { throw Error(`La syntaxe de l’équation « ${relation.equation} » n’est pas prise en charge.`); }
    for (const [key, allowed] of Object.entries({
      vantail:["simple", "double"], imposte:["avec", "sans"],
      materiau:["bois", "aluminium"], remplissage:["vitré", "plein"]
    })) {
      if (relation[key] != null && !allowed.includes(relation[key])) throw Error(`Condition invalide pour la relation « ${relation.id} ».`);
    }
    return {
      ...base, equation:relation.equation, minimum:relation.minimum === true,
      vantail:relation.vantail, imposte:relation.imposte, materiau:relation.materiau, remplissage:relation.remplissage
    };
  });

  const profils = regles.debits;
  if (!Array.isArray(profils) || profils.length !== defaults.debits.length) throw Error("La liste des profils ne correspond pas au jeu d’origine.");
  const debits = defaults.debits.map(base => {
    const profil = profils.find(item => item.id === base.id);
    if (!profil || typeof profil.profil !== "string" || !profil.profil.trim() || profil.profil.length > 100) throw Error(`Nom de profil invalide : ${base.id}.`);
    return { ...base, profil:profil.profil };
  });

  return {
    titre,
    regles:{ ...clone(defaults), titre, libelles:clone(libelles), relations, debits }
  };
}

export function makeExportConfiguration(config) {
  return { format:"regles-calcul-pwa", version:1, titre:config.titre, regles:clone(config.regles) };
}
