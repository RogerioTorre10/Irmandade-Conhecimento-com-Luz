(function(){
  const { API_BASE, PDF_ENDPOINT, HQ_ENDPOINT } = window.JORNADA_CFG;

  async function ping(){
    try{
      await Promise.race([
        fetch(API_BASE + '/health', { method:'GET' }),
        new Promise((_, r) => setTimeout(()=>r(new Error('timeout')), 4000))
      ]);
    }catch(_){}
  }

  async function toBlobOrDownload(resp, fallbackName){
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/pdf')) {
      const blob = await resp.blob(); baixar(blob, fallbackName); return;
    }
    const text = await resp.text();
    try{
      const json = JSON.parse(text);
      if (json?.url){
        const a = document.createElement('a'); a.href = json.url; a.download = fallbackName;
        document.body.appendChild(a); a.click(); a.remove(); return;
      }
      const b64 = json?.file || json?.pdf_base64;
      if (b64){
        const a = document.createElement('a');
        a.href = 'data:application/pdf;base64,' + b64;
        a.download = fallbackName; document.body.appendChild(a); a.click(); a.remove(); return;
      }
      throw new Error('JSON sem url/base64');
    }catch{
      throw new Error(`Resposta inesperada (${resp.status}): ${text.slice(0,180)}`);
    }
  }

  async function gerarPDFEHQ(payload){
    await ping();

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf, application/json, */*'
    };

    const [pdfResp, hqResp] = await Promise.all([
      fetch(API_BASE + PDF_ENDPOINT, { method:'POST', headers, body: JSON.stringify(payload) }),
      fetch(API_BASE + HQ_ENDPOINT,  { method:'POST', headers, body: JSON.stringify(payload) }),
    ]);

    if(!pdfResp.ok){
      const t = await pdfResp.text().catch(()=>String(pdfResp.status));
      throw new Error(`PDF falhou (${pdfResp.status}): ${t.slice(0,180)}`);
    }
    if(!hqResp.ok){
      const t = await hqResp.text().catch(()=>String(hqResp.status));
      throw new Error(`HQ falhou (${hqResp.status}): ${t.slice(0,180)}`);
    }

    await toBlobOrDownload(pdfResp, 'Jornada-Conhecimento-com-Luz.pdf');
    await toBlobOrDownload(hqResp,  'Jornada-Conhecimento-com-Luz-HQ.pdf');
  }

  function baixar(blob, filename){
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(()=>{ URL.revokeObjectURL(url); a.remove(); }, 1000);
  }

  window.API = { gerarPDFEHQ };
})();
