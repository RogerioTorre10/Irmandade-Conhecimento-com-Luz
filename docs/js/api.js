(function(){
  const { API_BASE, PDF_ENDPOINT, HQ_ENDPOINT } = window.JORNADA_CFG;

  async function gerarPDFEHQ(payload){
    const headers = { 'Content-Type': 'application/json', 'Accept': 'application/pdf' };

    // Mantém duas chamadas paralelas (compatível com seu backend atual)
    const [pdfResp, hqResp] = await Promise.all([
      fetch(API_BASE + PDF_ENDPOINT, { method:'POST', headers, body: JSON.stringify(payload) }),
      fetch(API_BASE + HQ_ENDPOINT,  { method:'POST', headers, body: JSON.stringify(payload) }),
    ]);

    if(!pdfResp.ok) throw new Error('Falha ao gerar PDF');
    if(!hqResp.ok)  throw new Error('Falha ao gerar HQ');

    const pdfBlob = await pdfResp.blob();
    const hqBlob  = await hqResp.blob();

    baixar(pdfBlob, 'Jornada-Conhecimento-com-Luz.pdf');
    baixar(hqBlob,  'Jornada-Conhecimento-com-Luz-HQ.pdf');
  }

  function baixar(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  window.API = { gerarPDFEHQ };
})();

