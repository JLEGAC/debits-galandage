import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCutList } from "../src/cutlist.js";

const rules = JSON.parse(readFileSync(new URL("../data/regles-calcul.json", import.meta.url), "utf8"));
const byId = (rows, id) => rows.find(row => row.id === id);

test("liste simple vantail toute hauteur : profils et quantités corrigés", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"single", transom:false, fixedGlazed:true,
    values:{ HSP:2500, DPOUTRE:1704, L1:791, L2:841, LBF:791, HPAR:2163 }
  });
  assert.equal(byId(rows,"poutre").quantity,1);
  assert.equal(byId(rows,"montant-prepare").quantity,2);
  assert.equal(byId(rows,"montant-renforce").quantity,2);
  assert.equal(byId(rows,"montant-passage").quantity,2);
  assert.equal(rows.some(row=>row.id==="cj-passage"),false);
  assert.equal(byId(rows,"cj-renforce").quantity,2);
  assert.equal(byId(rows,"cj-prepare").quantity,4);
  assert.equal(byId(rows,"cj-lisse1").quantity,1);
  assert.equal(byId(rows,"cj-lisse2").quantity,1);
  assert.equal(byId(rows,"cj-haut").quantity,2);
  assert.equal(byId(rows,"parclose").quantity,1);
  assert.equal(byId(rows,"profil-reception").quantity,1);
  assert.equal(byId(rows,"lisse-basse-fixe").quantity,1);
  assert.equal(byId(rows,"lisse-basse-fixe").length,791);
  assert.equal(byId(rows,"enjoliveur").quantity,2);
  assert.equal(byId(rows,"cj-haut").length,841);
  assert.equal(rows.some(row=>row.id==="profil-mur-imposte"),false);
});

test("liste double vantail avec imposte : deux parties fixes et deux départs mur", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"double", transom:true, fixedGlazed:false,
    values:{ HSP:2800, DPOUTRE:3403, L1:795.3, L2:1697, CP_IMPOSTE:2606, PM_IMPOSTE:2670.5 }
  });
  assert.equal(byId(rows,"poutre").quantity,1);
  assert.equal(byId(rows,"montant-prepare").quantity,2);
  assert.equal(byId(rows,"montant-passage").quantity,4);
  assert.equal(rows.some(row=>row.id==="cj-passage"),false);
  assert.equal(byId(rows,"cj-renforce").quantity,4);
  assert.equal(byId(rows,"cj-prepare").quantity,4);
  assert.equal(byId(rows,"lisse1").quantity,2);
  assert.equal(byId(rows,"lisse2").quantity,1);
  assert.equal(byId(rows,"cj-haut").quantity,2);
  assert.equal(byId(rows,"lisse-basse-fixe").quantity,2);
  assert.equal(rows.some(row=>row.id==="profil-reception"),false);
  assert.equal(byId(rows,"cj-mur-imposte").quantity,2);
  assert.equal(byId(rows,"cj-mur-imposte").length,2606);
  assert.equal(byId(rows,"profil-mur-imposte").quantity,2);
  assert.equal(byId(rows,"profil-mur-imposte").length,2670.5);
  assert.equal(rows.some(row=>row.id==="parclose"),false);
  assert.equal(rows.some(row=>row.id==="enjoliveur"),false);
});

test("liste double vantail avec parties fixes vitrées : quantités par partie", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"double", transom:false, fixedGlazed:true,
    values:{ HSP:2800, DPOUTRE:3403, L1:795.3, L2:1697, LBF:795.3, HPAR:2163 }
  });
  assert.equal(byId(rows,"cj-lisse1").quantity,2);
  assert.equal(byId(rows,"cj-lisse2").quantity,1);
  assert.equal(byId(rows,"cj-haut").quantity,2);
  assert.equal(byId(rows,"parclose").quantity,2);
  assert.equal(byId(rows,"enjoliveur").quantity,4);
  assert.equal(byId(rows,"lisse-basse-fixe").quantity,2);
});
