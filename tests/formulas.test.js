import test from "node:test";
import assert from "node:assert/strict";
import { solveRelations, solveRelationGroups, doorWidthWarning } from "../src/formulas.js";
import { buildCutList } from "../src/cutlist.js";
import rules from "../data/regles-calcul.json" with { type: "json" };

const simple=[
  {equation:"PL = LP - 124"},{equation:"EM = 2 * LP - 73"},
  {equation:"ENTRAXE = 2 * LP - 37"},{equation:"ADL = 2 * LP + 3"},
  {equation:"LB = LP - 105"}
];

test("propage les cotes depuis la largeur de porte",()=>{
  const got=solveRelations(simple,{LP:900});
  assert.equal(got.PL,776);assert.equal(got.EM,1727);assert.equal(got.ENTRAXE,1763);assert.equal(got.ADL,1803);assert.equal(got.LB,795);
});
test("retrouve la largeur de porte depuis le passage libre",()=>{
  const got=solveRelations(simple,{PL:776});assert.equal(got.LP,900);assert.equal(got.EM,1727);
});
test("utilise EM1 pour le simple vantail et EM pour le double vantail",()=>{
  const simpleCut=solveRelations([
    {equation:"EM = 2 * LP - 73"},
    {equation:"L1 = EM1 - LP - 9"},
    {equation:"L2 = LP - 59"}
  ],{LP:900,EM1:1200});
  assert.equal(simpleCut.EM,1727);assert.equal(simpleCut.L1,291);assert.equal(simpleCut.L2,841);
  const doubleCut=solveRelations([
    {equation:"EM = 4 * LP - 177"},
    {equation:"L1 = EM / 2 - LP - 16.2"},
    {equation:"L2 = 2 * LP - 103"}
  ],{LP:900});
  assert.equal(doubleCut.EM,3423);assert.equal(doubleCut.L1,795.3);assert.equal(doubleCut.L2,1697);
});
test("calcule toutes les relations de largeur en double vantail",()=>{
  const got=solveRelations([
    {equation:"PL = 2 * LP - 247"},{equation:"EM = 4 * LP - 177"},
    {equation:"ENTRAXE = 4 * LP - 141"},{equation:"ADL = 4 * LP - 101"},
    {equation:"LB = LP - 105"},{equation:"LREM = LB + 19"},
    {equation:"DPOUTRE = EM - 20"},
    {equation:"L1 = EM / 2 - LP - 16.2"},{equation:"L2 = 2 * LP - 103"}
  ],{LP:900});
  assert.equal(got.PL,1553);assert.equal(got.EM,3423);assert.equal(got.ENTRAXE,3459);
  assert.equal(got.LB,795);assert.equal(got.LREM,814);assert.equal(got.DPOUTRE,3403);
  assert.equal(got.L1,795.3);assert.equal(got.L2,1697);
});
test("résout les relations de hauteur et les deux formules de départ mur",()=>{
  const got=solveRelations([
    {equation:"H1 - 60 = H - 85"},{equation:"HSB = H1 - 36"},
    {equation:"HPAR = HSB + 24"},{equation:"HVITRE = HSP - 53"},
    {equation:"CP = HSP - SEP - 20 - 38"},{equation:"PM = HSP - SEP - 18 - 11.5"}
  ],{H:2200,HSP:2800,SEP:100});
  assert.equal(got.H1,2175);assert.equal(got.HSB,2139);assert.equal(got.HPAR,2163);
  assert.equal(got.HVITRE,2747);assert.equal(got.CP,2642);assert.equal(got.PM,2670.5);
});
test("relie HP à H et résout les hauteurs dans les deux sens entre l'axe et le dessous de poutre",()=>{
  const vertical = rules.relations.filter(rule => !rule.vantail);
  const fromAxis = solveRelations(vertical,{HSP:2800,SEP:100});
  assert.equal(fromAxis.HSB,82);
  assert.equal(fromAxis.HPAR,106);
  assert.equal(fromAxis.CP_IMPOSTE,2642);
  assert.equal(fromAxis.PM_IMPOSTE,2670.5);
  const fromUnderside = solveRelations(vertical,{HSP:2800,HSB:82});
  assert.equal(fromUnderside.SEP,100);
  assert.equal(fromUnderside.HPAR,106);
  assert.equal(fromUnderside.CP_IMPOSTE,2642);
  assert.equal(fromUnderside.PM_IMPOSTE,2670.5);
  const fromDoorHeight = solveRelations(vertical,{H:2200});
  assert.equal(fromDoorHeight.HP,2200);
  assert.equal(fromDoorHeight.H1,2175);
  assert.equal(rules.cotes.HP.label,"Hauteur de porte (HP)");
});
test("applique la limite de largeur selon le matériau de la porte",()=>{
  assert.equal(doorWidthWarning(1230,"wood"),null);
  assert.match(doorWidthWarning(1231,"wood"),/bois.*1 230|bois.*1 230/);
  assert.equal(doorWidthWarning(1300,"aluminium"),null);
  assert.match(doorWidthWarning(1301,"aluminium"),/aluminium.*1 300|aluminium.*1 300/);
  assert.match(doorWidthWarning(679,"aluminium"),/au moins 680/);
});
test("quantités de montants, couvre-joints et parties fixes suivent le vantail",()=>{
  const rules=[
    {id:"renforce",quantiteRule:"leafPosts",longueur:"HSP",cas:"tous"},
    {id:"passage",quantiteRule:"leafPosts",longueur:"HSP",cas:"tous"},
    {id:"cj-renforce",quantiteRule:"leafPostsBothFaces",longueur:"HSP",cas:"tous"},
    {id:"mur",quantite:2,longueur:"HSP",cas:"imposte"},
    {id:"fixed",quantiteRule:"fixedPanels",longueur:"HSP",cas:"fixed"},
    {id:"fixed-cj",quantiteRule:"fixedSectionsBothFaces",longueur:"HSP",cas:"fixed"},
    {id:"parclose",quantiteRule:"fixedPanels",longueur:"HSP",cas:"fixed-glazed"}
  ];
  const simpleCuts=buildCutList(rules,{leaf:"single",transom:true,fixedGlazed:true,values:{HSP:2500}});
  assert.deepEqual(simpleCuts.map(row=>row.quantity),[2,2,4,2,1,2,1]);
  const doubleCuts=buildCutList(rules,{leaf:"double",transom:false,fixedGlazed:false,values:{HSP:2500}});
  assert.deepEqual(doubleCuts.map(row=>row.quantity),[4,4,8,2,4]);
  const solidCuts=buildCutList(rules,{leaf:"single",transom:false,fixedGlazed:false,values:{HSP:2500}});
  assert.equal(solidCuts.some(row=>row.id==="parclose"),false);
});
test("rejette des cotes client incompatibles",()=>{
  assert.throws(()=>solveRelations(simple,{LP:900,PL:777}),/incompatibles/);
});
test("refuse une relation non linéaire",()=>{
  assert.throws(()=>solveRelations([{equation:"A = B * C"}],{A:12}),/non linéaire/);
});

test("isole les conflits et conserve le calcul des autres groupes",()=>{
  const relations=[...simple,{equation:"HSB = SEP - 18"},{equation:"HPAR = HSB + 24"}];
  const result=solveRelationGroups(relations,{LP:900,PL:777,SEP:100});
  assert.equal(result.values.HSB,82);
  assert.equal(result.values.HPAR,106);
  assert.equal(result.values.LP,900);
  assert.equal(result.conflicts.length,1);
  assert.deepEqual(result.conflicts[0].givenKeys.sort(),["LP","PL"]);
  assert.ok(result.conflicts[0].vars.has("LB"));
});

test("conserve des résultats calculés visibles en prenant la dernière cote modifiée comme référence",()=>{
  const result=solveRelationGroups(simple,{LP:900,PL:777},"PL");
  assert.equal(result.values.LP,901);
  assert.equal(result.values.EM,1729);
  assert.equal(result.values.LB,796);
  assert.equal(result.conflicts[0].givenKeys.length,2);
});
