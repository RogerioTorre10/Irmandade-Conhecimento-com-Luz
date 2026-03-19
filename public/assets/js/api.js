/* ============================================
/* API.js — Irmandade Conhecimento com Luz (BLINDADO)
/* Geração de PDF com SelfieCard + Respostas
/* ============================================ */

(function () {
  'use strict';

  // --------------------------------------------------
  // BASE API
  // --------------------------------------------------
  function normalizeBase(u) {
    return String(u || '').trim().replace(/\/+$/, '');
  }

  function pickApiBase() {
    const cfg = (window.APP_CONFIG && window.APP_CONFIG.API_BASE)
      ? window.APP_CONFIG.API_BASE
      : '';

    if (cfg) return normalizeBase(cfg);
    if (window.API_BASE) return normalizeBase(window.API_BASE);

    return normalizeBase('https://lumen-backend-api.onrender.com/api');
  }

  const API_PRIMARY = pickApiBase();

  // --------------------------------------------------
  // ROTAS
  // --------------------------------------------------
  const PDF_PATHS = ['/jornada/essencial/pdf'];

  // --------------------------------------------------
  // UTIL
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

  function isPdf(res) {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    return ct.includes('application/pdf');
  }

  async function postJSON(base, path, body, timeout = 60000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(base + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });

      clearTimeout(timer);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      if (isPdf(res)) {
        return { data: await res.blob() };
      }

      return { data: await res.json() };

    } catch (e) {
      clearTimeout(timer);
      throw e;
    }
  }

  // --------------------------------------------------
  // PDF + HQ
  // --------------------------------------------------
  async function gerarPDFEHQ(payload) {

    const safePayload = {
      ...(payload || {}),

      // 🔥 GARANTE ENVIO DA SELFIE
      selfieCard:
        payload?.selfieCard ||
        localStorage.getItem('selfieBase64') ||
        null
    };

    const fileName =
      (safePayload.nome || 'jornada')
        .toString()
        .replace(/[^\p{L}\p{N}_-]+/gu, '_')
        .slice(0, 40);

    const fname = `${fileName}-${new Date().toISOString().slice(0,10)}.pdf`;

    for (const path of PDF_PATHS) {
      try {
        const { data } = await postJSON(API_PRIMARY, path, safePayload, 60000);

        // PDF direto
        if (data instanceof Blob) {
          triggerDownload(data, fname);
          return { ok: true, via: 'blob' };
        }

        // URL retornada pelo backend
        if (data && data.url) {
          window.open(data.url, '_blank');
          return { ok: true, via: 'url' };
        }

      } catch (e) {
        console.warn('[API] tentativa falhou', e);
        await sleep(200);
      }
    }

    return { ok: false };
  }

  // --------------------------------------------------
  // DEVOLUTIVA (UNIFICADA)
  // --------------------------------------------------
  async function gerarDevolutivaBase(payload, path) {
    try {
      const { data } = await postJSON(API_PRIMARY, path, payload, 120000);

      return {
        ok: true,
        texto: data?.devolutiva || data?.devolutivaBloco || '',
        guia: data?.guia || payload?.guia || 'lumen'
      };

    } catch (e) {
      console.warn('[API] erro devolutiva', {
        message: e?.message,
        status: e?.status,
        body: e?.body
      });

      return {
        ok: false,
        error: String(e?.message || 'Erro desconhecido')
      };
    }
  }

  // --------------------------------------------------
  // EXPORT GLOBAL
  // --------------------------------------------------
  window.API = window.API || {};

  window.API.gerarPDFEHQ = gerarPDFEHQ;

  window.API.gerarDevolutiva = (payload) =>
    gerarDevolutivaBase(payload, '/jornada/devolutiva');

  window.API.gerarDevolutivaBloco = (payload) =>
    gerarDevolutivaBase(payload, '/jornada/devolutiva-bloco');

  // --------------------------------------------------
  // LOG
  // --------------------------------------------------
  console.log('[API] BLINDADO OK →', API_PRIMARY);

})();
