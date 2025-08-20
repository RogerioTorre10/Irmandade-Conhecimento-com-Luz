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
// ... (seu código atual do api.js)

async function gerarPDFLocal(respostas) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const margem = 48;
  let y = margem;

  // Título
  doc.setFont("Times","Bold");
  doc.setFontSize(18);
  doc.text("Jornada — Devolutiva Simbólica (Versão Local)", margem, y);
  y += 24;

  doc.setFont("Times","Normal");
  doc.setFontSize(11);
  doc.setTextColor(90,90,90);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, margem, y);
  y += 24;

  doc.setTextColor(0,0,0);
  doc.setFontSize(13);

  const wrap = (txt, maxWidth) => doc.splitTextToSize(txt, maxWidth);

  Object.entries(respostas).forEach(([qid, val], i) => {
    const titulo = `Pergunta ${i+1}`;
    doc.setFont("Times","Bold");
    doc.text(titulo, margem, y);
    y += 16;

    doc.setFont("Times","Normal");
    const lines = wrap(String(val || "—"), 520);
    lines.forEach(line => {
      if (y > 780) { doc.addPage(); y = margem; }
      doc.text(line, margem, y);
      y += 16;
    });
    y += 8;
    if (y > 780) { doc.addPage(); y = margem; }
  });

  doc.save("Jornada-Conhecimento-com-Luz-local.pdf");
}

// No FINAL do arquivo, ajuste a exportação para usar do front caso o backend falhe:
window.API = {
  async gerarPDFEHQ(payload){
    try{
      await gerarPDFEHQ(payload); // tenta backend (sua função existente)
    } catch (e) {
      alert("Servidor indisponível. Gerando PDF local de emergência…");
      await gerarPDFLocal(payload.respostas);
      // opcional: gerar uma 'HQ' local simples como um segundo PDF:
      await gerarPDFLocal({ "HQ (local)": "Sua história simbólica será renderizada quando o servidor estiver online." });
    }
};
  window.API = { gerarPDFEHQ };
})();
