/* Jornada Conhecimento com Luz – utilidades globais (PDF, reset, payload, HQ) – v8 */
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
