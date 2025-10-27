/* /assets/js/api.js
   Expondo: window.API com health(), gerarPDFEHQ(), etc.
   Compatível com micro-boot (usa APP_CONFIG.API_BASE / API_FALLBACK).
*/
(function () {
  'use strict';

  // ---------- Config / Descoberta ----------
  const APP = (window.APP_CONFIG || {});
  const API_PRIMARY  = String(APP.API_BASE     || 'https://conhecimento-com-luz-api.onrender.com').replace(/\/+$/,'');
  const API_FALLBACK = String(APP.API_FALLBACK || API_PRIMARY).replace(/\/+$/,'');

  // Candidatos conhecidos para health (ordem de tentativa)
  const HEALTH_PATHS = ['/health', '/healthz', '/status', '/.well-known/health', '/api/health'];

  // Candidatos comuns para geração de PDF/HQ
  const PDF_PATHS = ['/generate-pdf-hq', '/generate-pdf', '/pdf/generate', '/generate'];

  // ---------- Utils ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function join(...parts) {
    return parts
      .filter(Boolean)
      .map((p, i) => (i === 0 ? String(p).replace(/\/+$/,'') : String(p).replace(/^\/+/,'')))
      .join('/');
  }

  function withTimeout(ms, controller = new AbortController()) {
    const t = setTimeout(() => controller.abort(), ms);
    return { controller, clear: () => clearTimeout(t) };
  }

  function pickFilenameFromHeaders(r, fallback) {
    const cd = r.headers.get('content-disposition') || '';
    const m = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
    if (m && m[1]) return decodeURIComponent(m[1]);
    return fallback;
  }

  async function handleBody(r) {
    if (r.status === 204) return null;
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/pdf')) return r.blob();
    if (ct.includes('application/json')) return r.json();
    return r.text();
  }

  // ---------- HTTP helpers ----------
  async function getJSON(base, path, { timeout = 4000 } = {}) {
    const url = join(base, path);
    const { controller, clear } = withTimeout(timeout);
    try {
      const r = await fetch(url, { method: 'GET', cache: 'no-store', headers: { 'Accept': 'application/json' }, signal: controller.signal });
      if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
      const ct = r.headers.get('content-type') || '';
      clear();
      return ct.includes('application/json') ? r.json() : { ok: true };
    } finally { clear(); }
  }

  async function postJSON(base, path, body, { timeout = 15000 } = {}) {
    const url = join(base, path);
    const { controller, clear } = withTimeout(timeout);
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, application/pdf'
        },
        body: JSON.stringify(body || {}),
        signal: controller.signal
      });
      if (!r.ok) throw new Error(`POST ${url} -> ${r.status}`);
      const data = await handleBody(r);
      // anexa possível filename vindo do servidor
      const filename = pickFilenameFromHeaders(r, null);
      clear();
      return { data, filename };
    } finally { clear(); }
  }

  // ---------- API pública ----------
  async function health() {
    // Tenta PRIMARY primeiro, depois FALLBACK; em cada base, varre HEALTH_PATHS
    const tryBase = async (base) => {
      for (const p of HEALTH_PATHS) {
        try {
          await getJSON(base, p, { timeout: 3000 });
          // sucesso: fixa window.API_BASE nessa base
          window.API_BASE = base;
          console.info('[API Health] OK:', join(base, p));
          return { ok: true, base, path: p };
        } catch { /* tenta próximo */ }
      }
      throw new Error(`Health não encontrado em ${base}`);
    };

    try {
      return await tryBase(API_PRIMARY);
    } catch (_) {
      try {
        return await tryBase(API_FALLBACK);
      } catch (e2) {
        const tried = [API_PRIMARY, API_FALLBACK].map(b => HEALTH_PATHS.map(p => join(b,p))).flat();
        const msg = `Health indisponível. Tentativas: ${tried.join(', ')}`;
        console.warn('[API Health]', msg);
        return { ok: false, base: API_FALLBACK, error: msg };
      }
    }
  }

  // Gera PDF/HQ. Tenta caminhos comuns; baixa se vier PDF.
  async function gerarPDFEHQ(payload) {
    const base = (window.API_BASE || API_PRIMARY).replace(/\/+$/,'');
    let lastErr = null;

    for (const path of PDF_PATHS) {
      try {
        const { data, filename } = await postJSON(base, path, payload || {}, { timeout: 30000 });

        // Caso o backend retorne um objeto com { url } para download direto
        if (data && typeof data === 'object' && data.url && typeof data.url === 'string') {
          triggerDownloadURL(data.url);
          return { ok: true, downloaded: true, via: 'url', path, base };
        }

        // Se veio PDF (Blob), baixa
        if (data instanceof Blob) {
          const fname = filename || `jornada-${new Date().toISOString().slice(0,10)}.pdf`;
          triggerDownloadBlob(data, fname);
          return { ok: true, downloaded: true, via: 'blob', path, base, filename: fname };
        }

        // Se veio JSON/texto, devolve para o chamador
        return { ok: true, data, via: 'json/text', path, base };
      } catch (e) {
        lastErr = e;
        await sleep(120); // pequeno backoff entre tentativas
      }
    }

    return { ok: false, base, error: String(lastErr && lastErr.message || lastErr) };
  }

  function triggerDownloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename || 'arquivo.pdf';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
  }

  function triggerDownloadURL(url) {
    const a = document.createElement('a');
    a.href = url;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => a.remove(), 0);
  }

  // ---------- Exposição ----------
  window.API = {
    API_PRIMARY,
    API_FALLBACK,
    health,
    gerarPDFEHQ,
  };

  // Compat: garante coerência mesmo se chamarem antes do micro-boot setar
  window.API_BASE = window.API_BASE || API_PRIMARY;

  console.log('[API] pronto · PRIMARY=', API_PRIMARY, '· FALLBACK=', API_FALLBACK);
})();


