import { makeExportConfiguration, validateConfiguration, clone } from "./configuration.js";
import { solveRelations } from "./formulas.js";

const $ = id => document.getElementById(id);
const escapeHtml = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
const selectOptions = {
  vantail:[["", "Tous"], ["simple", "Simple"], ["double", "Double"]],
  imposte:[["tous", "Avec ou sans imposte"], ["sans", "Toute hauteur"], ["avec", "Avec imposte"]],
  materiau:[["", "Tous matériaux"], ["bois", "Bois"], ["aluminium", "Aluminium"]],
  remplissage:[["", "Tous remplissages"], ["vitré", "Vitré"], ["plein", "Plein"]]
};
const conditionLabels = { vantail:"Vantail", imposte:"Imposte", materiau:"Matériau", remplissage:"Remplissage" };
const extractVariables = expression => [...new Set((expression.match(/[A-Za-zÀ-ÿ_][\wÀ-ÿ]*/g) || []).filter(token => token !== "x"))];
const normalizeNumber = value => {
  const normalized = String(value).trim().replace(/[\s\u00a0\u202f]/g, "").replace(",", ".");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
};

function conditionSelect(key, value, relationId) {
  const options = selectOptions[key].map(([option, label]) => `<option value="${option}" ${option === (value || "") ? "selected" : ""}>${label}</option>`).join("");
  return `<label>${conditionLabels[key]}<select data-condition="${key}" data-rule="${escapeHtml(relationId)}">${options}</select></label>`;
}

function conditionSummary(rule) {
  const parts = [];
  if (rule.vantail) parts.push(rule.vantail === "simple" ? "Simple vantail" : "Double vantail");
  if (rule.imposte) parts.push(rule.imposte === "tous" ? "Avec ou sans imposte" : rule.imposte === "avec" ? "Avec imposte" : "Toute hauteur");
  if (rule.materiau) parts.push(rule.materiau === "bois" ? "Bois" : "Aluminium");
  if (rule.remplissage) parts.push(rule.remplissage === "vitré" ? "Vitré" : "Plein");
  return parts.length ? parts.join(" · ") : "Tous les cas";
}

function formulaCard(rule, libelles) {
  const resultName = rule.equation.split("=")[0].trim();
  const usages = rule.utilisations ? `<p class="rule-usage"><strong>Utilisation :</strong> avec imposte, ${escapeHtml(rule.utilisations.avec)} ; sans imposte, ${escapeHtml(rule.utilisations.sans)}.</p>` : "";
  return `<details class="rule-card"><summary><span>${escapeHtml(libelles[resultName] || resultName)}</span><code>${escapeHtml(conditionSummary(rule))}</code></summary>
    <div class="rule-card-content"><div class="rule-conditions">${Object.keys(selectOptions).map(key => conditionSelect(key, rule[key], rule.id)).join("")}</div>
    ${usages}
    <label class="equation-label">Relation<input class="equation-input" type="text" data-equation="${escapeHtml(rule.id)}" value="${escapeHtml(rule.equation)}" autocomplete="off" spellcheck="false"></label>
    <label class="minimum-rule"><input type="checkbox" data-minimum="${escapeHtml(rule.id)}" ${rule.minimum ? "checked" : ""}> Cette relation définit une cote minimale</label>
    </div></details>`;
}

function renderRuleGroup(title, rules, libelles) {
  return `<details class="editor-group"><summary>${title} <small>${rules.length} relations</small></summary><div class="editor-rule-list">${rules.map(rule => formulaCard(rule, libelles)).join("")}</div></details>`;
}

function renderEquationEditor(regles) {
  const widthKeys = new Set(["LP", "PL", "EM", "ENTRAXE", "ADL", "LBmini", "LB", "LREM", "MPR", "LHF", "LHP", "LRAIL"]);
  const horizontal = [], vertical = [];
  for (const rule of regles.relations) {
    const vars = extractVariables(rule.equation);
    (vars.some(key => widthKeys.has(key)) ? horizontal : vertical).push(rule);
  }
  return renderRuleGroup("Largeurs", horizontal, regles.libelles) + renderRuleGroup("Hauteurs", vertical, regles.libelles);
}

function renderDimensionLabels(regles) {
  return Object.entries(regles.libelles).map(([key, label]) => `<label>${escapeHtml(key)}<input type="text" data-label="${escapeHtml(key)}" value="${escapeHtml(label)}" maxlength="100"></label>`).join("");
}

function renderProfileLabels(regles) {
  return regles.debits.map(rule => `<label>${escapeHtml(rule.id)}<input type="text" data-profile="${escapeHtml(rule.id)}" value="${escapeHtml(rule.profil)}" maxlength="100"></label>`).join("");
}

function renderRuleTester(regles) {
  const options = regles.relations.map(rule => `<option value="${escapeHtml(rule.id)}">${escapeHtml(rule.equation)} · ${escapeHtml(conditionSummary(rule))}</option>`).join("");
  return `<label>Relation à tester<select id="rule-test-select">${options}</select></label><div id="rule-test-fields" class="rule-test-fields"></div><button id="test-equation" class="button secondary" type="button">Tester la relation</button><div id="rule-test-result" class="editor-feedback" role="status" aria-live="polite"></div>`;
}

function collectConfiguration(current) {
  const next = clone(current);
  next.titre = $("editor-title").value;
  for (const input of document.querySelectorAll("[data-label]")) next.regles.libelles[input.dataset.label] = input.value;
  for (const input of document.querySelectorAll("[data-profile]")) {
    const profile = next.regles.debits.find(item => item.id === input.dataset.profile);
    if (profile) profile.profil = input.value;
  }
  for (const input of document.querySelectorAll("[data-equation]")) {
    const rule = next.regles.relations.find(item => item.id === input.dataset.equation);
    if (rule) rule.equation = input.value.trim();
  }
  for (const select of document.querySelectorAll("[data-condition]")) {
    const rule = next.regles.relations.find(item => item.id === select.dataset.rule);
    if (!rule) continue;
    if (select.value) rule[select.dataset.condition] = select.value;
    else delete rule[select.dataset.condition];
  }
  for (const checkbox of document.querySelectorAll("[data-minimum]")) {
    const rule = next.regles.relations.find(item => item.id === checkbox.dataset.minimum);
    if (rule) rule.minimum = checkbox.checked;
  }
  return next;
}

function drawTestFields(regles) {
  const selected = regles.relations.find(rule => rule.id === $("rule-test-select").value) || regles.relations[0];
  const vars = extractVariables(selected.equation);
  $("rule-test-fields").innerHTML = vars.map(key => `<label>${escapeHtml(regles.libelles[key] || key)}<input type="text" inputmode="decimal" data-test-value="${escapeHtml(key)}" placeholder="Laisser vide pour calculer" autocomplete="off"></label>`).join("");
  $("rule-test-result").textContent = "";
}

function runRelationTest(regles) {
  const rule = regles.relations.find(item => item.id === $("rule-test-select").value);
  const givens = {};
  for (const input of document.querySelectorAll("[data-test-value]")) {
    const value = normalizeNumber(input.value);
    if (value === null) continue;
    if (!Number.isFinite(value)) throw Error(`Valeur invalide pour ${input.dataset.testValue}.`);
    givens[input.dataset.testValue] = value;
  }
  const values = solveRelations([{ equation:rule.equation }], givens);
  const calculated = Object.entries(values).filter(([key]) => !Object.hasOwn(givens, key));
  if (!calculated.length) throw Error("Saisis au moins une cote connue et laisse une cote à calculer.");
  $("rule-test-result").textContent = calculated.map(([key, value]) => `${regles.libelles[key] || key} = ${Number(value.toFixed(2))} mm`).join(" · ");
}

export function initializeSettingsEditor({ getConfig, getDefaults, onApply, onRestore, isCustomized }) {
  const dialog = $("editor-dialog");
  $("open-editor").addEventListener("click", () => {
    const current = getConfig();
    $("editor-title").value = current.titre;
    $("dimension-label-editor").innerHTML = renderDimensionLabels(current.regles);
    $("profile-label-editor").innerHTML = renderProfileLabels(current.regles);
    $("equation-editor").innerHTML = renderEquationEditor(current.regles);
    $("relation-tester").innerHTML = renderRuleTester(current.regles);
    $("editor-status").textContent = isCustomized() ? "Configuration personnalisée enregistrée sur cet appareil." : "Configuration d’origine.";
    $("editor-feedback").textContent = "";
    dialog.showModal();
    drawTestFields(current.regles);
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
    if (event.target.id === "test-equation") {
      try {
        const candidate = collectConfiguration(getConfig());
        const checked = validateConfiguration(makeExportConfiguration(candidate), getDefaults().regles);
        runRelationTest(checked.regles);
      } catch (error) { $("rule-test-result").textContent = error.message; }
    }
  });
  dialog.addEventListener("change", event => {
    if (event.target.matches("[data-condition]")) {
      const card = event.target.closest(".rule-card");
      const selected = Object.fromEntries([...card.querySelectorAll("[data-condition]")].filter(item => item.value).map(item => [item.dataset.condition, item.value]));
      const target = card.querySelector("summary code");
      target.textContent = conditionSummary(selected);
    }
    if (event.target.id === "rule-test-select") drawTestFields(getConfig().regles);
  });

  $("save-editor").addEventListener("click", async () => {
    try {
      const candidate = collectConfiguration(getConfig());
      const checked = validateConfiguration(makeExportConfiguration(candidate), getDefaults().regles);
      await onApply(checked);
      $("editor-feedback").className = "editor-feedback success";
      $("editor-feedback").textContent = "Configuration enregistrée sur cet appareil.";
      $("editor-status").textContent = "Configuration personnalisée enregistrée sur cet appareil.";
    } catch (error) {
      $("editor-feedback").className = "editor-feedback error";
      $("editor-feedback").textContent = error.message;
    }
  });

  $("export-editor").addEventListener("click", () => {
    try {
      const candidate = validateConfiguration(makeExportConfiguration(collectConfiguration(getConfig())), getDefaults().regles);
      const blob = new Blob([JSON.stringify(makeExportConfiguration(candidate), null, 2)], { type:"application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "configuration-debits.json";
      link.click();
      URL.revokeObjectURL(link.href);
      $("editor-feedback").className = "editor-feedback success";
      $("editor-feedback").textContent = "Fichier de configuration exporté.";
    } catch (error) {
      $("editor-feedback").className = "editor-feedback error";
      $("editor-feedback").textContent = error.message;
    }
  });

  $("import-editor").addEventListener("click", () => $("import-file").click());
  $("import-file").addEventListener("change", async event => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const candidate = validateConfiguration(JSON.parse(await file.text()), getDefaults().regles);
      await onApply(candidate);
      dialog.close();
    } catch (error) {
      $("editor-feedback").className = "editor-feedback error";
      $("editor-feedback").textContent = `Import impossible : ${error.message}`;
    } finally { event.target.value = ""; }
  });

  $("restore-editor").addEventListener("click", async () => {
    if (!window.confirm("Restaurer le titre et les règles d’origine sur cet appareil ?")) return;
    await onRestore();
    dialog.close();
  });
  $("close-editor").addEventListener("click", () => dialog.close());
  $("close-editor-bottom").addEventListener("click", () => dialog.close());
}
