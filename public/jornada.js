/* =========================
   Jornada Essencial – fluxo básico
   ========================= */

const STATE_KEY = "jornada_state_v1";
const loadState = () => { try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}"); } catch { return {}; } };
const saveState = (s) => localStorage.setItem(STATE_KEY, JSON.stringify(s));
const clearState = () => localStorage.removeItem(STATE_KEY);

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

let current = 1;
let totalSteps = 1;

document.addEventListener("DOMContentLoaded", () => {
  const st = loadState();
  const steps = $$("#steps .step");
  totalSteps = steps.length;

  if (!st.started) showIntro();
  else { current = st.current || 1; showWizard(); focusStep(current); }

  $("#btn-iniciar")?.addEventListener("click", startJourney);
  $("#btn-prev")?.addEventListener("click", prevStep);
  $("#btn-next")?.addEventListener("click", nextStep);
  $("#btn-review")?.addEventListener("click", goReview);
  $("#btn-clear-all")?.addEventListener("click", clearAll);
  $("#btn-voltar-wizard")?.addEventListener("click", () => { showWizard(); focusStep(current); });
  $("#btn-finalizar")?.addEventListener("click", () => { saveState({ ...loadState(), finished:true }); showFinal(); });
  $("#btn-baixar-tudo")?.addEventListener("click", baixarTudo);

  restoreInputsFromState();
  focusStep(current);
});

/* ======= Views ======= */
function showIntro(){ toggle("intro"); }
function showWizard(){ toggle("wizard"); }
function showReview(){ toggle("review"); }
function showFinal(){ toggle("final"); }
function toggle(id){
  ["intro","wizard","review","final"].forEach(s => $( "#" + s )?.setAttribute("hidden","hidden"));
  $("#" + id)?.removeAttribute("hidden");
}

/* ======= Fluxo ======= */
function startJourney(){ saveState({started:true,current:1}); current=1; showWizard(); focusStep(current); }
function focusStep(n){ 
  $$("#steps .step").forEach((el,i)=> el.hidden = (i+1)!==n );
  saveState({...loadState(), current:n});
}
function prevStep(){ if(current>1) current--; focusStep(current); window.scrollTo({top:0,behavior:"smooth"}); }
function nextStep(){ if(current<totalSteps) current++; else return goReview(); focusStep(current); window.scrollTo({top:0,behavior:"smooth"}); }
function goReview(){ persistInputs(); mountReview(); showReview(); }

/* ======= Revisão ======= */
function mountReview(){
  const review=$("#review-list"); review.innerHTML="";
  $$("#steps .step").forEach((el,idx)=>{
    const label=el.querySelector("label")?.textContent||`Pergunta ${idx+1}`;
    const val=el.querySelector("input,textarea")?.value||"";
    const card=document.createElement("div");
    card.className="card";
    card.innerHTML=`<div class="text-sm opacity-70 mb-1">${label}</div>
                    <div class="font-medium whitespace-pre-wrap">${sanitize(val)}</div>`;
    review.appendChild(card);
  });
}

/* ======= Inputs ======= */
function persistInputs(){
  const st=loadState(); st.answers={};
  $$("#steps .step").forEach((el,idx)=>{
    const inp=el.querySelector("input,textarea");
    st.answers[`q${idx+1}`]=inp?.value||"";
  });
  saveState(st);
}
function restoreInputsFromState(){
  const st=loadState(); if(!st.answers) return;
  $$("#steps .step").forEach((el,idx)=>{
    const inp=el.querySelector("input,textarea");
    if(inp && st.answers[`q${idx+1}`]!=null) inp.value=st.answers[`q${idx+1}`];
    inp?.addEventListener("input",()=>{ const s=loadState(); s.answers=s.answers||{}; s.answers[`q${idx+1}`]=inp.value; saveState(s); });
  });
}
function clearAll(){ clearState(); $$("#wizard input, #wizard textarea").forEach(el=>el.value=""); current=1; showIntro(); }

/* ======= PDF + HQ (stubs) ======= */
async function baixarPDF(){ await delay(800); }
async function baixarHQ(){ await delay(800); }
async function baixarTudo(){
  const el=$("#status-download");
  try{
    el.textContent="Gerando PDF..."; await baixarPDF();
    el.textContent="Gerando HQ..."; await baixarHQ();
    el.textContent="PDF e HQ finalizados! Redirecionando...";
    clearState(); setTimeout(()=>window.location.href="/",1200);
  }catch(e){ el.textContent="Erro ao gerar arquivos."; console.error(e); }
}

/* ======= Utils ======= */
const delay=(ms)=>new Promise(res=>setTimeout(res,ms));
const sanitize=(s="")=>s.replace(/[<>&]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[c]));
