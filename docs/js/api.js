(function () {
  // Endpoints
  const API_PRIMARY  = 'https://lumen-backend-v3w2.onrender.com';
  const API_FALLBACK = 'https://conhecimento-com-luz-api.onrender.com';
  const PDF_ENDPOINT = '/api/jornada/pdf';
  const HQ_ENDPOINT  = '/api/jornada/hq';

  let API_BASE = API_PRIMARY; // será confirmado por health()

  // util: baixar blob com nome de arquivo
  async function baixarArquivo(blob, nome) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = nome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // timestamp para nomes
  function stamp() {
    const d = new Date(), p = n => String(n).padStart(2,'0');
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}-${p(d.getSeconds())}`;
  }

  // escolhe a melhor base (primária -> fallback)
  async function escolherBase() {
    for (const base of [API_PRIMARY, API_FALLBACK]) {
      try {
        const r = await fetch(`${base}/health`, { method: 'GET' });
        if (r.ok) { API_BASE = base; return base; }
      } catch {}
    }
    // se nenhuma respondeu ok, mantemos a primária (evita quebrar)
    API_BASE = API_PRIMARY;
    return API_BASE;
  }

  // === fluxo principal: gera PDF e HQ ===
  async function gerarPDFEHQ(payload) {
    await escolherBase(); // define API_BASE logo de cara

    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/pdf, application/json'
    };

    let pdfok = false;

    // 1) PDF
    try {
      const pdfResp = await fetch(API_BASE + PDF_ENDPOINT, {
        method: 'POST', headers, body: JSON.stringify(payload)
      });
      if (!pdfResp.ok) throw new Error(String(pdfResp.status));
      const pdfBlob = await pdfResp.blob();
      await baixarArquivo(pdfBlob, `Jornada-Conhecimento-com-Luz_${stamp()}.pdf`);
      pdfok = true;
    } catch (e) {
      // tenta fallback *somente se ainda não estamos nele*
      if (API_BASE !== API_FALLBACK) {
        try {
          API_BASE = API_FALLBACK;
          const pdfResp2 = await fetch(API_BASE + PDF_ENDPOINT, {
            method: 'POST', headers, body: JSON.stringify(payload)
          });
          if (!pdfResp2.ok) throw new Error(String(pdfResp2.status));
          const pdfBlob2 = await pdfResp2.blob();
          await baixarArquivo(pdfBlob2, `Jornada-Conhecimento-com-Luz_${stamp()}.pdf`);
          pdfok = true;
        } catch (e2) {
          console.error('PDF falhou na primária e no fallback:', e, e2);
        }
      } else {
        console.error('PDF falhou no fallback:', e);
      }
    }

    // 2) HQ (só tenta se quiser gerar; aqui tentamos sempre, independentemente do PDF ter dado certo)
    try {
      const hqResp = await fetch(API_BASE + HQ_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json',
                   'Accept': 'application/zip, image/webp, image/png, application/pdf, application/octet-stream' },
        body: JSON.stringify(payload)
      });
      if (!hqResp.ok) throw new Error(String(hqResp.status));

      const ct = (hqResp.headers.get('content-type') || '').toLowerCase();
      const ext = ct.includes('zip') ? 'zip'
               : ct.includes('webp') ? 'webp'
               : ct.includes('png') ? 'png'
               : ct.includes('pdf') ? 'pdf'
               : 'bin';
      const hqBlob = await hqResp.blob();
      await baixarArquivo(hqBlob, `Jornada_HQ_${stamp()}.${ext}`);
    } catch (e) {
      // tenta fallback se ainda não estivermos nele
      if (API_BASE !== API_FALLBACK) {
        try {
          API_BASE = API_FALLBACK;
          const hqResp2 = await fetch(API_BASE + HQ_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json',
                       'Accept': 'application/zip, image/webp, image/png, application/pdf, application/octet-stream' },
            body: JSON.stringify(payload)
          });
          if (hqResp2.ok) {
            const ct2 = (hqResp2.headers.get('content-type') || '').toLowerCase();
            const ext2 = ct2.includes('zip') ? 'zip'
                      : ct2.includes('webp') ? 'webp'
                      : ct2.includes('png') ? 'png'
                      : ct2.includes('pdf') ? 'pdf'
                      : 'bin';
            const hqBlob2 = await hqResp2.blob();
            await baixarArquivo(hqBlob2, `Jornada_HQ_${stamp()}.${ext2}`);
          } else {
            console.warn('HQ não retornou OK no fallback:', hqResp2.status);
          }
        } catch (e2) {
          console.warn('HQ falhou na primária e no fallback:', e, e2);
        }
      } else {
        console.warn('HQ falhou no fallback:', e);
      }
    }

    // 3) limpeza e retorno à Home (se pelo menos o PDF baixou)
    if (pdfok) {
      localStorage.clear();
      sessionStorage.clear();
      alert('PDF e HQ, (Observe Memória disponível) finalizados! Volta ao início.');
      location.replace('/index.html');
    } else {
      alert('Não foi possível gerar o PDF agora. Tente novamente em instantes.');
    }
  }

  // expõe função global para seu botão final chamar
  window.JORNADA_DOWNLOAD = gerarPDFEHQ;
})();
