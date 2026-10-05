import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCutList } from "../src/cutlist.js";

const rules = JSON.parse(readFileSync(new URL("../data/regles-calcul.json", import.meta.url), "utf8"));
const byId = (rows, id) => rows.find(row => row.id === id);

test("liste simple vantail : poutre, montants, couvre-joints et parclose", () => {
  const rows = buildCutList(rules.debits, {
    leaf:"single", transom:false, fixedGlazed:true,
    values:{ HSP:2500, DPOUTRE:1704, L1:791, L2:841, HPAR:2163 }
  });
  assert.equal(byId(rows,"poutre").quantity,1);
  assert.equal(byId(rows,"montant-prepare").quantity,2);
  assert.equal(byId(rows,"montant-renforce").quantity,2);
  assert.equal(byId(rows,"montant-passage").quantity,2);
  assert.equal(byId(rows,"cj-passage").quantity,2);
  assert.equal(byId(rows,"cj-prepare").quantity,4);
  assert.equal(byId(rows,"parclose").quantity,1);
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
  assert.equal(byId(rows,"cj-passage").quantity,4);
  assert.equal(byId(rows,"cj-prepare").quantity,4);
  assert.equal(byId(rows,"lisse2").quantity,2);
  assert.equal(byId(rows,"cj-mur-imposte").quantity,2);
  assert.equal(byId(rows,"profil-mur-imposte").quantity,2);
  assert.equal(byId(rows,"remplissage-fixe").quantity,null);
  assert.equal(rows.some(row=>row.id==="parclose"),false);
});
