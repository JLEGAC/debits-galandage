import { evaluateExpression } from "./formulas.js";

export function buildCutList(debits, { leaf, transom, fixedGlazed = true, values }) {
  const fixedSections = leaf === "simple" || leaf === "single" ? 1 : 2;
  return debits
    .filter(rule => rule.cas === "tous" || rule.cas === "imposte" && transom || rule.cas === "sans-imposte" && !transom || rule.cas === "simple" && (leaf === "simple" || leaf === "single") || rule.cas === "partie-fixe" || rule.cas === "partie-fixe-vitree" && fixedGlazed)
    .map(rule => {
      let quantity = Number.isFinite(rule.quantite) ? rule.quantite : null;
      if (rule.regleQuantite === "montantsParVantail") quantity = fixedSections * 2;
      if (rule.regleQuantite === "lissesParVantail") quantity = fixedSections;
      if (rule.regleQuantite === "partiesFixes") quantity = fixedSections;
      if (rule.regleQuantite === "facesPartiesFixes") quantity = fixedSections * 2;
      const length = rule.longueur ? evaluateExpression(rule.longueur, values) : null;
      const missing = [];
      if (quantity == null) missing.push("quantité");
      if (length == null) missing.push("longueur");
      return { ...rule, quantity, length, missing: [...new Set(missing)] };
    });
}
