import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const main = readFileSync(new URL("../src/main.js", import.meta.url), "utf8");
const css = readFileSync(new URL("../styles.css", import.meta.url), "utf8");

test("démarrage de l’interface sans l’ancien champ LPB", () => {
  assert.doesNotMatch(main, /\$\("lpb"\)/);
  assert.match(main, /renderInputs\(\);\s*renderFormulas\(\);\s*calculate\(\);/);
});

test("le titre et les textes d’introduction sont simplifiés", () => {
  assert.match(html, /<h1>Débits porte à galandage<\/h1>/);
  assert.doesNotMatch(html, /Saisissez les dimensions connues|Choisissez la porte et les options du projet|Saisissez une cote dans son champ|Saisissez une ou plusieurs cotes/);
  assert.doesNotMatch(html, /Les débits marqués « à préciser » ne sont pas estimés/);
  assert.doesNotMatch(html, /Cote saisie|Cote calculée|Saisie en conflit/);
});

test("la configuration reste visible et le titre s’aligne sur les cotes", () => {
  assert.match(html, /<div class="app-layout">\s*<header class="hero">/);
  assert.match(html, /<aside class="configuration-sidebar">\s*<section class="panel configuration" aria-label="Configuration">/);
  assert.doesNotMatch(html, /Masquer|id="hide-configuration"|id="show-configuration"/);
  assert.doesNotMatch(main, /configuration-hidden|hide-configuration|show-configuration/);
  assert.match(css, /grid-template-areas: "\. title" "configuration workspace"/);
  assert.match(css, /grid-template-areas: "title" "configuration" "workspace"/);
  assert.doesNotMatch(css, /\.configuration-hidden/);
});

test("les anciens titres numérotés et le titre du panneau de cotes sont supprimés", () => {
  assert.doesNotMatch(html, /<span class="step">|<h2 id="config-title">|<h2 id="dimensions-title">/);
  assert.match(html, /aria-label="Cotes du projet"/);
});

test("les largeurs et les hauteurs sont dans deux panneaux séparés", () => {
  assert.match(main, /<section class="panel dimension-panel" aria-label="\$\{group\.title\}">/);
  assert.match(html, /id="fields" class="dimension-panels"/);
  assert.match(main, /title:"Largeurs"/);
  assert.match(main, /title:"Hauteurs"/);
  assert.doesNotMatch(main, /<h3>\$\{group\.title\}<\/h3>/);
  assert.doesNotMatch(html, /id="horizontal-results"|id="vertical-results"/);
});

test("les libellés correspondent aux noms de cotes validés", () => {
  const rules = JSON.parse(readFileSync(new URL("../data/regles-calcul.json", import.meta.url), "utf8"));
  assert.equal(rules.cotes.EM.label, "Cote intérieure entre montants");
  assert.equal(rules.cotes.ENTRAXE_MIN.label, "Entraxe montants mini");
  assert.equal(rules.cotes.LBmini.label, "Lisse Basse minimum");
  assert.equal(rules.cotes.LB.label, "Lisse Basse");
  assert.equal(rules.cotes.LHF.label, "Lisse Haute partie Fixe");
  assert.equal(rules.cotes.LHP.label, "Lisse Haute côté Passage");
  assert.equal(rules.cotes.LRAIL.label, "Longueur rail");
  assert.equal(rules.cotes.HPAR.label, "Hauteur de parclose de finition");
  assert.equal(rules.cotes.HRF.label, "Hauteur de remplissage partie fixe");
  assert.equal(rules.cotes.HRI.label, "Hauteur de remplissage imposte");
  assert.equal(rules.cotes.DMI.label, "Hauteur du départ mur d’imposte");
  assert.doesNotMatch(main, /"LBmini"/);
  assert.equal(rules.cotes.SEP.label, "Sol / axe rail");
});

test("la liste des débits a son propre panneau et est repliée au chargement", () => {
  assert.match(html, /<section class="panel cutlist-panel" aria-labelledby="cutlist-title">\s*<details id="cutlist-details">/);
  assert.doesNotMatch(html, /<details id="cutlist-details" open/);
  assert.match(html, /id="cutlist-title">Liste des profils à débiter/);
  assert.match(css, /\.cutlist-panel details > summary \{ font-size: 14px; \}/);
  assert.match(html, /id="print"/);
  assert.match(html, /id="cutlist"/);
  assert.doesNotMatch(html, /<span class="step">03<\/span>/);
});

test("l’imposte a seulement un choix présence/absence", () => {
  assert.match(html, /<select id="transom"><option value="none">Toute hauteur<\/option><option value="with">Avec imposte<\/option><\/select>/);
  assert.doesNotMatch(html, /Imposte vitrée|Imposte pleine/);
});

test("les conflits sont indiqués par couleur sans remplacer les valeurs saisies", () => {
  assert.match(main, /has-input-conflict/);
  assert.match(main, /has-calculation-conflict/);
  assert.doesNotMatch(main, /input\.value = "Incohérent"/);
  assert.match(main, /solveRelationGroups\(activeRelations\(\), state\.manualValues, preferredKey\)/);
  assert.match(css, /\.input-with-unit\.has-input-conflict input \{ background: #fce4d6/);
  assert.match(css, /\.input-with-unit\.has-calculation-conflict input \{ background: #fff2cc/);
});

test("la saisie décimale mobile et l’impression de la liste restent disponibles", () => {
  assert.match(main, /inputmode="decimal" enterkeyhint="next"/);
  assert.match(main, /replace\(\/\[\\s\\u00a0\\u202f\]\/g, ""\)\.replace\(",", "\."\)/);
  assert.match(css, /#cutlist-details > :not\(summary\) \{ display: block !important/);
  assert.match(css, /#cutlist-details > \.actions, #cutlist-details > \.cutlist-notice \{ display: none !important/);
  assert.match(css, /\.configuration-sidebar, \.actions, \.validation/);
  assert.match(html, /<th>Profil<\/th><th>Qté<\/th><th>Longueur de débit<\/th><th>Contrôle<\/th>/);
});
