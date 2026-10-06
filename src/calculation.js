import { solveRelationGroups, applyMinimumDimensions, doorWidthWarning } from "./formulas.js";

function dimensionsFromEquation(equation) {
  const left = equation?.split("=")[0]?.trim();
  return /^[A-Za-zÀ-ÿ_][\wÀ-ÿ]*$/.test(left || "") ? left : null;
}

function ruleApplies(rule, options) {
  return (!rule.vantail || rule.vantail === options.vantail) &&
    (!rule.imposte || rule.imposte === options.imposte) &&
    (!rule.materiau || rule.materiau === options.materiau) &&
    (!rule.remplissage || rule.remplissage === options.remplissage);
}

function isOverriddenMinimum(rule, options, manualValues) {
  if (!rule.minimum) return false;
  const target = dimensionsFromEquation(rule.equation);
  const keys = Object.keys(manualValues);
  if (target === "EM") {
    const relevant = ["EM", "ENTRAXE", "LRAIL"];
    if (options.vantail === "double") relevant.push("LB", "LHF", "LREM");
    return relevant.some(key => keys.includes(key));
  }
  if (target === "MPR") return ["MPR", "LB", "LHF", "LREM"].some(key => keys.includes(key));
  return false;
}

export function relationsActives(regles, options, valeursSaisies = {}) {
  return regles.relations.filter(rule => ruleApplies(rule, options) && !isOverriddenMinimum(rule, options, valeursSaisies));
}

export function calculerProjet(regles, options, valeursSaisies, cotePreferee = null) {
  const relations = relationsActives(regles, options, valeursSaisies);
  const result = solveRelationGroups(relations, valeursSaisies, cotePreferee);
  const resolved = applyMinimumDimensions(result.values, valeursSaisies, options.vantail);
  const minimumKeys = new Set();

  for (const relation of relations) {
    if (!relation.minimum) continue;
    const target = dimensionsFromEquation(relation.equation);
    if (target && !Object.hasOwn(valeursSaisies, target) && Number.isFinite(resolved[target])) minimumKeys.add(target);
  }
  if (minimumKeys.has("EM")) minimumKeys.add("ENTRAXE");
  if (Number.isFinite(resolved.ADL) && !Object.hasOwn(valeursSaisies, "ADL")) minimumKeys.add("ADL");
  if (Number.isFinite(resolved.LB) && ["simple", "double"].includes(options.vantail)) {
    const relevant = options.vantail === "simple" ? ["MPR", "LB", "LHF", "LREM"] : ["EM", "ENTRAXE", "LRAIL", "LB", "LHF", "LREM"];
    if (!relevant.some(key => Object.hasOwn(valeursSaisies, key))) {
      minimumKeys.add("LB");
      minimumKeys.add("LHF");
    }
  }
  return { values:resolved, conflicts:result.conflicts, minimumKeys, warnings:avertissements(regles, resolved, options) };
}

function avertissements(regles, valeurs, options) {
  const messages = [];
  for (const limite of regles.limites || []) {
    const valeur = valeurs[limite.cote];
    if (!Number.isFinite(valeur)) continue;
    if (limite.minimum != null && valeur < limite.minimum || limite.maximum != null && valeur > limite.maximum) messages.push(limite.message);
  }
  const alertePorte = doorWidthWarning(valeurs.LP, options.materiau);
  if (alertePorte) messages.push(alertePorte);
  return [...new Set(messages)];
}
