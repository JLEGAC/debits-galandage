import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCutList } from "../src/cutlist.js";

const rules = JSON.parse(readFileSync(new URL("../data/regles-calcul.json", import.meta.url), "utf8"));
const byId = (rows, id) => rows.find(row => row.id === id);

test("débits simple vantail toute hauteur : quantités et longueurs", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"single", transom:false, fixedGlazed:true,
    values:{ HSP:2500, LRAIL:1704, LHF:818, LHP:841, LB:818, HPAR:2163.5 }
  });
  assert.equal(byId(rows,"rail").quantity,1);
  assert.equal(byId(rows,"montant-prepare").quantity,2);
  assert.equal(byId(rows,"montant-renforce").quantity,2);
  assert.equal(byId(rows,"montant-passage").quantity,2);
  assert.equal(byId(rows,"cj-renforce").quantity,2);
  assert.equal(byId(rows,"cj-prepare").quantity,4);
  assert.equal(byId(rows,"couvercle-fixe").quantity,1);
  assert.equal(byId(rows,"couvercle-passage").quantity,1);
  assert.equal(byId(rows,"cj-haut").quantity,2);
  assert.equal(byId(rows,"parclose").quantity,1);
  assert.equal(byId(rows,"profil-reception").quantity,1);
  assert.equal(byId(rows,"lisse-basse-fixe").quantity,1);
  assert.equal(byId(rows,"lisse-basse-fixe").length,818);
  assert.equal(byId(rows,"enjoliveur").quantity,2);
  assert.equal(byId(rows,"cj-haut").length,841);
  assert.equal(rows.some(row=>row.cas==="imposte"),false);
});

test("débits double vantail avec imposte : pièces hautes, parties fixes et départs mur", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"double", transom:true, fixedGlazed:false,
    values:{ HSP:2800, LRAIL:3403, LHF:795.3, LHP:1697, LB:795.3, CJI:342, DMI:370.5 }
  });
  assert.equal(byId(rows,"rail").quantity,1);
  assert.equal(byId(rows,"montant-prepare").quantity,2);
  assert.equal(byId(rows,"montant-passage").quantity,4);
  assert.equal(byId(rows,"cj-renforce").quantity,4);
  assert.equal(byId(rows,"cj-prepare").quantity,4);
  assert.equal(byId(rows,"lisse-haute-fixe").quantity,2);
  assert.equal(byId(rows,"lisse-haute-passage").quantity,1);
  assert.equal(byId(rows,"cj-haut").quantity,2);
  assert.equal(byId(rows,"lisse-basse-fixe").quantity,2);
  assert.equal(byId(rows,"profil-reception"),undefined);
  assert.equal(byId(rows,"couvre-joint-imposte").quantity,2);
  assert.equal(byId(rows,"couvre-joint-imposte").length,342);
  assert.equal(byId(rows,"depart-mur-imposte").quantity,2);
  assert.equal(byId(rows,"depart-mur-imposte").length,370.5);
  assert.equal(byId(rows,"parclose"),undefined);
  assert.equal(byId(rows,"enjoliveur"),undefined);
});

test("quantités vitrées proportionnelles aux parties fixes", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"double", transom:false, fixedGlazed:true,
    values:{ HSP:2800, LRAIL:3403, LHF:795.3, LHP:1697, LB:795.3, HPAR:2388 }
  });
  assert.equal(byId(rows,"couvercle-fixe").quantity,2);
  assert.equal(byId(rows,"couvercle-passage").quantity,1);
  assert.equal(byId(rows,"parclose").quantity,2);
  assert.equal(byId(rows,"enjoliveur").quantity,4);
  assert.equal(byId(rows,"lisse-basse-fixe").quantity,2);
});
