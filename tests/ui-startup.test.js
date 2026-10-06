import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");

test("démarrage sans référence à l'ancien champ LPB supprimé", () => {
  assert.doesNotMatch(main, /\$\("lpb"\)/);
  assert.match(main, /renderInputs\(\);\s*renderFormulas\(\);\s*calculate\(\);/);
});

test("cotes saisies, cotes calculées et liste de débit sont dans un espace unique", () => {
  assert.doesNotMatch(main, /<details class="dimension-group"/);
  assert.doesNotMatch(html, /id="horizontal-results"|id="vertical-results"/);
  assert.match(main, /addEventListener\("input"/);
  assert.match(main, /manualValues/);
  assert.match(main, /origin-indicator/);
  const projectSection = html.slice(html.indexOf('aria-labelledby="dimensions-title"'), html.indexOf('aria-labelledby="formula-title"'));
  assert.match(projectSection, /id="fields"/);
  assert.match(projectSection, /id="cutlist"/);
  assert.match(projectSection, /id="cutlist-title"/);
  assert.doesNotMatch(projectSection, /aria-labelledby="cutlist-title"/);
  assert.doesNotMatch(html, /<span class="step">03<\/span>/);
});

test("l'imposte a seulement un choix présence/absence", () => {
  assert.match(html, /<select id="transom"><option value="none">Toute hauteur<\/option><option value="with">Avec imposte<\/option><\/select>/);
  assert.doesNotMatch(html, /Imposte vitrée|Imposte pleine/);
});

test("les conflits sont indiqués par couleur sans remplacer les valeurs saisies par un libellé",()=>{
  assert.match(main,/has-input-conflict/);
  assert.match(main,/has-calculation-conflict/);
  assert.doesNotMatch(main,/input\.value = "Incohérent"/);
  assert.match(main,/solveRelationGroups\(activeRelations\(\), state\.manualValues, preferredKey\)/);
});

test("les couleurs de conflit distinguent les saisies des résultats affectés",()=>{
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css,/has-input-conflict input\{background:#fce4d6/);
  assert.match(css,/has-calculation-conflict input\{background:#fff2cc/);
});

test("la configuration s'adapte à la largeur et la légende décrit les états",()=>{
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(css,/configuration \.option-grid\{grid-template-columns:repeat\(auto-fit/);
  assert.match(html,/aria-label="Légende des états des cotes"/);
  assert.match(html,/Saisie en conflit/);
  assert.match(html,/Calcul affecté/);
});

test("la saisie mobile propose un clavier décimal et l'impression se concentre sur les débits",()=>{
  const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");
  assert.match(main,/inputmode="decimal" enterkeyhint="next"/);
  assert.match(main,/replace\(\/\[\\s\\u00a0\\u202f\]\/g, ""\)\.replace\(",", "\."\)/);
  assert.match(css,/#fields\{display:none!important\}/);
  assert.match(css,/\.configuration[^}]+display:none!important/);
  assert.match(html,/<th>Profil<\/th><th>Qté<\/th><th>Longueur de débit<\/th><th>Contrôle<\/th>/);
});
