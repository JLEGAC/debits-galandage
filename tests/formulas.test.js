import test from "node:test";
import assert from "node:assert/strict";
import { solveRelations, solveRelationGroups, doorWidthWarning } from "../src/formulas.js";
import rules from "../data/regles-calcul.json" with { type: "json" };

const relations = ({ leaf = "single", transom = false, material = "aluminium", infill = "glazed" } = {}) => rules.relations.filter(rule =>
  (!rule.vantail || rule.vantail === leaf) &&
  (rule.transom === undefined || rule.transom === transom) &&
  (!rule.material || rule.material === material) &&
  (!rule.infill || rule.infill === infill)
);

test("les anciennes cotes ambiguës sont remplacées par les identifiants validés", () => {
  for (const key of ["H", "H1", "HSB", "EM1", "HVT43", "CP_IMPOSTE", "PM_IMPOSTE", "DPOUTRE", "L1", "L2", "LBF"]) {
    assert.equal(Object.hasOwn(rules.cotes, key), false, `${key} ne doit plus être une cote`);
  }
  for (const key of ["HSP", "SEP", "HSR", "MPR", "LBmini", "LB", "LHF", "LHP", "HRF", "CJI", "DMI", "LRAIL"]) {
    assert.ok(rules.cotes[key], `${key} doit être déclaré`);
  }
});

test("calcule les largeurs en simple vantail, y compris depuis MPR", () => {
  const got = solveRelations(relations({ leaf: "single" }), { LP: 900, MPR: 1727 });
  assert.equal(got.PL, 776);
  assert.equal(got.EM, 1727);
  assert.equal(got.ENTRAXE_MIN, 1763);
  assert.equal(got.ADL, 1803);
  assert.equal(got.LBmini, 795);
  assert.equal(got.LB, 818);
  assert.equal(got.LHF, 818);
  assert.equal(got.LHP, 841);
  assert.equal(got.LREM, 837);
  assert.equal(got.LRAIL, 1704);
});

test("calcule les largeurs en double vantail", () => {
  const got = solveRelations(relations({ leaf: "double" }), { LP: 900 });
  assert.equal(got.PL, 1553);
  assert.equal(got.EM, 3423);
  assert.equal(got.ENTRAXE_MIN, 3459);
  assert.equal(got.ADL, 3499);
  assert.equal(got.LBmini, 795);
  assert.equal(got.LB, 795.3);
  assert.equal(got.LHF, 795.3);
  assert.equal(got.LHP, 1697);
  assert.equal(got.LREM, 814.3);
  assert.equal(got.LRAIL, 3403);
});

test("hauteurs toute hauteur se relient à HSP, SEP, HSR et à la hauteur de porte", () => {
  const wood = solveRelations(relations({ transom: false, material: "wood" }), { HSP: 2800 });
  assert.equal(wood.SEP, 2775.5);
  assert.equal(wood.HSR, 2739.5);
  assert.equal(wood.HP, 2720.5);
  assert.equal(wood.HPAR, 2763.5);
  assert.equal(wood.HRF, 2747);
  assert.equal(wood.HP, 2800 - 79.5);

  const aluminium = solveRelations(relations({ transom: false, material: "aluminium" }), { HSP: 2800 });
  assert.equal(aluminium.HP, 2715.5);
  assert.equal(aluminium.HP, 2800 - 84.5);
});

test("hauteurs avec imposte utilisent SEP comme référence de hauteur de porte", () => {
  const wood = solveRelations(relations({ transom: true, material: "wood", infill: "glazed" }), { HSP: 2800, SEP: 2400 });
  assert.equal(wood.HP, 2345);
  assert.equal(wood.HSR, 2364);
  assert.equal(wood.HRF, 2747);
  assert.equal(wood.HRI, 368);
  assert.equal(wood.CJI, 342);
  assert.equal(wood.DMI, 370.5);
  assert.equal(wood.HPAR, 2388);

  const solid = solveRelations(relations({ transom: true, material: "aluminium", infill: "solid" }), { HSP: 2800, SEP: 2400 });
  assert.equal(solid.HP, 2340);
  assert.equal(solid.HRI, 376);
});

test("retrouve SEP et les autres cotes à partir de HSR", () => {
  const got = solveRelations(relations({ transom: true, material: "aluminium" }), { HSP: 2800, HSR: 2364 });
  assert.equal(got.SEP, 2400);
  assert.equal(got.HP, 2340);
  assert.equal(got.CJI, 342);
  assert.equal(got.DMI, 370.5);
});

test("applique les limites de largeur suivant le matériau de porte", () => {
  assert.equal(doorWidthWarning(1230, "wood"), null);
  assert.match(doorWidthWarning(1231, "wood"), /bois.*1\D*230/);
  assert.equal(doorWidthWarning(1300, "aluminium"), null);
  assert.match(doorWidthWarning(1301, "aluminium"), /aluminium.*1\D*300/);
  assert.match(doorWidthWarning(679, "aluminium"), /au moins 680/);
});

test("signale les cotes de largeur saisies incompatibles avec les formules", () => {
  const got = solveRelationGroups(relations({ leaf: "single" }), { LP: 900, PL: 777 });
  assert.equal(got.conflicts.length, 1);
  assert.deepEqual(got.conflicts[0].givenKeys.sort(), ["LP", "PL"]);
  assert.ok(got.conflicts[0].vars.has("LB"));
});

test("résout les relations linéaires dans les deux sens sans eval", () => {
  assert.equal(solveRelations([{ equation: "A = B - 10" }], { A: 15 }).B, 25);
  assert.throws(() => solveRelations([{ equation: "A = B * C" }], { A: 12 }), /non linéaire/);
});
