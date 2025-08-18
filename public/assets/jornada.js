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
      el.classList.remove('fiel
