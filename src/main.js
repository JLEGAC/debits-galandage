import rules from "../data/regles-calcul.json" with { type: "json" };
import { solveRelations } from "./formulas.js";
import { buildCutList } from "./cutlist.js";

const $ = id => document.getElementById(id);
const groups = [
  { title:"Largeurs", keys:["LP","PL","EM","ENTRAXE","ADL","LB","LREM","DPOUTRE"] },
  { title:"Distances et coupes horizontales", keys:["EM1","DSV","DDV","L1","L2"] },
  { title:"Hauteurs", keys:["H","H1","HSP","HP","HSB","HVITRE","HREM","HVT43","HPAR","CP_IMPOSTE","PM_IMPOSTE"] }
];
const state = { leaf:"single", infill:"glazed", transom:"none", values:{} };
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
  $("fields").innerHTML = groups.map((group, index) => `
    <details class="dimension-group" ${index === 0 ? "open" : ""}>
      <summary>${group.title}</summary>
      <div class="fields">${group.keys.map(key => {
        const item = rules.cotes[key];
        return `<label class="field">${item.label}<span class="input-with-unit"><input inputmode="decimal" type="text" data-cote="${key}" value="${state.values[key] ?? ""}" placeholder="Saisir ou calculer"><small>mm</small></span></label>`;
      }).join("")}</div>
    </details>`).join("");
  $("fields").querySelectorAll("input[data-cote]").forEach(input => input.addEventListener("input", () => {
    const value = numeric(input.value);
    if (value === null) delete state.values[input.dataset.cote];
    else if (Number.isFinite(value)) state.values[input.dataset.cote] = value;
    else delete state.values[input.dataset.cote];
    calculate();
  }));
}

function relationWarnings(solved) {
  const errors = [];
  for (const condition of rules.conditions) {
    if (!Number.isFinite(solved[condition.code])) continue;
    const value = solved[condition.code];
    if (condition.min != null && value < condition.min || condition.max != null && value > condition.max) errors.push(condition.message);
  }
  const rawLPB = numeric($("lpb").value);
  if (Number.isNaN(rawLPB)) errors.push("La largeur de porte bois LPB doit être un nombre.");
  if (Number.isFinite(rawLPB) && rawLPB > 1230) errors.push("La largeur de porte bois LPB ne doit pas dépasser 1 230 mm.");
  return [...new Set(errors)];
}

function renderValues(target, keys, solved) {
  $(target).innerHTML = keys.map(key => {
    const item = rules.cotes[key];
    const value = solved[key];
    return `<div class="result-card"><span>${item.label}</span><strong>${format(value)} <small>${Number.isFinite(value) ? "mm" : ""}</small></strong></div>`;
  }).join("");
}

function renderCutlist(solved) {
  const rows = buildCutList(rules.debits, { leaf:state.leaf, transom:state.transom !== "none", fixedGlazed:state.infill === "glazed", values:solved });
  const unknown = rows.filter(row => row.missing.length).length;
  $("cutlist").innerHTML = rows.map(rule => {
    const qText = rule.quantity == null ? "À préciser" : rule.quantity;
    const lText = rule.length == null ? "À préciser" : `${format(rule.length)} mm`;
    const status = rule.missing.length ? `À préciser : ${rule.missing.join(", ")}` : "Calculé";
    return `<tr class="${rule.missing.length ? "pending" : ""}"><th scope="row">${rule.profil}<small>${rule.note ?? ""}</small></th><td>${qText}</td><td>${lText}</td><td>${status}</td></tr>`;
  }).join("");
  const message = unknown
    ? `<strong>Liste partielle : ${unknown} ligne(s) restent à préciser.</strong><p>Les lignes incomplètes sont gardées visibles pour repérer les règles ou données qui manquent. Elles ne sont pas remplacées par des hypothèses.</p>`
    : `<strong>Les profils affichés ont une quantité et une longueur calculées.</strong><p>Contrôlez les cotes et options avant la préparation de la fabrication.</p>`;
  $("cutlist-notice").innerHTML = message;
  const leafLabel = state.leaf === "single" ? "Simple vantail" : "Double vantail";
  const infillLabel = $("infill").selectedOptions[0].textContent;
  const transomLabel = $("transom").selectedOptions[0].textContent;
  const lpb = numeric($("lpb").value);
  const fixedCount = state.leaf === "single" ? 1 : 2;
  $("print-summary").textContent = `${leafLabel} · Parties fixes ${infillLabel.toLowerCase()} (${fixedCount}) · ${transomLabel}${state.transom !== "none" ? " · 2 départs mur avec imposte" : ""}${Number.isFinite(lpb) ? ` · LPB ${format(lpb)} mm` : ""}`;
}

function renderFormulas() {
  const escape = value => String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  $("formula-list").innerHTML = rules.relations.map(rule => {
    const variant = rule.imposte ? "Avec imposte" : rule.vantail === "single" ? "Simple vantail" : rule.vantail === "double" ? "Double vantail" : "Hauteurs";
    return `<div><span>${variant}</span><code>${escape(rule.equation)}</code></div>`;
  }).join("") + rules.conditions.map(rule => `<div><span>Limite</span><code>${escape(rule.message)}</code></div>`).join("");
}

function calculate() {
  const messages = [];
  const invalidField = [...document.querySelectorAll("input[data-cote]")].find(input => Number.isNaN(numeric(input.value)));
  if (invalidField) messages.push(`La cote « ${rules.cotes[invalidField.dataset.cote].label} » doit être un nombre.`);
  let solved = {};
  try { solved = solveRelations(activeRelations(), state.values); }
  catch (error) { messages.push(error.message); }
  messages.push(...relationWarnings(solved));
  const validation = $("validation");
  validation.className = `validation${messages.length ? " warning" : ""}`;
  validation.innerHTML = messages.map(message => `<p>${message}</p>`).join("");
  const horizontal = ["LP","PL","EM","ENTRAXE","ADL","LB","LREM","DSV","DDV","DPOUTRE"];
  const vertical = ["H","H1","HSP","HP","HSB","HVITRE","HREM","HVT43","HPAR"];
  horizontal.push("L1","L2");
  if (state.transom !== "none") vertical.push("CP_IMPOSTE","PM_IMPOSTE");
  renderValues("horizontal-results", horizontal, solved);
  renderValues("vertical-results", vertical, solved);
  renderCutlist(solved);
}

$("leaf-count").addEventListener("change", event => { state.leaf = event.target.value; calculate(); });
$("infill").addEventListener("change", event => { state.infill = event.target.value; calculate(); });
$("transom").addEventListener("change", event => { state.transom = event.target.value; calculate(); });
$("lpb").addEventListener("input", calculate);
$("print").addEventListener("click", () => window.print());
$("reset").addEventListener("click", () => {
  state.values = {};
  state.leaf = "single"; state.infill = "glazed"; state.transom = "none";
  $("leaf-count").value = state.leaf; $("infill").value = state.infill; $("transom").value = state.transom;
  $("lpb").value = "";
  renderInputs(); calculate();
});
renderInputs();
renderFormulas();
calculate();

if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
let installEvent;
window.addEventListener("beforeinstallprompt", event => { event.preventDefault(); installEvent = event; $("install").hidden = false; });
$("install").addEventListener("click", async () => { if (installEvent) { await installEvent.prompt(); installEvent = null; $("install").hidden = true; } });
