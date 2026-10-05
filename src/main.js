import rules from "../data/regles-calcul.json" with { type: "json" };
import { solveRelationGroups, doorWidthWarning } from "./formulas.js";
import { buildCutList } from "./cutlist.js";

const $ = id => document.getElementById(id);
const groups = [
  { title:"Largeurs", keys:["LP","PL","EM","ENTRAXE","ADL","LB","LREM","DPOUTRE","EM1","L1","L2"] },
  { title:"Hauteurs", keys:["H","HP","H1","HSP","SEP","HSB","HVITRE","HREM","HVT43","HPAR","CP_IMPOSTE","PM_IMPOSTE"] }
];
const state = {
  doorMaterial:"aluminium", leaf:"single", infill:"glazed", transom:"none",
  manualValues:{}, manualText:{}, invalidValues:{}, conflicts:[], lastEditedKey:null
};
const numeric = value => {
  const normalized = String(value).trim().replace(",", ".");
  if (!normalized) return null;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : NaN;
};
const format = value => Number.isFinite(value) ? Number(value.toFixed(2)).toString().replace(".", ",") : "—";

function activeRelations() {
  return rules.relations.filter(rule => (!rule.vantail || rule.vantail === state.leaf) && (!rule.imposte || state.transom !== "none"));
}

function renderInputs() {
  $("fields").innerHTML = groups.map(group => `
    <section class="dimension-group" aria-label="${group.title}">
      <h3>${group.title}</h3>
      <div class="fields">${group.keys.map(key => {
        const item = rules.cotes[key];
        return `<label class="field">${item.label}<span class="input-with-unit"><span class="origin-indicator" hidden title="Cote calculée à partir des relations" aria-label="Cote calculée">fx</span><input inputmode="decimal" type="text" data-cote="${key}" placeholder="Saisir cette cote" autocomplete="off"><small>mm</small></span></label>`;
      }).join("")}</div>
    </section>`).join("");
  $("fields").querySelectorAll("input[data-cote]").forEach(input => input.addEventListener("input", () => {
    const key = input.dataset.cote;
    const raw = input.value;
    const value = numeric(raw);
    state.lastEditedKey = key;
    if (value === null) {
      delete state.manualValues[key];
      delete state.manualText[key];
      delete state.invalidValues[key];
    } else if (Number.isFinite(value)) {
      state.manualValues[key] = value;
      state.manualText[key] = raw;
      delete state.invalidValues[key];
    } else {
      delete state.manualValues[key];
      delete state.manualText[key];
      state.invalidValues[key] = raw;
    }
    calculate(input);
  }));
  $("fields").querySelectorAll("input[data-cote]").forEach(input => input.addEventListener("blur", () => calculate()));
}

function relationWarnings(solved) {
  const errors = [];
  for (const condition of rules.conditions) {
    if (!Number.isFinite(solved[condition.code])) continue;
    const value = solved[condition.code];
    if (condition.min != null && value < condition.min || condition.max != null && value > condition.max) errors.push(condition.message);
  }
  const widthWarning = doorWidthWarning(solved.LP, state.doorMaterial);
  if (widthWarning) errors.push(widthWarning);
  return [...new Set(errors)];
}

function renderCoteFields(solved, activeInput) {
  const conflictKeys = new Set(state.conflicts.flatMap(conflict => conflict.givenKeys));
  const affectedKeys = new Set(state.conflicts.flatMap(conflict => [...conflict.vars]));
  document.querySelectorAll("input[data-cote]").forEach(input => {
    const key = input.dataset.cote;
    const indicator = input.parentElement.querySelector(".origin-indicator");
    const isManual = Object.hasOwn(state.manualValues, key);
    const isInvalid = Object.hasOwn(state.invalidValues, key);
    const isConflict = isManual && conflictKeys.has(key);
    const isAffected = !isManual && affectedKeys.has(key);
    const isCalculated = input !== activeInput && !isManual && !isInvalid && Number.isFinite(solved[key]);
    input.classList.toggle("is-invalid", isInvalid);
    input.classList.toggle("is-input-conflict", isConflict);
    input.parentElement.classList.toggle("is-calculated", isCalculated);
    input.parentElement.classList.toggle("has-input-conflict", isConflict);
    input.parentElement.classList.toggle("has-calculation-conflict", isAffected);
    indicator.hidden = !isCalculated;
    if (input === activeInput) return;
    if (isInvalid) input.value = state.invalidValues[key];
    else if (isManual) input.value = state.manualText[key] ?? format(state.manualValues[key]);
    else input.value = isCalculated ? format(solved[key]) : "";
  });
}

function renderCutlist(solved) {
  const rows = buildCutList(rules.debits, { leaf:state.leaf, transom:state.transom !== "none", fixedGlazed:state.infill === "glazed", values:solved });
  const unknown = rows.filter(row => row.missing.length).length;
  const conflictCount = rows.filter(row => {
    const variables = row.longueur ? row.longueur.match(/[A-Za-zÀ-ÿ_][\wÀ-ÿ]*/g) || [] : [];
    return variables.some(key => state.conflicts.some(item => item.vars.has(key)));
  }).length;
  $("cutlist").innerHTML = rows.map(rule => {
    const qText = rule.quantity == null ? "À préciser" : rule.quantity;
    const ruleVars = rule.longueur ? [...new Set(rule.longueur.match(/[A-Za-zÀ-ÿ_][\wÀ-ÿ]*/g) || [])] : [];
    const conflict = ruleVars.some(key => state.conflicts.some(item => item.vars.has(key)));
    const lText = rule.length == null ? "À préciser" : `${format(rule.length)} mm`;
    const status = conflict ? "À vérifier" : rule.missing.length ? `À préciser : ${rule.missing.join(", ")}` : "Calculé";
    return `<tr class="${conflict ? "conflict-row" : rule.missing.length ? "pending" : ""}"><th scope="row">${rule.profil}<small>${rule.note ?? ""}</small></th><td>${qText}</td><td>${lText}</td><td>${status}</td></tr>`;
  }).join("");
  const message = [
    unknown ? `<strong>Liste partielle : ${unknown} ligne(s) restent à préciser.</strong><p>Les lignes incomplètes sont gardées visibles pour repérer les règles ou données qui manquent. Elles ne sont pas remplacées par des hypothèses.</p>` : "",
    conflictCount ? `<p>${conflictCount} ligne(s) de débit sont liées à des cotes saisies en conflit ; les longueurs restent affichées et sont à vérifier.</p>` : "",
    !unknown && !conflictCount ? `<strong>Les profils affichés ont une quantité et une longueur calculées.</strong><p>Contrôlez les cotes et options avant la préparation de la fabrication.</p>` : ""
  ].filter(Boolean).join("");
  const receiverNote = state.leaf === "double" ? "<p>En double vantail, la notice ne prévoit pas de profil de réception.</p>" : "";
  $("cutlist-notice").innerHTML = message + receiverNote;
  const leafLabel = state.leaf === "single" ? "Simple vantail" : "Double vantail";
  const infillLabel = $("infill").selectedOptions[0].textContent;
  const transomLabel = $("transom").selectedOptions[0].textContent;
  const fixedCount = state.leaf === "single" ? 1 : 2;
  const materialLabel = state.doorMaterial === "wood" ? "Porte bois" : "Porte aluminium";
  $("print-summary").textContent = `${materialLabel} · ${leafLabel} · Parties fixes ${infillLabel.toLowerCase()} (${fixedCount}) · ${transomLabel}${state.transom !== "none" ? " · 2 départs mur" : ""}`;
}

function renderFormulas() {
  const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  $("formula-list").innerHTML = rules.relations.map(rule => {
    const variant = rule.imposte ? "Avec imposte" : rule.vantail === "single" ? "Simple vantail" : rule.vantail === "double" ? "Double vantail" : "Hauteurs";
    return `<div><span>${variant}</span><code>${escape(rule.equation)}</code></div>`;
  }).join("") + rules.conditions.map(rule => `<div><span>Limite</span><code>${escape(rule.message)}</code></div>`).join("");
}

function calculate(activeInput = null) {
  const messages = [];
  for (const key of Object.keys(state.invalidValues)) messages.push(`La cote « ${rules.cotes[key].label} » doit être un nombre.`);
  const preferredKey = activeInput?.dataset.cote ?? state.lastEditedKey;
  const result = solveRelationGroups(activeRelations(), state.manualValues, preferredKey);
  state.conflicts = result.conflicts;
  const solved = result.values;
  messages.push(...relationWarnings(solved));
  renderCoteFields(solved, activeInput);
  const validation = $("validation");
  validation.className = `validation${messages.length ? " warning" : ""}`;
  validation.innerHTML = messages.map(message => `<p>${message}</p>`).join("");
  renderCutlist(solved);
}

$("leaf-count").addEventListener("change", event => { state.leaf = event.target.value; calculate(); });
$("door-material").addEventListener("change", event => { state.doorMaterial = event.target.value; calculate(); });
$("infill").addEventListener("change", event => { state.infill = event.target.value; calculate(); });
$("transom").addEventListener("change", event => { state.transom = event.target.value; calculate(); });
$("print").addEventListener("click", () => window.print());
$("reset").addEventListener("click", () => {
  state.manualValues = {};
  state.manualText = {};
  state.invalidValues = {};
  state.lastEditedKey = null;
  state.doorMaterial = "aluminium"; state.leaf = "single"; state.infill = "glazed"; state.transom = "none";
  $("door-material").value = state.doorMaterial;
  $("leaf-count").value = state.leaf; $("infill").value = state.infill; $("transom").value = state.transom;
  renderInputs(); calculate();
});
renderInputs();
renderFormulas();
calculate();

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
let installEvent;
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installEvent = event; $("install").hidden = false; });
$("install").addEventListener("click", async () => { if (installEvent) { await installEvent.prompt(); installEvent = null; $("install").hidden = true; } });
