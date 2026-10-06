import defaults from "../data/regles-calcul.json" with { type: "json" };
import { calculerProjet } from "./calculation.js";
import { buildCutList } from "./cutlist.js";
import { initializeSettingsEditor } from "./settings-editor.js";
import { loadLocalConfiguration, saveLocalConfiguration, removeLocalConfiguration } from "./settings-store.js";
import { validateConfiguration, makeExportConfiguration, clone } from "./configuration.js";

const $ = id => document.getElementById(id);
const state = { material:"aluminium", leaf:"simple", infill:"vitré", transom:"sans", manualValues:{}, preferredKey:null, deferredInstall:null };
let config = { titre:defaults.titre, regles:clone(defaults) };
const fieldGroups = [
  { title:"Largeurs", keys:["LP","PL","EM","ENTRAXE","ADL","LBmini","LB","LREM","MPR","LHF","LHP","LRAIL"] },
  { title:"Hauteurs", keys:["HSP","SEP","HSR","HP","HRF","HRI","HPAR","CJI","DMI"] }
];
const escapeHtml = value => String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
const normalizeNumber = value => { const text=String(value).trim().replace(/[\s\u00a0\u202f]/g, "").replace(",", "."); if (!text) return null; const valueNumber = Number(text); return Number.isFinite(valueNumber) ? valueNumber : NaN; };
const formatNumber = value => Number.isInteger(value) ? String(value) : String(Number(value.toFixed(2))).replace(".",",");
const measureText = (()=>{const canvas=document.createElement("canvas");return value=>{const input=document.querySelector(".input-with-unit input");const context=canvas.getContext("2d");if(!input||!context)return String(value).length*8;context.font=getComputedStyle(input).font;return context.measureText(String(value)).width;};})();

function currentOptions() { return { materiau:state.material, vantail:state.leaf, remplissage:state.infill, imposte:state.transom }; }
function visibleKeys() {
  return Object.keys(config.regles.libelles).filter(key => key !== "MPR" || config.regles.visibiliteCotes?.MPR?.vantail !== "simple" || state.leaf === "simple");
}
function renderInputs() {
  const available = new Set(visibleKeys());
  $("fields").innerHTML = fieldGroups.map(group => {
    const keys = group.keys.filter(key => available.has(key));
    return `<section class="panel dimension-panel" aria-label="${escapeHtml(group.title)}"><div class="fields">${keys.map(key => `<label class="field" for="dimension-${key}"><span>${escapeHtml(config.regles.libelles[key])}</span><span class="input-with-unit" data-wrap="${key}"><span class="origin-indicator" data-origin="${key}" hidden>fx</span><input id="dimension-${key}" data-key="${key}" inputmode="decimal" enterkeyhint="next" autocomplete="off"><small class="minimum-indicator" data-minimum="${key}" hidden>(mini)</small><small class="unit">mm</small></span></label>`).join("")}</div></section>`;
  }).join("");
  $("fields").querySelectorAll("input[data-key]").forEach(input => input.addEventListener("input", () => {
    const key=input.dataset.key, number=normalizeNumber(input.value);
    if(number === null) delete state.manualValues[key]; else if(Number.isFinite(number)) state.manualValues[key]=number;
    state.preferredKey=key; calculate();
  }));
}
function calculate() {
  const result=calculerProjet(config.regles,currentOptions(),state.manualValues,state.preferredKey);
  const visible = new Set(visibleKeys());
  const conflicts = result.conflicts.flatMap(item => item.givenKeys);
  for (const key of Object.keys(config.regles.libelles)) {
    const input=document.querySelector(`[data-key="${key}"]`); if(!input)continue;
    const value=result.values[key];
    if(!Object.hasOwn(state.manualValues,key)) input.value=Number.isFinite(value)?formatNumber(value):"";
    const wrap=document.querySelector(`[data-wrap="${key}"]`);
    const calculated=Number.isFinite(value)&&!Object.hasOwn(state.manualValues,key);
    wrap.classList.toggle("is-calculated",calculated);
    wrap.classList.toggle("has-input-conflict",conflicts.includes(key));
    const affected=result.conflicts.some(item=>item.vars.has(key));
    wrap.classList.toggle("has-calculation-conflict",affected&&!conflicts.includes(key));
    const origin=document.querySelector(`[data-origin="${key}"]`); if(origin)origin.hidden=!calculated;
    const mini=document.querySelector(`[data-minimum="${key}"]`); if(mini) mini.hidden=!result.minimumKeys.has(key)||!calculated;
    if(mini&&!mini.hidden) mini.style.left=`${Math.ceil(40+measureText(input.value))}px`;
    input.setAttribute("aria-invalid",String(conflicts.includes(key)||affected));
  }
  const warnings=[...result.warnings];
  $("validation").innerHTML=[...result.conflicts.map(()=>"<p>Des cotes saisies sont incompatibles avec les relations sélectionnées.</p>"),...warnings.map(message=>`<p>${escapeHtml(message)}</p>`)].join("");
  renderCutlist(result.values,result.conflicts.length>0);
  return result;
}
function renderCutlist(values, hasConflict) {
  const rows=buildCutList(config.regles.debits,{leaf:state.leaf,transom:state.transom==="avec",fixedGlazed:state.infill==="vitré",values});
  $("cutlist").innerHTML=rows.map(row=>`<tr class="${row.missing.length?"pending":""} ${hasConflict?"conflict-row":""}"><th scope="row">${escapeHtml(row.profil)}${row.note?`<small>${escapeHtml(row.note)}</small>`:""}</th><td>${row.quantity??"—"}</td><td>${row.length==null?"—":`${formatNumber(row.length)} mm`}</td><td>${row.missing.length?`À préciser : ${row.missing.join(", ")}`:hasConflict?"À vérifier":"Prêt"}</td></tr>`).join("");
  $("cutlist-notice").innerHTML=rows.some(row=>row.missing.length)?"<strong>Formules ou quantités à compléter</strong><p>Certains profils restent sans longueur calculable avec les cotes saisies.</p>":"";
  $("print-summary").textContent=`${state.leaf==="simple"?"Simple vantail":"Double vantail"} · ${state.transom==="avec"?"Avec imposte":"Toute hauteur"} · Porte ${state.material} · Parties fixes ${state.infill}`;
}
function renderFormulas() {
  $("formula-list").innerHTML=config.regles.relations.map(rule=>`<div><span>${escapeHtml(rule.id)}</span><code>${escapeHtml(rule.equation)}</code></div>`).join("");
  $("relation-notes").textContent=`Relations et limites — ${config.regles.limites.map(item=>item.message).join(" ")}`;
}
function render() { document.title=config.titre; $("app-title").textContent=config.titre; renderInputs(); renderFormulas(); calculate(); }
function refreshConfiguration() {
  state.material=$("door-material").value; state.leaf=$("leaf-count").value; state.infill=$("infill").value; state.transom=$("transom").value;
  const visible=new Set(visibleKeys());
  for(const key of Object.keys(state.manualValues)) if(!visible.has(key)) delete state.manualValues[key];
  renderInputs(); calculate();
}
function clearDimensions() { state.manualValues={}; state.preferredKey=null; renderInputs(); calculate(); }
function syncEditorStatus(customized) { $("open-editor").setAttribute("aria-label",customized?"Personnalisation enregistrée":"Personnaliser l’outil"); }

initializeSettingsEditor({
  getConfig:()=>config,
  getDefaults:()=>({ titre:defaults.titre,regles:clone(defaults) }),
  isCustomized:()=>Boolean(window.localStorage.getItem("preparation-debits-customized")),
  onApply:async next=>{ config=next; await saveLocalConfiguration(makeExportConfiguration(config)); localStorage.setItem("preparation-debits-customized","1"); syncEditorStatus(true); render(); },
  onRestore:async()=>{ await removeLocalConfiguration(); localStorage.removeItem("preparation-debits-customized"); config={titre:defaults.titre,regles:clone(defaults)}; syncEditorStatus(false); render(); }
});

for(const id of ["door-material","leaf-count","infill","transom"]) $(id).addEventListener("change",refreshConfiguration);
$("reset").addEventListener("click",clearDimensions);
$("print").addEventListener("click",()=>{ const details=$("cutlist-details"); details.open=true; window.print(); });
window.addEventListener("afterprint",()=>{ $("cutlist-details").open=false; });
window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();state.deferredInstall=event;$("install").hidden=false;});
$("install").addEventListener("click",async()=>{if(!state.deferredInstall)return;state.deferredInstall.prompt();await state.deferredInstall.userChoice;state.deferredInstall=null;$("install").hidden=true;});
if("serviceWorker" in navigator) window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));

try {
  const saved=await loadLocalConfiguration();
  if(saved) { config=validateConfiguration(saved,{...clone(defaults)}); localStorage.setItem("preparation-debits-customized","1"); syncEditorStatus(true); }
} catch { await removeLocalConfiguration(); }
syncEditorStatus(Boolean(localStorage.getItem("preparation-debits-customized")));
render();
