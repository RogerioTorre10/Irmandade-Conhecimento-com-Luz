// =============================================
// API.js — Irmandade Conhecimento com Luz
// Geração de PDF com SelfieCard + Respostas
// =============================================

(function () {

  const API_PRIMARY = (window.API_BASE || '/api').replace(/\/+$/, '');

  const PDF_PATHS = [
    '/jornada/essencial/pdf',
    '/jornada-essencial/pdf',
    '/pdf',
    '/gerar-pdf'
  ];

  // -----------------------------------------
  // Util
  // -----------------------------------------

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'jornada.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function postJSON(base, path, body, opts = {}) {
    const controller = new AbortController();
    const timeout = opts.timeout || 30000;

    const timer = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/pdf')) {
      return { data: await res.blob() };
    }

    if (contentType.includes('application/json')) {
      return { data: await res.json() };
    }

    return { data: await res.text() };
  }

  // -----------------------------------------
  // Normalização do payload
  // -----------------------------------------

  function buildPayload(state) {

    let selfie = state?.selfieBase64 || '';

    // Remove prefixo data:image/... se existir
    if (typeof selfie === 'string' && selfie.includes('base64,')) {
      selfie = selfie.split('base64,')[1];
    }

    return {
      nome: (state?.nome || '').trim(),
      guia: (state?.guiaSelecionado || '').trim(),
      respostas: Array.isArray(state?.respostas) ? state.respostas : [],
      selfieCard: selfie || ''
    };
  }

  // -----------------------------------------
  // Geração do PDF
  // -----------------------------------------

  async function gerarPDFEHQ(payloadOrState) {

    const base = API_PRIMARY;
    let lastErr = null;

    // Permite enviar state inteiro ou payload pronto
    const payload = payloadOrState?.respostas
      ? payloadOrState
      : buildPayload(payloadOrState);

    for (const path of PDF_PATHS) {

      try {

        const { data } = await postJSON(base, path, payload, { timeout: 30000 });

        // Backend retornou URL direta
        if (data && typeof data === 'object' && data.url) {
          window.location.href = data.url;
          return { ok: true, via: 'url', path };
        }

        // Veio PDF Blob
        if (data instanceof Blob) {
          const filename = `jornada-${new Date().toISOString().slice(0,10)}.pdf`;
          triggerDownload(data, filename);
          return { ok: true, via: 'blob', path };
        }

        // Veio JSON/texto
        return { ok: true, via: 'json/text', data, path };

      } catch (e) {
        lastErr = e;
        await sleep(150);
      }
    }

    return {
      ok: false,
      error: String(lastErr?.message || lastErr)
    };
  }

  // -----------------------------------------
  // Exporta global
  // -----------------------------------------

  window.API = {
    gerarPDFEHQ,
    buildPayload
  };

})();
