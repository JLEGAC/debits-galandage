import test from "node:test";
import assert from "node:assert/strict";
import { solveRelations } from "../src/formulas.js";

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
test("rejette des cotes client incompatibles",()=>{
  assert.throws(()=>solveRelations(simple,{LP:900,PL:777}),/incompatibles/);
});
test("refuse une relation non linéaire",()=>{
  assert.throws(()=>solveRelations([{equation:"A = B * C"}],{A:12}),/non linéaire/);
});
