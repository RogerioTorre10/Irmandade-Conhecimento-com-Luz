/* Jornada Conhecimento com Luz – utilidades globais (PDF, reset, payload)
   Coloque este arquivo em: public/jornada.js */
(function () {
  'use strict';

  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'https://conhecimento-com-luz-api.onrender.com';
  const PDF_ENDPOINTS = ['/generate-pdf', '/pdf', '/api/pdf'];

  const ts = () => new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const nomePDF = () => `Jornada_${ts()}.pdf`;

  function baixarBlob(blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nomePDF(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); }
  function baixarBase64(b64){ const a=document.createElement('a'); a.href='data:application/pdf;base64,'+b64; a.download=nomePDF(); document.body.appendChild(a); a.click(); a.remove(); }

  async function gerarPDF(dados){
    let lastErr;
    for (const ep of PDF_ENDPOINTS){
      try{
        const res = await fetch(API_BASE+ep,{ method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json,application/pdf'}, body:JSON.stringify(dados||{}) });
        const ct = (res.headers.get('content-type')||'').toLowerCase();
        if(res.ok && ct.includes('application/pdf')){ const blob=await res.blob(); baixarBlob(blob); return; }
        const json = await res.json().catch(()=>({}));
        const b64 = json.pdf_base64 || json.file || json.pdf;
        if(b64){ baixarBase64(b64); return; }
        throw new Error(`Resposta inesperada de ${ep}`);
      }catch(e){ lastErr=e; }
    }
    throw lastErr || new Error('Falha ao gerar PDF');
  }

  function safeJSON(text, fb){ try{ return JSON.parse(text); } catch{ return fb; } }

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

  function resetarTotal(){
    document.querySelectorAll('input, textarea, select').forEach(el=>{ if(el.type==='checkbox'||el.type==='radio') el.checked=false; else el.value=''; });
    try{ localStorage.removeItem('respostas_jornada'); }catch{}
    try{ sessionStorage.removeItem('veio_da_intro'); }catch{}
    location.href='/jornada-intro.html';
  }

  window.JornadaUtil = { gerarPDF, coletarPayload, resetarTotal, _config:{API_BASE, PDF_ENDPOINTS} };
})();
