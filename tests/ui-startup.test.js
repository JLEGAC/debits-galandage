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

test("la configuration occupe une barre latérale et devient repliable sur petit écran", () => {
  assert.match(html, /<aside class="configuration-sidebar">/);
  assert.match(html, /<details id="configuration-drawer" class="configuration-drawer">/);
  assert.match(css, /grid-template-columns: minmax\(225px, 270px\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.configuration-drawer > summary \{ display: flex/);
});

test("les largeurs et les hauteurs sont dans deux panneaux séparés", () => {
  assert.match(main, /<section class="panel dimension-panel" aria-label="\$\{group\.title\}">/);
  assert.match(html, /id="fields" class="dimension-panels"/);
  assert.match(main, /title:"Largeurs"/);
  assert.match(main, /title:"Hauteurs"/);
  assert.doesNotMatch(html, /id="horizontal-results"|id="vertical-results"/);
});

test("la liste des débits a son propre panneau et est repliée au chargement", () => {
  assert.match(html, /<section class="panel cutlist-panel" aria-labelledby="cutlist-title">\s*<details id="cutlist-details">/);
  assert.doesNotMatch(html, /<details id="cutlist-details" open/);
  assert.match(html, /id="cutlist-title">Liste des profils à débiter/);
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
