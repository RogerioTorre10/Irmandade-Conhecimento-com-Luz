/* /assets/js/api.js
   Expondo: window.API com health(), gerarPDFEHQ(), etc.
   Compatível com o micro-boot (usa API_PRIMARY / API_FALLBACK).
*/
(function () {
  'use strict';

  // ---------- Descoberta de bases ----------
  const APP = (window.APP_CONFIG || {});
  // Base principal (prod ou local via config.local.js)
  const API_PRIMARY  = String(APP.API_BASE || 'https://conhecimento-com-luz-api.onrender.com').replace(/\/+$/,'');
  // Fallback (pode ser o mesmo endpoint; ajuste aqui se tiver um espelho)
  const API_FALLBACK = String(APP.API_FALLBACK || API_PRIMARY).replace(/\/+$/,'');

  // ---------- Helpers HTTP ----------
  async function getJSON(base, path) {
    const url = base + path;
    const r = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
    if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`);
    return r.headers.get('content-type')?.includes('application/json') ? r.json() : { ok: true };
  }

  async function postJSON(base, path, body) {
    const url = base + path;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, application/pdf' },
      body: JSON.stringify(body || {}),
    });
    if (!r.ok) throw new Error(`POST ${url} -> ${r.status}`);
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('application/pdf')) return r.blob();
    if (ct.includes('application/json')) return r.json();
    return r.text();
  }

  // ---------- API pública ----------
  async function health() {
    // Tenta principal; se falhar, tenta fallback. Sempre retorna { ok: boolean, base: string }
    try {
      await getJSON(API_PRIMARY, '/health');
      return { ok: true, base: API_PRIMARY };
    } catch (_) {
      try {
        await getJSON(API_FALLBACK, '/health');
        return { ok: true, base: API_FALLBACK };
      } catch (e) {
        return { ok: false, base: API_FALLBACK, error: String(e && e.message || e) };
      }
    }
  }

  // Gera PDF + HQ no backend — ajuste o path se seu servidor usar outro
  async function gerarPDFEHQ(payload) {
    // Usa a base escolhida pelo micro-boot (se já setou), senão cai no PRIMARY
    const base = (window.API_BASE || API_PRIMARY).replace(/\/+$/,'');
    // Endpoints comuns: /generate, /generate-pdf, /pdf/generate — personalize se preciso
    // Aqui usamos /generate-pdf-hq por padrão:
    const blob = await postJSON(base, '/generate-pdf-hq', payload || {});
    // Se veio blob (PDF), baixa no navegador
    if (blob instanceof Blob) {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `jornada-${new Date().toISOString().slice(0,10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
      return { ok: true, downloaded: true };
    }
    return { ok: true, data: blob };
  }

  // Exposição compatível com o micro-boot
  window.API = {
    API_PRIMARY,
    API_FALLBACK,
    health,
    gerarPDFEHQ,
  };

  // Compat: alguns trechos leem window.API_BASE depois do health()
  // (o micro-boot seta isso, mas se chamarem direto daqui, fica coerente)
  window.API_BASE = window.API_BASE || API_PRIMARY;

  console.log('[API] pronto · PRIMARY=', API_PRIMARY, '· FALLBACK=', API_FALLBACK);
})();
