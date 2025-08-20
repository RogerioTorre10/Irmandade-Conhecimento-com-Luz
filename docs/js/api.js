(function(){
  const { API_BASE, PDF_ENDPOINT, HQ_ENDPOINT } = window.JORNADA_CFG;

  async function toBlobOrDownload(resp, fallbackName){
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/pdf')) {
      const blob = await resp.blob();
      baixar(blob, fallbackName);
      return;
    }
    // Se vier JSON com URL/base64
    const json = await resp.json().catch(()=>null);
    if (json) {
      if (json.url) {
        const a = document.createElement('a'); a.href = json.url; a.download = fallbackName;
        document.body.appendChild(a); a.click(); a.remove(); return;
      }
      if (json.file || json.pdf_base64) {
        const b64 = json.file || json.pdf_base64;
        const link = document.createElement('a');
        link.href = 'data:application/pdf;base64,' + b64;
        link.download = fallbackName; document.body.appendChild(link); link.click(); link.remove(); return;
      }
    }
    throw new Error('Formato inesperado da resposta');
  }

  async function gerarPDFEHQ(payload){
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf, application/json'
    };

    const [pdfResp, hqResp] = await Promise.all([
      fetch(API_BASE + PDF_ENDPOINT, { method:'POST', headers, body: JSON.stringify(payload) }),
      fetch(API_BASE + HQ_ENDPOINT,  { method:'POST', headers, body: JSON.stringify(payload) }),
    ]);

    if(!pdfResp.ok) throw new Error('Falha ao gerar PDF');
    if(!hqResp.ok)  throw new Error('Falha ao gerar HQ');

    await toBlobOrDownload(pdfResp, 'Jornada-Conhecimento-com-Luz.pdf');
    await toBlobOrDownload(hqResp,  'Jornada-Conhecimento-com-Luz-HQ.pdf');
  }

  function baixar(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  window.API = { gerarPDFEHQ };
})();
