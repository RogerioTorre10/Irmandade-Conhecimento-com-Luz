/* ============================================
/* API.js — Irmandade Conhecimento com Luz
/* Geração de PDF com SelfieCard + Respostas
/* ============================================ */

(function () {
  'use strict';

  // --------------------------------------------------
  // BASE do backend (prioridade: APP_CONFIG -> API_BASE -> fallback explícito)
  // --------------------------------------------------
  function normalizeBase(u) {
    return String(u || '').trim().replace(/\/+$/, '');
  }

  function pickApiBase() {
    // 1) config oficial do projeto
    const cfg = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ? window.APP_CONFIG.API_BASE : '';
    if (cfg) return normalizeBase(cfg);

    // 2) legado/compat
    if (window.API_BASE) return normalizeBase(window.API_BASE);

    // 3) fallback explícito (se nada existir, melhor apontar pro backend certo)
    // ⚠️ Ajuste aqui se um dia você trocar o domínio
    return normalizeBase('https://lumen-backend-api.onrender.com/api');
  }

  const API_PRIMARY = pickApiBase();

  // --------------------------------------------------
  // Rotas tentadas (base já inclui /api)
  // --------------------------------------------------
  const PDF_PATHS = [
    '/jornada/essencial/pdf',
    '/jornada-essencial/pdf',
    '/pdf',
    '/gerar-pdf'
  ];

  // --------------------------------------------------
  // Util
  // --------------------------------------------------
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
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  async function postJSON(base, path, body, opts = {}) {
    const timeout = opts.timeout || 30000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    const url = base + path;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        // tenta extrair mensagem (sem quebrar)
        let extra = '';
        try { extra = await res.text(); } catch {}
        const err = new Error(`HTTP ${res.status}`);
        err.status = res.status;
        err.url = url;
        err.body = extra;
        throw err;
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      // PDF
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        return { data: blob, filename: opts.filename };
      }

      // JSON
      if (contentType.includes('application/json')) {
        const json = await res.json();
        return { data: json };
      }

      // texto/outros
      const text = await res.text();
      return { data: text };
    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  // --------------------------------------------------
  // API pública
  // --------------------------------------------------
  async function gerarPDFEHQ(payload) {
    const base = API_PRIMARY;
    let lastErr = null;

    // payload esperado:
    // { nome, guia, respostas, selfieCard }
    const safePayload = payload || {};
    const fileNameBase = (safePayload.nome ? String(safePayload.nome).trim() : 'jornada');
    const fname = `${fileNameBase}-${new Date().toISOString().slice(0,10)}.pdf`;

    for (const path of PDF_PATHS) {
      try {
        const { data } = await postJSON(base, path, safePayload, { timeout: 30000, filename: fname });

        // backend devolveu { url: "..." }
        if (data && typeof data === 'object' && typeof data.url === 'string') {
          // baixa via url
          const r = await fetch(data.url);
          if (!r.ok) throw new Error(`Download URL falhou: HTTP ${r.status}`);
          const blob = await r.blob();
          triggerDownload(blob, fname);
          return { ok: true, downloaded: true, via: 'url', path, base };
        }

        // backend devolveu PDF (Blob)
        if (data instanceof Blob) {
          triggerDownload(data, fname);
          return { ok: true, downloaded: true, via: 'blob', path, base, filename: fname };
        }

        // devolveu JSON/texto (debug)
        return { ok: true, downloaded: false, via: 'json/text', path, base, data };
      } catch (e) {
        lastErr = e;
        // backoff curto
        await sleep(120);
      }
    }

    return {
      ok: false,
      base,
      error: String(lastErr && lastErr.message || lastErr),
      details: lastErr && (lastErr.url || lastErr.body) ? { url: lastErr.url, body: lastErr.body } : undefined
    };
  }

  // Expondo
  window.API = window.API || {};
  window.API.gerarPDFEHQ = gerarPDFEHQ;

  // Log de sanidade (ajuda no diagnóstico)
  try {
    console.log('[API] pronto · PRIMARY=', API_PRIMARY, '· PDF_PATHS=', PDF_PATHS);
  } catch {}

})();
