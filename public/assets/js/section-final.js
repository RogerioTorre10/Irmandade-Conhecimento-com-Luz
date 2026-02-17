/* /assets/js/section-final.js — v6 FIX DEFINITIVO (SEM AWAIT SOLTO)
 * Página final da Jornada Essencial
 * - Datilografia + voz
 * - Botões PDF mágico + botão antigo
 * - Vídeo final retorno portal
 */

(function () {
'use strict';

const SECTION_ID   = 'section-final';
const HOME_URL     = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';
const FINAL_MOVIE  = '/assets/videos/filme-5-fim-da-jornada.mp4';

let started = false;

/* ======================================================
   LANG SAFE
====================================================== */
function getActiveLang() {
  return (
    window.i18n?.currentLang ||
    sessionStorage.getItem('jornada.lang') ||
    localStorage.getItem('jc.lang') ||
    document.documentElement?.lang ||
    'pt-BR'
  );
}

/* ======================================================
   PAYLOAD DIAMANTE (sempre seguro)
====================================================== */
function buildFinalPayloadDiamante() {
  const state = window.JORNADA_STATE || window.state || {};

  const nome = String(state.nome || '').trim();
  const guia = String(state.guiaSelecionado || state.guia || '').trim().toLowerCase();

  let respostas = state.respostas || [];
  if (!Array.isArray(respostas)) respostas = [];

  respostas = respostas.map(r => String(r || '').trim()).filter(Boolean);

  const selfieCard = state.selfieBase64 || state.selfieCard || '';

  return { nome, guia, respostas, selfieCard };
}

/* ======================================================
   UI PDF MÁGICO
====================================================== */
function setPdfStatus(root, msg, kind) {
  const el = root.querySelector('#finalPdfStatus');
  if (!el) return;
  el.classList.remove('ok','err');
  if (kind) el.classList.add(kind);
  el.textContent = msg;
}

function startMagicDots(root, base) {
  let n=0;
  return setInterval(()=> {
    n=(n+1)%4;
    setPdfStatus(root, base + '.'.repeat(n));
  },420);
}

function mountFinalPdfUI(root) {
  if (!root || root.querySelector('#finalPdfWrap')) return;

  const wrap = document.createElement('div');
  wrap.id='finalPdfWrap';
  wrap.innerHTML=`
  <div class="final-pdf-wrap">
    <div class="final-pdf-row">
      <button id="finalBtnPdf" class="final-pdf-btn">📜 Gerar meu Pergaminho</button>
      <button id="finalBtnSkipPdf" class="final-pdf-skip">Agora não</button>
    </div>
    <div id="finalPdfStatus" class="final-pdf-status">
      Você pode gerar o PDF agora ou depois.
    </div>
  </div>`;
  root.appendChild(wrap);

  const btnPdf  = wrap.querySelector('#finalBtnPdf');
  const btnSkip = wrap.querySelector('#finalBtnSkipPdf');

  btnSkip.onclick = ()=> setPdfStatus(root,'Tudo certo ✅ Você pode baixar depois.','ok');

  btnPdf.onclick = async ()=> {
    if (!window.API?.gerarPDFEHQ) {
      setPdfStatus(root,'❌ API não carregada.','err'); return;
    }

    const payload = buildFinalPayloadDiamante();
    btnPdf.disabled=true; btnSkip.disabled=true;

    const timer=startMagicDots(root,'Forjando seu pergaminho');

    try{
      const res = await window.API.gerarPDFEHQ(payload);
      clearInterval(timer);

      if(res?.ok) setPdfStatus(root,'✅ Pergaminho gerado!','ok');
      else throw res;

    }catch(e){
      clearInterval(timer);
      console.error(e);
      setPdfStatus(root,'❌ Falha ao gerar PDF','err');
      btnPdf.disabled=false; btnSkip.disabled=false;
    }
  };
}

/* ======================================================
   SEQUÊNCIA FINAL (datilografia)
====================================================== */
const sleep = ms => new Promise(r=>setTimeout(r,ms));
let speechChain = Promise.resolve();

function queueSpeak(text){
  if(!('speechSynthesis' in window)) return Promise.resolve();
  speechChain = speechChain.then(()=> new Promise(resolve=>{
    const u=new SpeechSynthesisUtterance(text);
    u.lang=getActiveLang();
    u.rate=.9;
    u.onend=resolve; u.onerror=resolve;
    speechSynthesis.speak(u);
  }));
  return speechChain;
}

async function typeText(el,text,delay=55,voice=true){
  if(!el||!text) return;
  el.textContent='';
  if(voice) queueSpeak(text);
  for(let i=0;i<text.length;i++){
    el.textContent+=text[i];
    if(i%2===0) await sleep(delay);
  }
}

/* ======================================================
   BOTÃO ANTIGO (mantido)
====================================================== */
async function generateArtifacts(){
  try{
    const res = await fetch('https://lumen-backend-api.onrender.com/api/jornada/finalizar',{method:'POST'});
    const data = await res.json();
    if(data.pdfUrl) window.open(data.pdfUrl);
    if(data.hqUrl)  window.open(data.hqUrl);
  }catch(e){
    console.error(e);
    alert('Erro ao gerar PDF/HQ');
  }
}

/* ======================================================
   VOLTAR AO PORTAL
====================================================== */
function handleVoltarInicio(){
  if(window.playVideo){
    window.playVideo(FINAL_MOVIE,{onEnded:()=> location.href=HOME_URL});
  } else location.href=HOME_URL;
}

/* ======================================================
   EVENTOS
====================================================== */
document.addEventListener('section:shown', e=>{
  if(e.detail?.sectionId!==SECTION_ID) return;

  const root=document.getElementById(SECTION_ID);
  mountFinalPdfUI(root);
});

document.addEventListener('click', e=>{
  if(e.target.closest('#btnBaixarPDFHQ')) generateArtifacts();
  if(e.target.closest('#btnVoltarInicio')) handleVoltarInicio();
});

})();
