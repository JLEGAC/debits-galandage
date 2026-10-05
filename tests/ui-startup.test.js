import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

test("démarrage sans référence à l'ancien champ LPB supprimé", () => {
  assert.doesNotMatch(main, /\$\("lpb"\)/);
  assert.match(main, /renderInputs\(\);\s*renderFormulas\(\);\s*calculate\(\);/);
});

test("toutes les cotes sont dépliées et les résultats restent dans la section 02", () => {
  assert.doesNotMatch(main, /<details class="dimension-group"/);
  assert.doesNotMatch(html, /id="results-title"/);
  const projectSection = html.slice(html.indexOf('aria-labelledby="dimensions-title"'), html.indexOf('aria-labelledby="cutlist-title"'));
  assert.match(projectSection, /id="fields"/);
  assert.match(projectSection, /id="horizontal-results"/);
  assert.match(projectSection, /id="vertical-results"/);
  assert.match(html, /<span class="step">03<\/span><div><h2 id="cutlist-title">/);
});

test("l'imposte a seulement un choix présence/absence", () => {
  assert.match(html, /<select id="transom"><option value="none">Sans imposte<\/option><option value="with">Avec imposte<\/option><\/select>/);
  assert.doesNotMatch(html, /Imposte vitrée|Imposte pleine/);
});
