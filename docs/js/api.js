(function(){
  const { API_BASE, PDF_ENDPOINT, HQ_ENDPOINT } = window.JORNADA_CFG;

  async function gerarPDFEHQ(payload){
    const headers = { 'Content-Type':'application/json', 'Accept':'application/pdf, application/json' };

    let pdfOk = false, hqOk = false;

    try {
      const pdfResp = await fetch(API_BASE + PDF_ENDPOINT, { method:'POST', headers, body: JSON.stringify(payload) });
      if(!pdfResp.ok) throw new Error(String(pdfResp.status));
      await baixarResp(pdfResp, 'Jornada-Conhecimento-com-Luz.pdf');
      pdfOk = true;
    } catch(e){
      // se quiser, dá pra cair pra PDF local também — hoje deixamos só logar
      console.warn('PDF via backend falhou, mantendo apenas fallback de HQ. Erro:', e);
    }

    try {
      const hqResp = await fetch(API_BASE + HQ_ENDPOINT,  { method:'POST', headers, body: JSON.stringify(payload) });
      if(!hqResp.ok) throw new Error(String(hqResp.status));
      await baixarResp(hqResp,  'Jornada-Conhecimento-com-Luz-HQ.pdf');
      hqOk = true;
    } catch(e){
      console.warn('HQ via backend falhou — gerando HQ local simples.', e);
      gerarHQlocal(payload);
      hqOk = true;
    }

    if(!pdfOk && !hqOk){
      alert('Não foi possível gerar os arquivos. Tente novamente.');
      throw new Error('Sem PDF e sem HQ');
    }
  }

  async function baixarResp(resp, nome){
    const ct = (resp.headers.get('content-type')||'').toLowerCase();
    if (ct.includes('application/pdf')) {
      const blob = await resp.blob(); baixar(blob, nome); return;
    }
    const txt = await resp.text();
    try {
      const j = JSON.parse(txt);
      if (j.url) { baixarLink(j.url, nome); return; }
      const b64 = j.file || j.pdf_base64;
      if (b64) { baixarLink('data:application/pdf;base64,'+b64, nome); return; }
    } catch(_) {}
    throw new Error('formato inesperado');
  }

  function gerarHQlocal({ respostas={}, meta={} }){
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) return;
    const margin = 48;
    const hq = new jsPDF({ unit:'pt', format:'a4' });

    hq.setFont('helvetica','bold'); hq.setFontSize(22);
    hq.text('HQ Simbólica — Versão Local', margin, 80);
    hq.setFont('helvetica','normal'); hq.setFontSize(13);
    hq.text(`Gerado em: ${(new Date(meta.quando || Date.now())).toLocaleString('pt-BR')}`, margin, 106);

    let y = 140;
    hq.setFont('helvetica','bold'); hq.text('Ecos que surgiram das suas respostas:', margin, y); y += 18;
    hq.setFont('helvetica','normal');
    const linhas = Object.values(respostas).filter(Boolean).slice(0,6)
      .map((v,i)=>`${i+1}. ${String(v).slice(0,100)}`);
    if(linhas.length===0) linhas.push('— (sem respostas) —');
    linhas.forEach(l=>{ hq.text(l, margin, y); y+=16; });

    hq.save('Jornada-Conhecimento-com-Luz-HQ.pdf');
  }

  function baixar(blob, filename){
    const url = URL.createObjectURL(blob);
    baixarLink(url, filename);
    setTimeout(()=>URL.revokeObjectURL(url), 1500);
  }
  function baixarLink(url, filename){
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
  }

  window.API = { gerarPDFEHQ };
})();
