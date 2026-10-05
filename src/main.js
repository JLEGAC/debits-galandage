import rules from "../data/regles-calcul.json" with { type: "json" };
import { solveRelations } from "./formulas.js";

const labels=rules.cotes;
const $=id=>document.getElementById(id);
const state={leaf:"single",infill:"glazed",transom:"none",values:{}};
const numeric=(value)=>value.trim()===""?null:Number(value.replace(",","."));

function activeRelations(){return rules.relations.filter(r=>r.vantail===state.leaf&&(!r.remplissage||r.remplissage===state.infill));}
function renderInputs(){
  $("fields").innerHTML=Object.entries(labels).map(([key,item])=>`<label class="field">${item.label}<input inputmode="decimal" type="text" data-cote="${key}" value="${state.values[key]??""}" placeholder="Saisir une cote"><small>mm</small></label>`).join("");
  $("fields").querySelectorAll("input").forEach(input=>input.addEventListener("input",()=>{const n=numeric(input.value);delete state.values[input.dataset.cote];if(Number.isFinite(n))state.values[input.dataset.cote]=n;calculate()}));
}
function calculate(){
  const validation=$("validation");validation.className="validation";validation.textContent="";
  let solved={};try{solved=solveRelations(activeRelations(),state.values)}catch(error){validation.classList.add("error");validation.textContent=error.message}
  $("results-grid").innerHTML=Object.entries(labels).map(([key,item])=>{const v=solved[key];const display=Number.isFinite(v)?`${Number(v.toFixed(2))} <small>mm</small>`:"—";return `<div class="result-card"><span>${item.label}</span><strong>${display}</strong></div>`}).join("");
  const warnings=rules.alertes[state.leaf]||[];if(warnings.length){validation.textContent+=(validation.textContent?" ":"")+warnings.join(" ");}
}
$("leaf-count").addEventListener("change",e=>{state.leaf=e.target.value;calculate()});
$("infill").addEventListener("change",e=>{state.infill=e.target.value;calculate()});
$("transom").addEventListener("change",e=>{state.transom=e.target.value;calculate()});
$("print").addEventListener("click",()=>window.print());
$("reset").addEventListener("click",()=>{state.values={};renderInputs();calculate()});
renderInputs();calculate();

if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./service-worker.js").catch(()=>{}));
let installEvent;window.addEventListener("beforeinstallprompt",event=>{event.preventDefault();installEvent=event;$("install").hidden=false});
$("install").addEventListener("click",async()=>{if(installEvent){await installEvent.prompt();installEvent=null;$("install").hidden=true}});
