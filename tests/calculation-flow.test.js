import test from "node:test";
import assert from "node:assert/strict";
import rules from "../data/regles-calcul.json" with { type: "json" };
import { solveRelations } from "../src/formulas.js";
import { buildCutList } from "../src/cutlist.js";

function calculate({ leaf, transom, material, infill, givens }) {
  const active = rules.relations.filter(rule =>
    (!rule.vantail || rule.vantail === leaf) &&
    (rule.transom === undefined || rule.transom === transom) &&
    (!rule.material || rule.material === material) &&
    (!rule.infill || rule.infill === infill)
  );
  const values = solveRelations(active, givens);
  const debits = buildCutList(rules.debits, { leaf, transom, fixedGlazed:infill === "glazed", values });
  return { values, debits };
}

test("simple vantail toute hauteur donne les débits documentés avec des cotes complètes", () => {
  const { values, debits } = calculate({
    leaf:"single", transom:false, material:"wood", infill:"glazed",
    givens:{ LP:900, MPR:1727, HSP:2500 }
  });
  assert.equal(values.HP, 2420.5);
  assert.equal(values.LB, 818);
  assert.equal(debits.every(row => row.missing.length === 0), true);
  assert.equal(debits.some(row => row.id === "couvercle-fixe"), true);
  assert.equal(debits.some(row => row.id === "lisse-haute-fixe"), false);
});

test("double vantail avec imposte adapte les formules au matériau et au remplissage plein", () => {
  const { values, debits } = calculate({
    leaf:"double", transom:true, material:"aluminium", infill:"solid",
    givens:{ LP:700, HSP:2800, SEP:2400 }
  });
  assert.equal(values.HP, 2340);
  assert.equal(values.HRI, 376);
  assert.equal(debits.every(row => row.missing.length === 0), true);
  assert.equal(debits.find(row => row.id === "lisse-haute-fixe").quantity, 2);
  assert.equal(debits.find(row => row.id === "depart-mur-imposte").quantity, 2);
  assert.equal(debits.some(row => row.id === "couvercle-fixe"), false);
});
