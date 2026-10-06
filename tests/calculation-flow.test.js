import test from "node:test";
import assert from "node:assert/strict";
import rules from "../data/regles-calcul.json" with { type:"json" };
import { calculerProjet } from "../src/calculation.js";
import { buildCutList } from "../src/cutlist.js";

test("simple vantail toute hauteur calcule largeurs, hauteurs et liste de débits",()=>{
  const options={vantail:"simple",imposte:"sans",materiau:"bois",remplissage:"vitré"};
  const result=calculerProjet(rules,options,{LP:900,HSP:2500});
  const rows=buildCutList(rules.debits,{leaf:options.vantail,transom:false,fixedGlazed:true,values:result.values});
  assert.equal(result.values.HP,2420.5); assert.equal(result.values.LB,795);
  assert.equal(rows.every(row=>row.missing.length===0),true);
  assert.ok(rows.some(row=>row.id==="couvercle-fixe"));
  assert.equal(rows.some(row=>row.id==="lisse-haute-fixe"),false);
});

test("double vantail avec imposte utilise les règles de matériau et de remplissage plein",()=>{
  const options={vantail:"double",imposte:"avec",materiau:"aluminium",remplissage:"plein"};
  const result=calculerProjet(rules,options,{LP:700,HSP:2800,SEP:2400});
  const rows=buildCutList(rules.debits,{leaf:options.vantail,transom:true,fixedGlazed:false,values:result.values});
  assert.equal(result.values.HP,2340); assert.equal(result.values.HRI,376);
  assert.equal(rows.every(row=>row.missing.length===0),true);
  assert.equal(rows.find(row=>row.id==="lisse-haute-fixe").quantity,2);
  assert.equal(rows.find(row=>row.id==="depart-mur-imposte").quantity,2);
  assert.equal(rows.some(row=>row.id==="parclose"),false);
});

test("chaque relation précise son contexte d’imposte et les règles communes restent actives dans les deux cas",()=>{
  assert.ok(rules.relations.every(rule=>["avec", "sans", "tous"].includes(rule.imposte)));
  const common = rules.relations.filter(rule=>rule.imposte==="tous");
  for (const imposte of ["avec", "sans"]) {
    const result=calculerProjet(rules,{vantail:"simple",imposte,materiau:"bois",remplissage:"vitré"},{LP:900,HSP:2500});
    assert.equal(result.values.LHP,841);
    assert.equal(result.values.LB,795);
  }
  assert.ok(common.some(rule=>rule.id==="lhp-simple"));
  assert.ok(common.some(rule=>rule.id==="lhf-mpr"));
});
