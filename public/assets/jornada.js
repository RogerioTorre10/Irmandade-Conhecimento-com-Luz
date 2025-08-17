/* Jornada Conhecimento com Luz – utilidades globais (PDF, reset, payload, HQ) */
(function () {
  'use strict';

  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) || 'https://conhecimento-com-luz-api.onrender.com';
  const PDF_ENDPOINTS = ['/generate-pdf', '/pdf', '/api/pdf'];

  const ts = () => new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  const nomePDF = () => `Jornada_${ts()}.pdf`;
  const nomeHQ  = () => `Jornada_HQ_${ts()}.png`;

  function baixarBlob(blob){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nomePDF(); document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),3000); }
  function baixarBase64(b64){ const a=document.createElement('a'); a.href='data:application/pdf;base64,'+b64; a.download=nomePDF(); document.body.appendChild(a); a.click(); a.remove(); }
  function baixarDataURL(url, fname){ const a=document.createElement('a'); a.href=url; a.download=fname; document.body.appendChild(a); a.click(); a.remove(); }
  function safeJSON(text, fb){ try{ return JSON.parse(text); } catch{ return fb; } }

  async function gerarPDF(dados){
    let lastErr;
    for (const ep of PDF_ENDPOINTS){
      try{
        const res = await fetch(API_BASE+ep,{
          method:'POST',
          headers:{'Content-Type':'application/json','Accept':'application/json,application/pdf'},
          body:JSON.stringify(dados||{})
        });
        const ct = (res.headers.get('content-type')||'').toLowerCase();

        if(res.ok && ct.includes('application/pdf')){
          const blob=await res.blob(); baixarBlob(blob); return;
        }

        // tenta JSON (várias APIs retornam base64)
        const json = await res.json().catch(()=>({}));
        const b64 = json.pdf_base64 || json.file || json.pdf;
        if(b64){ baixarBase64(b64); return; }

        // erro com detalhe
        const text = JSON.stringify(json) || await res.text().catch(()=>'(sem detalhes)');
        throw new Error(`Resposta inesperada de ${ep}: ${text}`);
      }catch(e){ lastErr=e; }
    }
    throw lastErr || new Error('Falha ao gerar PDF');
  }

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
    document.querySelectorAll('input, textarea, select').forEach(el=>{
      if(el.type==='checkbox'||el.type==='radio') el.checked=false; else el.value='';
    });
    try{ localStorage.removeItem('respostas_jornada'); }catch{}
    try{ sessionStorage.removeItem('veio_da_intro'); }catch{}
    location.href='/jornada-intro.html';
  }

  // -------- HQ (imagem longa) --------
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
    const a=document.createElement('a'); a.href=url; a.download=nomeHQ(); document.body.appendChild(a); a.click(); a.remove();
    el.remove();
  }

  window.JornadaUtil = { gerarPDF, coletarPayload, resetarTotal, gerarHQ, _config:{API_BASE, PDF_ENDPOINTS} };
})();
