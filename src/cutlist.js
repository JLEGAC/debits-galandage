import { evaluateExpression } from "./formulas.js";

export function buildCutList(debits, { leaf, transom, fixedGlazed = true, values }) {
  const fixedSections = leaf === "single" ? 1 : 2;
  return debits
    .filter(rule => rule.cas === "tous" || rule.cas === "imposte" && transom || rule.cas === "sans-imposte" && !transom || rule.cas === "fixed" || rule.cas === "fixed-glazed" && fixedGlazed)
    .map(rule => {
      let quantity = Number.isFinite(rule.quantite) ? rule.quantite : null;
      if (rule.quantiteRule === "leafPosts") quantity = leaf === "single" ? 2 : 4;
      if (rule.quantiteRule === "leafPostsBothFaces") quantity = (leaf === "single" ? 2 : 4) * 2;
      if (rule.quantiteRule === "fixedPanels") quantity = fixedSections;
      if (rule.quantiteRule === "fixedSectionsBothFaces") quantity = fixedSections * 2;
      const length = rule.longueur ? evaluateExpression(rule.longueur, values) : null;
      const missing = [];
      if (quantity == null) missing.push("quantité");
      if (length == null) missing.push("longueur");
      if (rule.id === "remplissage-fixe") missing.push("profils à identifier");
      return { ...rule, quantity, length, missing: [...new Set(missing)] };
    });
}
