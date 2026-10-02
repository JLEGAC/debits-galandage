import test from "node:test";
import assert from "node:assert/strict";
import { solveRelations } from "../src/formulas.js";

const relations=[{equation:"A = B + 100"},{equation:"C = 2 * B"}];

test("propage les valeurs depuis B",()=>{
  const got=solveRelations(relations,{B:400});
  assert.equal(got.A,500);assert.equal(got.C,800);
});
test("retrouve les valeurs depuis A",()=>{
  const got=solveRelations(relations,{A:500});assert.equal(got.B,400);assert.equal(got.C,800);
});
test("rejette des cotes client incompatibles",()=>{
  assert.throws(()=>solveRelations(relations,{A:500,B:401}),/incompatibles/);
});
test("refuse une relation non linéaire",()=>{
  assert.throws(()=>solveRelations([{equation:"A = B * C"}],{A:12}),/non linéaire/);
});
