// jornada.js — v10.1 (validação GLOBAL + payload JSON + entrega garantida)

const CONFIG = {
  API_BASE: 'https://conhecimento-com-luz-api.onrender.com', // ajuste se necessário
  ENDPOINTS: { PDF: '/gerar-pdf', HQ: '/gerar-hq' },
  DOWNLOAD_NAMES: () => {
    const ts = new Date().toISOString().replace(/[:T]/g,'-').split('.')[0];
    return { pdf: `Jornada_${ts}.pdf`, hq: `Jornada_HQ_${ts}.png` }; // troque .png para .pdf se a HQ vier em PDF
  }
};

const $  = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const show = (el) => el?.classList?.remove('hidden');
const hide = (el) => el?.classList?.add('hidden');

function setStatus(msg, ok=null){
  const box=$('#status-box'), lines=$('#status-lines');
  if(!box||!lines) return; show(box);
  const div=document.createElement('div');
  if(ok===true)  div.innerHTML = `${msg} <span class="text-emerald-400">✔</span>`;
  else if(ok===false) div.innerHTML = `${msg} <span class="text-rose-400">✖</span>`;
  else div.textContent = msg;
  lines.appendChild(div); box.scrollTop=box.scrollHeight;
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
  let err; for(let i=0;i<=retries;i++){ try{ return await fn(); }catch(e){ err=e; if(i<retries) await new Promise(r=>setTimeout(r,delay)); } }
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

// Intro estável
function mountIntro(){
  const started=sessionStorage.getItem('journey-started')==='1';
  $('#tela-intro')     && (started?hide($('#tela-intro')):show($('#tela-intro')));
  $('#tela-perguntas') && (started?show($('#tela-perguntas')):hide($('#tela-perguntas')));
  $('#tela-final')     && hide($('#tela-final'));
}
$('#btn-iniciar')?.addEventListener('click',()=>{
  sessionStorage.setItem('journey-started','1');
  hide($('#tela-intro')); show($('#tela-perguntas'));
});

// Wizard + validação
let currentStep=0;
const steps=()=> $$('#tela-perguntas .step');

function showStep(i){
  steps().forEach((s,idx)=>s.classList.toggle('hidden', idx!==i));
  $('.btn-prev')?.classList.toggle('hidden', i===0);
  $('.btn-next')?.classList.toggle('hidden', i>=steps().length-1);
  $('#btn-ir-final')?.classList.toggle('hidden', i<steps().length-1);
}

function readAnswer(block){
  const input = block.querySelector('input,textarea,select'); if(!input) return '';
  if(input.type==='radio'){ const chk=block.querySelector('input[type="radio"]:checked'); return chk?chk.value:''; }
  if(input.type==='checkbox'){ const list=Array.from(block.querySelectorAll('input[type="checkbox"]:checked')).map(x=>x.value); return list.length?list:[]; }
  if(input.tagName==='SELECT' && input.multiple){ const list=Array.from(input.selectedOptions).map(o=>o.value); return list.length?list:[]; }
  return String(input.value||'').trim();
}
const isEmpty = (v) => (v==='' || v==null || (Array.isArray(v)&&v.length===0));
const allQuestions = () => $$('#tela-perguntas .question');
const qidOf = (block) => block.getAttribute('data-qid') || block.querySelector('[name]')?.getAttribute('name') || null;

function collectAnswers(){
  const out={}; allQuestions().forEach(block=>{ const key=qidOf(block); if(!key) return; out[key]=readAnswer(block); });
  return out;
}

function validateStep(idx=currentStep){
  const s=steps()[idx]; if(!s) return true; let ok=true;
  Array.from(s.querySelectorAll('.question')).forEach(block=>{
    const v=readAnswer(block); const optional = block.dataset.optional==='true';
    const input=block.querySelector('input,textarea,select');
    if(!optional && isEmpty(v)){ ok=false; input?.classList.add('field-error'); } else input?.classList.remove('field-error');
  });
  if(!ok) setStatus('Preencha os campos obrigatórios antes de avançar.', false);
  return ok;
}
function validateAll(){
  let ok=true, first=null;
  allQuestions().forEach(block=>{
    const v=readAnswer(block); const optional = block.dataset.optional==='true';
    const input=block.querySelector('input,textarea,select');
    if(!optional && isEmpty(v)){ ok=false; first=first||block; input?.classList.add('field-error'); } else input?.classList.remove('field-error');
  });
  if(!ok){
    setStatus('Faltam respostas obrigatórias. Revise os campos destacados.', false);
    const st = first?.closest('.step'); if(st){ const idx=steps().indexOf(st); if(idx>=0){ currentStep=idx; showStep(currentStep); } }
  }
  return ok;
}

$('.btn-next')?.addEventListener('click',()=>{ if(!validateStep()) return; currentStep=Math.min(currentStep+1, steps().length
