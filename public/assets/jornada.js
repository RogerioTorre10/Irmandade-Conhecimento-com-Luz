// jornada.js — v10.1 (validação GLOBAL + payload JSON + entrega garantida)
// Autor: Lumen (GPT-5 Thinking)

const CONFIG = {
  API_BASE: 'https://conhecimento-com-luz-api.onrender.com', // ajuste se necessário
  ENDPOINTS: { PDF: '/gerar-pdf', HQ: '/gerar-hq' },
  DOWNLOAD_NAMES: () => {
    const ts = new Date().toISOString().replace(/[:T]/g,'-').split('.')[0];
    return { pdf: `Jornada_${ts}.pdf`, hq: `Jornada_HQ_${ts}.png` }; // troque .png para .pdf se a HQ vier em PDF
  }
};

// ——— helpers
const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const show = (el) => el?.classList?.remove('hidden');
const hide = (el) => el?.classList?.add('hidden');

function setStatus(msg, ok=null){
  const box=$('#status-box'), lines=$('#status-lines');
  if(!box||!lines) return;
  show(box);
  const div=document.createElement('div');
  if(ok===true)  div.innerHTML = `${msg} <span class="text-emerald-400">✔</span>`;
  else if(ok===false) div.innerHTML = `${msg} <span class="text-rose-400">✖</span>`;
  else div.textContent = msg;
  lines.appendChild(div);
  box.scrollTop=box.scrollHeight;
}

function triggerDownload(blob, filename){
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=filename;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 0);
}

async function postBlob(url){
  const res=await fetch(url,{method:'POST'});
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}
async function postBlobJSON(url, payload){
  const res=await fetch(url,{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  if(!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.blob();
}
async function withRetry(fn,{retries=2,delay=600}={}){
  let err;
  for(let i=0;i<=retries;i++){
    try { return await fn(); }
    catch(e){ err=e; if(i<retries) await new Promise(r=>setTimeout(r,delay)); }
  }
  throw err;
}

function limparTudo(){
  try{
    localStorage.removeItem('jornada.answers');
    localStorage.removeItem('jornada.progress');
    sessionStorage.clear();
    $$('input,textarea,select').forEach(el=>{
      if(el.type==='checkbox'||el.type==='radio') el.checked=false; else el.value='';
      el.classList.remove('field-error');
    });
  }catch(e){ console.warn('Falha ao limpar:',e); }
}

// ——— intro estável
function mountIntro(){
  const started=sessionStorage.getItem('journey-started')==='1';
  $('#tela-intro')      && (started?hide($('#tela-intro')):show($('#tela-intro')));
  $('#tela-perguntas')  && (started?show($('#tela-perguntas')):hide($('#tela-perguntas')));
  $('#tela-final')      && hide($('#tela-final'));
}
$('#btn-iniciar')?.addEventListener('click',()=>{
  sessionStorage.setItem('journey-started','1');
  hide($('#tela-intro')); show($('#tela-perguntas'));
});

// ——— wizard + validação
let currentStep=0;
const steps=()=> $$('#tela-perguntas .step');

function showStep(i){
  steps().forEach((s,idx)=>s.classList.toggle('hidden', idx!==i));
  $('.btn-prev')?.classList.toggle('hidden', i===0);
  $('.btn-next')?.classList.toggle('hidden', i>=steps().length-1);
  $('#btn-ir-final')?.classList.toggle('hidden', i<steps().length-1);
}

function readAnswer(block){
  const input = block.querySelector('input,textarea,select');
  if(!input) return '';
  if(input.type==='radio'){
    const chk=block.querySelector('input[type="radio"]:checked');
    return chk?chk.value:'';
  }
  if(input.type==='checkbox'){
    const list=Array.from(block.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value);
    return list.length?list:[];
  }
  if(input.tagName==='SELECT' && input.multiple){
    const list=Array.from(input.selectedOptions).map(o=>o.value);
    return list.length?list:[];
  }
  return String(input.value||'').trim();
}
const isEmpty = (v) => (v==='' || v==null || (Array.isArray(v)&&v.length===0));
const allQuestions = () => $$('#tela-perguntas .question');
const qidOf = (block) => block.getAttribute('data-qid') || block.querySelector('[name]')?.getAttribute('name') || null;

function collectAnswers(){
  const out={};
  allQuestions().forEach(block=>{
    const key=qidOf(block); if(!key) return;
    out[key]=readAnswer(block);
  });
  return out;
}

function validateStep(idx=currentStep){
  const s=steps()[idx]; if(!s) return true; let ok=true;
  const blocks = Array.from(s.querySelectorAll('.question'));
  blocks.forEach(block=>{
    const v=readAnswer(block);
    const optional = block.dataset.optional==='true';
    const input=block.querySelector('input,textarea,select');
    if(!optional && isEmpty(v)){ ok=false; input?.classList.add('field-error'); }
    else input?.classList.remove('field-error');
  });
  if(!ok) setStatus('Preencha os campos obrigatórios antes de avançar.', false);
  return ok;
}
function validateAll(){
  let ok=true, first=null;
  allQuestions().forEach(block=>{
    const v=readAnswer(block);
    const optional = block.dataset.optional==='true';
    const input=block.querySelector('input,textarea,select');
    if(!optional && isEmpty(v)){ ok=false; first=first||block; input?.classList.add('field-error'); }
    else input?.classList.remove('field-error');
  });
  if(!ok){
    setStatus('Faltam respostas obrigatórias. Revise os campos destacados.', false);
    const st = first?.closest('.step');
    if(st){ const idx=steps().indexOf(st); if(idx>=0){ currentStep=idx; showStep(currentStep); } }
  }
  return ok;
}

$('.btn-next')?.addEventListener('click',()=>{ if(!validateStep()) return; currentStep=Math.min(currentStep+1, steps().length-1); showStep(currentStep); });
$('.btn-prev')?.addEventListener('click',()=>{ currentStep=Math.max(currentStep-1,0); showStep(currentStep); });
$('#btn-ir-final')?.addEventListener('click',()=>{ if(!validateAll()) return; hide($('#tela-perguntas')); show($('#tela-final')); });
$('#btn-revisar')?.addEventListener('click',()=>{ hide($('#tela-final')); show($('#tela-perguntas')); });
$('#btn-voltar-home')?.addEventListener('click',()=>{ location.href='/'; });

// ——— entrega garantida (PDF + HQ)
async function baixarTudoGarantido(){
  if(!validateAll()) return; // último guarda
  const answers = collectAnswers();
  const payload = { answers, meta: { ts: new Date().toISOString(), app: 'Jornada v10.1' } };

  const names=CONFIG.DOWNLOAD_NAMES();
  const pdfURL=CONFIG.API_BASE+CONFIG.ENDPOINTS.PDF;
  const hqURL =CONFIG.API_BASE+CONFIG.ENDPOINTS.HQ;
  const btn=$('#btn-baixar-tudo'); btn && (btn.disabled=true);

  $('#status-lines') && ($('#status-lines').innerHTML='');
  setStatus('Gerando PDF...');

  try{
    const pdfBlob = await withRetry(()=>postBlobJSON(pdfURL, payload), {retries:1, delay:700});
    triggerDownload(pdfBlob, names.pdf);
    setStatus('PDF baixado', true);
  }catch(e){
    setStatus('Falha ao gerar/baixar o PDF via JSON. Tentando fallback...', false);
    try{
      const b=await withRetry(()=>postBlob(pdfURL),{retries:1,delay:700});
      triggerDownload(b,names.pdf);
      setStatus('PDF baixado (fallback)', true);
    }catch(e2){
      setStatus('Não foi possível entregar o PDF.', false);
      btn && (btn.disabled=false);
      return;
    }
  }

  setStatus('Gerando HQ (imagem)...');
  try{
    const hqBlob = await withRetry(()=>postBlobJSON(hqURL, payload), {retries:1, delay:700});
    triggerDownload(hqBlob, names.hq);
    setStatus('HQ baixada', true);
  }catch(e){
    setStatus('Falha ao gerar/baixar a HQ via JSON. Tentando fallback...', false);
    try{
      const b=await withRetry(()=>postBlob(hqURL),{retries:1,delay:700});
      triggerDownload(b,names.hq);
      setStatus('HQ baixada (fallback)', true);
    }catch(e2){
      setStatus('Não foi possível entregar a HQ agora. Tente novamente após liberar espaço/conexão.', false);
      btn && (btn.disabled=false);
      return;
    }
  }

  setStatus('Entrega finalizada (PDF + HQ). Redirecionando...');
  limparTudo();
  setTimeout(()=>{ location.href='/'; }, 1200);
}
$('#btn-baixar-tudo')?.addEventListener('click', baixarTudoGarantido);

// ——— init
window.addEventListener('DOMContentLoaded',()=>{ mountIntro(); currentStep=0; showStep(currentStep); });
