import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import rules from "../data/regles-calcul.json" with { type:"json" };
import { validateConfiguration, makeExportConfiguration, clone } from "../src/configuration.js";

const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const main=readFileSync(new URL("../src/main.js",import.meta.url),"utf8");
const css=readFileSync(new URL("../styles.css",import.meta.url),"utf8");

test("le démarrage relie les champs, calculs, débits et stockage local",()=>{
  assert.match(main,/calculerProjet\(config\.regles,currentOptions\(\),state\.manualValues/);
  assert.match(main,/buildCutList\(config\.regles\.debits/);
  assert.match(main,/saveLocalConfiguration/); assert.match(main,/initializeSettingsEditor/);
});
test("les champs montrent origine calculée et cote mini sans remplacer leur valeur",()=>{
  assert.match(main,/origin-indicator/); assert.match(main,/minimum-indicator/);
  assert.match(main,/has-input-conflict/); assert.match(main,/has-calculation-conflict/);
  assert.match(main,/input\.value=Number\.isFinite\(value\)\?formatNumber\(value\):""/);
  assert.match(html,/id="fields" class="dimension-panels"/);
});
test("l’interface reste responsive et conserve les sections attendues",()=>{
  assert.match(html,/class="configuration-sidebar"/); assert.match(html,/id="cutlist-details"/);
  assert.match(html,/id="editor-dialog"/); assert.match(html,/id="import-file"/);
  assert.match(css,/\.dimension-panels \{ display: grid; grid-template-columns: repeat\(2/);
  assert.match(css,/@media \(max-width: 620px\)/);
});
test("les libellés et équations d’origine valident et s’exportent",()=>{
  const config={titre:rules.titre,regles:clone(rules)};
  const checked=validateConfiguration(makeExportConfiguration(config),rules);
  assert.equal(checked.regles.libelles.EM,"Cote intérieure entre montants");
  assert.equal(checked.regles.relations.find(item=>item.id==="mpr-min").equation,"MPR = 2 * LP - 96");
  assert.throws(()=>validateConfiguration({...makeExportConfiguration(config),titre:""},rules),/titre/);
  const nonlinear=makeExportConfiguration(config); nonlinear.regles.relations[0].equation="PL = LP * MPR";
  assert.throws(()=>validateConfiguration(nonlinear,rules),/syntaxe/);
});
