import test from "node:test";
import assert from "node:assert/strict";
import { solveRelations } from "../src/formulas.js";
import { buildCutList } from "../src/cutlist.js";

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
test("calcule toutes les relations de largeur en double vantail",()=>{
  const got=solveRelations([
    {equation:"PL = 2 * LP - 247"},{equation:"EM = 4 * LP - 177"},
    {equation:"ENTRAXE = 4 * LP - 141"},{equation:"ADL = 4 * LP - 101"},
    {equation:"LB = LP - 105"},{equation:"LREM = LB + 19"},
    {equation:"DDV = EM"},{equation:"DPOUTRE = EM - 20"},
    {equation:"L1 = DDV / 2 - LP - 16.2"},{equation:"L2 = 2 * LP - 103"}
  ],{LP:900});
  assert.equal(got.PL,1553);assert.equal(got.EM,3423);assert.equal(got.ENTRAXE,3459);
  assert.equal(got.LB,795);assert.equal(got.LREM,814);assert.equal(got.DPOUTRE,3403);
  assert.equal(got.L1,795.3);assert.equal(got.L2,1697);
});
test("résout les relations de hauteur et les deux formules de départ mur",()=>{
  const got=solveRelations([
    {equation:"H1 - 60 = H - 85"},{equation:"HSB = H1 - 36"},
    {equation:"HPAR = HSB + 24"},{equation:"HVITRE = HSP - 53"},
    {equation:"CP = HSP - HP - 94"},{equation:"PM = HSP - HP - 29.5"}
  ],{H:2200,HSP:2800,HP:100});
  assert.equal(got.H1,2175);assert.equal(got.HSB,2139);assert.equal(got.HPAR,2163);
  assert.equal(got.HVITRE,2747);assert.equal(got.CP,2606);assert.equal(got.PM,2670.5);
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
