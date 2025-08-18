// jornada.js — v10.1 (validação GLOBAL + payload JSON + entrega garantida)

const CONFIG = {
  API_BASE: 'https://conhecimento-com-luz-api.onrender.com', // ajuste se necessário
  ENDPOINTS: { PDF: '/gerar-pdf', HQ: '/gerar-hq' },
  DOWNLOAD_NAMES: () => {
    const ts = new Date().toISOString().replace(/[:T]/g,'-').split('.')[0];
    return { pdf: `Jornada_${ts}.pdf`, hq: `Jornada_HQ_${ts}.png` }; // troque .png para .pdf se a HQ vier em PDF
  }
};

const $  = (s) => document.quer/* Jornada Conhecimento com Luz – utilidades globais (PDF, reset, payload, HQ) – v8 */
(function () {
  'use strict';

  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'https://conhecimento-com-luz-api.onrender.com';
  const PDF_ENDPOINTS = ['/generate-pdf', '/pdf', '/api/pdf'];

  const ts = () => new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const nomePDF = () => `Jornada_${ts()}.pdf`;
  const nomeHQ  = () => `Jornada_HQ_${ts()}.png`;

  function safeJSON(text, fb){ try{ return JSON.parse(text); } catch{ return fb; } }
  function baixarBlob(blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nomePDF(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); }
  function baixarBase64(b64){ const a=document.createElement('a'); a.href='data:application/pdf;base64,'+b64; a.download=nomePDF(); document.body.appendChild(a); a.click(); a.remove(); }
  function baixarDataURL(url, fname){ const a=document.createElement('a'); a.href=url; a.download=fname; document.body.appendChild(a); a.click(); a.remove(); }

  // ------------ coleta ------------
  function coletarPayload(){
    let respostas = safeJSON(localStorage.getItem('respostas_jornada')||'{}', {});
    if(!respostas || (typeof respostas==='object' && Object.keys(respostas).length===0)){
      respostas={};
      const add=(k,v)=>{ if(!k)return; if(k in respostas){ if(!Array.isArray(respostas[k])) respostas[k]=[respostas[k]]; respostas[k].push(v);} else { respostas[k]=v; } };
      document.querySelectorAll('input, textarea, select').forEach(el=>{
        const k=el.name||el.id||''; if(!k) return;
        if(el.type==='checkbox') add(k,!!el.checked);
        else if(el.type==='radio'){ if(el.checked) add(k,el.value); }
        else add(k,el.value);
      });
    }
    return { respostas, meta:{ agente:'Lumen', gerado_em:new Date().toISOString(), tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC') } };
  }

  // ------------ PDF: remoto ------------
  async function gerarPDFRemoto(dados){
    let lastErr;
    for (const ep of PDF_ENDPOINTS){
      try{
        const res = await fetch(API_BASE+ep,{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json,application/pdf'},
          body:JSON.stringify(dados||{})
        });
        const ct = (res.headers.get('content-type')||'').toLowerCase();
        if(res.ok && ct.includes('application/pdf')){ const blob=await res.blob(); baixarBlob(blob); return true; }
        const json = await res.json().catch(()=>({}));
        const b64 = json.pdf_base64 || json.file || json.pdf;
        if(b64){ baixarBase64(b64); return true; }
        lastErr = new Error(`Resposta inesperada de ${ep}: ${JSON.stringify(json)}`);
      }catch(e){ lastErr=e; }
    }
    if (lastErr) throw lastErr;
    throw new Error('Falha ao gerar PDF (remoto)');
  }

  // ------------ PDF: local (jsPDF) ------------
  function loadJsPDF(){
    if (window.jspdf?.jsPDF) return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
      s.onload=()=>window.jspdf?.jsPDF?resolve():reject(new Error('jsPDF não disponível'));
      s.onerror=()=>reject(new Error('Falha ao carregar jsPDF'));
      document.head.appendChild(s);
    });
  }
  function wrapText(doc, text, maxW){ return doc.splitTextToSize(String(text ?? ''), maxW); }

  async function gerarPDFLocal(payload){
    await loadJsPDF();
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit:'pt', format:'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 56;
    const maxW = pageW - margin*2;
    let y = margin;

    doc.setFont('Helvetica','bold'); doc.setFontSize(18);
    doc.text('Jornada Conhecimento com Luz', margin, y); y += 18;
    doc.setFont('Helvetica','normal'); doc.setFontSize(11);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, margin, y); y += 20;

    const respostas = payload?.respostas || {};
    const entries = Object.entries(respostas);
    entries.forEach(([k,v],idx)=>{
      if (y > pageH - margin - 60) { doc.addPage(); y = margin; }
      doc.setFont('Helvetica','bold'); doc.setFontSize(12);
      doc.text(`${idx+1}. ${k}`, margin, y); y += 14;

      doc.setFont('Helvetica','normal'); doc.setFontSize(11);
      const lines = wrapText(doc, Array.isArray(v)? v.join('\n'): v, maxW);
      lines.forEach(line => {
        if (y > pageH - margin - 20) { doc.addPage(); y = margin; }
        doc.text(line, margin, y); y += 14;
      });
      y += 8;
    });

    doc.save(nomePDF());
  }

  async function gerarPDF(dados){
    try {
      await gerarPDFRemoto(dados);
    } catch (e) {
      // fallback local se a API falhar
      await gerarPDFLocal(dados);
    }
  }

  // ------------ HQ ------------
  function loadHtml2Canvas(){
    if (window.html2canvas) return Promise.resolve();
    return new Promise((resolve, reject)=>{
      const s=document.createElement('script');
      s.src='https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      s.onload=resolve; s.onerror=()=>reject(new Error('Falha ao carregar html2canvas'));
      document.head.appendChild(s);
    });
  }
  function montarHQDOM(payload){
    const respostas = payload?.respostas || {};
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      position:'fixed', left:'-99999px', top:'0', width:'900px',
      padding:'32px', color:'#e2e8f0', background:'#0f172a',
      fontFamily:'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial'
    });
    const h = document.createElement('div');
    h.innerHTML = `<div style="font-size:28px;font-weight:800;margin-bottom:8px">Jornada Conhecimento com Luz</div>
                   <div style="opacity:.8;margin-bottom:24px">Resumo simbólico — ${new Date().toLocaleString()}</div>`;
    wrap.appendChild(h);

    Object.entries(respostas).forEach(([k,v],i)=>{
      const card = document.createElement('div');
      card.style.cssText = 'border:1px solid #1f2937;border-radius:16px;background:#111827;padding:16px;margin:12px 0;';
      const titulo = document.createElement('div');
      titulo.style.cssText='font-weight:700;margin-bottom:8px;color:#93c5fd';
      titulo.textContent = `${i+1}. ${k}`;
      const corpo = document.createElement('div');
      corpo.style.cssText='white-space:pre-wrap;line-height:1.5';
      corpo.textContent = Array.isArray(v) ? v.join('\n') : (v ?? '');
      card.appendChild(titulo); card.appendChild(corpo);
      wrap.appendChild(card);
    });
    return wrap;
  }
  async function gerarHQ(payload){
    await loadHtml2Canvas();
    const el = montarHQDOM(payload || coletarPayload());
    document.body.appendChild(el);
    const canvas = await window.html2canvas(el,{backgroundColor:'#0f172a',scale:2,useCORS:true});
    const url = canvas.toDataURL('image/png');
    baixarDataURL(url, nomeHQ());
    el.remove();
  }

  function resetarTotal(){
    document.querySelectorAll('input, textarea, select').forEach(el=>{
      if(el.type==='checkbox'||el.type==='radio') el.checked=false; else el.value='';
    });
    try{ localStorage.removeItem('respostas_jornada'); }catch{}
    try{ sessionStorage.removeItem('veio_da_intro'); }catch{}
    location.href='/jornada-intro.html';
  }

  window.JornadaUtil = { gerarPDF, coletarPayload, resetarTotal, gerarHQ, _config:{API_BASE, PDF_ENDPOINTS} };
})();
ySelector(s);
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

$('.btn-next')?.addEventListener('click',()=>{ if(!validateStep()) return; currentStep=Math.min(currentStep+1, steps().length-1); showStep(currentStep); });
$('.btn-prev')?.addEventListener('click',()=>{ currentStep=Math.max(currentStep-1,0); showStep(currentStep); });
$('#btn-ir-final')?.addEventListener('click',()=>{ if(!validateAll()) return; hide($('#tela-perguntas')); show($('#tela-final')); });
$('#btn-revisar')?.addEventListener('click',()=>{ hide($('#tela-final')); show($('#tela-perguntas')); });
$('#btn-voltar-home')?.addEventListener('click',()=>{ location.href='/'; });

// Entrega garantida (PDF + HQ)
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

// Init
window.addEventListener('DOMContentLoaded',()=>{ mountIntro(); currentStep=0; showStep(currentStep); });
