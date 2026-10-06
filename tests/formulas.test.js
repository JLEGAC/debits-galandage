import test from "node:test";
import assert from "node:assert/strict";
import rules from "../data/regles-calcul.json" with { type:"json" };
import { solveRelations, solveRelationGroups, doorWidthWarning, applyMinimumDimensions } from "../src/formulas.js";
import { calculerProjet } from "../src/calculation.js";

const options=({vantail="simple",imposte="sans",materiau="aluminium",remplissage="vitré"}={})=>({vantail,imposte,materiau,remplissage});
test("les identifiants et libellés validés sont déclarés en français",()=>{
  for(const key of ["HSP","SEP","HSR","MPR","LBmini","LB","LHF","LHP","HRF","CJI","DMI","LRAIL","ENTRAXE"]) assert.ok(rules.libelles[key]);
  for(const key of ["H","H1","HSB","EM1","HVT43","CP_IMPOSTE","PM_IMPOSTE","DPOUTRE","L1","L2","LBF","ENTRAXE_MIN"]) assert.equal(Object.hasOwn(rules.libelles,key),false);
  assert.equal(rules.libelles.EM,"Cote intérieure entre montants");
  assert.equal(rules.libelles.ENTRAXE,"Entraxe montants");
});
test("cotes minimales et relations de largeur se calculent en simple vantail",()=>{
  const got=calculerProjet(rules,options(),{LP:900}).values;
  assert.equal(got.PL,776); assert.equal(got.EM,1727); assert.equal(got.ENTRAXE,1763);
  assert.equal(got.ADL,1803); assert.equal(got.LBmini,795); assert.equal(got.MPR,1704);
  assert.equal(got.LB,795); assert.equal(got.LHF,795); assert.equal(got.LREM,814);
  assert.equal(got.LHP,841); assert.equal(got.LRAIL,1704);
});
test("une cote MPR saisie remplace les formules minimales et ajuste les longueurs",()=>{
  const got=calculerProjet(rules,options(),{LP:900,MPR:1727}).values;
  assert.equal(got.LB,818); assert.equal(got.LHF,818); assert.equal(got.LREM,837);
});
test("EM personnalisé adapte le rail et les lisses sans conflit avec le minimum",()=>{
  const result=calculerProjet(rules,options({vantail:"double"}),{LP:900,EM:3500},"EM");
  assert.equal(result.conflicts.length,0); assert.equal(result.values.LRAIL,3480);
  assert.equal(result.values.ENTRAXE,3536); assert.equal(result.values.LB,833.8);
  assert.equal(result.values.LHF,833.8); assert.equal(result.values.LREM,852.8);
});
test("une hauteur sous plafond relie SEP et hauteur de porte sans imposte",()=>{
  const got=calculerProjet(rules,options({materiau:"bois"}),{HSP:2800}).values;
  assert.equal(got.SEP,2775.5); assert.equal(got.HSR,2739.5); assert.equal(got.HP,2720.5);
  assert.equal(got.HRF,2747.2); assert.equal(got.HPAR,2763.5);
});
test("les relations de hauteur avec imposte sont conditionnées au remplissage",()=>{
  const glazed=calculerProjet(rules,options({imposte:"avec"}),{HSP:2800,SEP:2400}).values;
  assert.equal(glazed.HP,2340); assert.equal(glazed.HRI,368); assert.equal(glazed.CJI,342); assert.equal(glazed.DMI,370.5);
  const solid=calculerProjet(rules,options({imposte:"avec",remplissage:"plein"}),{HSP:2800,SEP:2400}).values;
  assert.equal(solid.HRI,376); assert.equal(solid.HRF,2749.7);
});
test("les cotes saisies incompatibles sont conservées et signalées",()=>{
  const result=calculerProjet(rules,options(),{LP:900,PL:777},"PL");
  assert.equal(result.conflicts.length,1); assert.deepEqual(result.conflicts[0].givenKeys.sort(),["LP","PL"]);
  assert.equal(result.values.LP,900); assert.equal(result.values.PL,777);
});
test("limites de porte selon le matériau et résolution linéaire bidirectionnelle",()=>{
  assert.equal(doorWidthWarning(1230,"bois"),null); assert.match(doorWidthWarning(1231,"bois"),/bois.*1\s*230/);
  assert.equal(doorWidthWarning(1300,"aluminium"),null); assert.match(doorWidthWarning(1301,"aluminium"),/aluminium.*1\s*300/);
  assert.equal(solveRelations([{equation:"A = B - 10"}],{A:15}).B,25);
  assert.throws(()=>solveRelations([{equation:"A = B * C"}],{A:12}),/non linéaire/);
  assert.equal(applyMinimumDimensions({LBmini:795},{LP:900},"simple").LB,795);
});
