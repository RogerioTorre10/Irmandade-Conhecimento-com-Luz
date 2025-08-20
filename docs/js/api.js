(function(){
  const { API_BASE, PDF_ENDPOINT, HQ_ENDPOINT } = window.JORNADA_CFG;

  async function gerarPDFEHQ(payload){
    try {
      // tenta backend primeiro
      const headers = { 'Content-Type':'application/json', 'Accept':'application/pdf, application/json' };
      const [pdfResp, hqResp] = await Promise.all([
        fetch(API_BASE + PDF_ENDPOINT, { method:'POST', headers, body: JSON.stringify(payload) }),
        fetch(API_BASE + HQ_ENDPOINT,  { method:'POST', headers, body: JSON.stringify(payload) }),
      ]);
      if(!pdfResp.ok || !hqResp.ok) throw new Error('backend');
      await baixarResp(pdfResp, 'Jornada-Conhecimento-com-Luz.pdf');
      await baixarResp(hqResp,  'Jornada-Conhecimento-com-Luz-HQ.pdf');
    } catch (e) {
      // fallback local
      gerarLocal(payload);
    }
  }

  async function baixarResp(resp, nome){
    const ct = (resp.headers.get('content-type')||'').toLowerCase();
    if (ct.includes('application/pdf')) {
      const blob = await resp.blob();
      baixar(blob, nome); return;
    }
    const txt = await resp.text();
    try {
      const j = JSON.parse(txt);
      if (j.url) { link(j.url, nome); return; }
      const b64 = j.file || j.pdf_base64;
      if (b64) { link('data:application/pdf;base64,'+b64, nome); return; }
    } catch(_) {}
    throw new Error('formato inesperado');
  }

  function gerarLocal({ respostas={}, meta={} }){
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) { alert('PDF local indisponível.'); return; }

    // PDF da devolutiva
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 48;
    let y = margin;

    doc.setFont('helvetica','bold'); doc.setFontSize(18);
    doc.text('Jornada — Devolutiva Simbólica', margin, y); y += 20;
    doc.setFont('helvetica','normal'); doc.setFontSize(11);
    doc.text(`Gerado em: ${(new Date(meta.quando || Date.now())).toLocaleString('pt-BR')}`, margin, y); y += 18;

    Object.entries(respostas).forEach(([id,val],i)=>{
      y += 16;
      doc.setFont('helvetica','bold'); doc.setFontSize(12);
      doc.text(`${i+1}. ${id}`, margin, y); y += 14;
      doc.setFont('helvetica','normal'); doc.setFontSize(12);
      const split = doc.splitTextToSize(val || '-', 515);
      split.forEach(line => { if (y > 780) { doc.addPage(); y = margin; } doc.text(line, margin, y); y += 14; });
    });

    // salva PDF 1
    doc.save('Jornada-Conhecimento-com-Luz.pdf');

    // PDF simples da “HQ” (placeholder)
    const hq = new jsPDF({ unit:'pt', format:'a4' });
    hq.setFont('helvetica','bold'); hq.setFontSize(22);
    hq.text('HQ Simbólica', margin, 80);
    hq.setFont('helvetica','normal'); hq.setFontSize(13);
    hq.text('Versão local (fallback). Quando o backend estiver ativo, a HQ completa será baixada automaticamente.', margin, 110);
    hq.save('Jornada-Conhecimento-com-Luz-HQ.pdf');
  }

  function baixar(blob, filename){
    const url = URL.createObjectURL(blob);
    link(url, filename);
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
  }
  function link(url, filename){
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  window.API = { gerarPDFEHQ };
})();
