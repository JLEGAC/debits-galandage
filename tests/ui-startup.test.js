import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

test("démarrage sans référence à l'ancien champ LPB supprimé", () => {
  assert.doesNotMatch(main, /\$\("lpb"\)/);
  assert.match(main, /renderInputs\(\);\s*renderFormulas\(\);\s*calculate\(\);/);
});

test("l'imposte a seulement un choix présence/absence", () => {
  assert.match(html, /<select id="transom"><option value="none">Sans imposte<\/option><option value="with">Avec imposte<\/option><\/select>/);
  assert.doesNotMatch(html, /Imposte vitrée|Imposte pleine/);
});
