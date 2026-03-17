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
  '/jornada/essencial/pdf'
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

  function triggerDownloadUrl(url, filename) {
    // tenta baixar via <a>, e se o browser abrir em aba, ainda assim funciona pra PDF
    const a = document.createElement('a');
    a.href = url;
    if (filename) a.download = filename;
    a.rel = 'noopener';
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function guessPdfFromHeaders(res) {
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    const cd = (res.headers.get('content-disposition') || '').toLowerCase();
    if (ct.includes('application/pdf')) return true;
    if (cd.includes('.pdf')) return true; // ex.: attachment; filename="xxx.pdf"
    if (ct.includes('application/octet-stream') && cd.includes('attachment')) return true;
    return false;
  }

  async function postJSON(base, path, body, opts = {}) {
  const timeout = Number(opts.timeout || 45000);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort('timeout'), timeout);

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
      try {
        extra = await res.text();
      } catch {}

      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.url = url;
      err.body = extra;
      throw err;
    }

    const contentType = ((res.headers.get('content-type') || '').toLowerCase());

    // JSON
    if (contentType.includes('application/json')) {
      const json = await res.json();
      return { data: json };
    }

    // PDF (ou octet-stream que pareça PDF)
    if (guessPdfFromHeaders(res)) {
      const blob = await res.blob();
      return { data: blob, filename: opts.filename };
    }

    // texto/outros
    const text = await res.text();
    return { data: text };

  } catch (e) {
    clearTimeout(timer);

    if (e?.name === 'AbortError') {
      const err = new Error(`Timeout após ${timeout}ms`);
      err.name = 'AbortError';
      err.status = 408;
      err.url = url;
      throw err;
    }

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

    const fileNameBase =
      (safePayload.nome ? String(safePayload.nome).trim() : 'jornada')
        .replace(/[^\p{L}\p{N}_-]+/gu, '_')
        .slice(0, 40) || 'jornada';

    const fname = `${fileNameBase}-${new Date().toISOString().slice(0,10)}.pdf`;

    for (const path of PDF_PATHS) {
      try {
        const { data } = await postJSON(base, path, safePayload, {
          timeout: 60000,     // 💎 mais seguro no Render
          filename: fname
        });

        // backend devolveu { url: "..." }
        if (data && typeof data === 'object' && typeof data.url === 'string') {
          // tenta baixar via fetch->blob (mais garantido), senão abre link
          try {
            const r = await fetch(data.url, { cache: 'no-store' });
            if (!r.ok) throw new Error(`Download URL falhou: HTTP ${r.status}`);
            const blob = await r.blob();
            triggerDownload(blob, fname);
            return { ok: true, downloaded: true, via: 'url+blob', path, base };
          } catch (e) {
            triggerDownloadUrl(data.url, fname);
            return { ok: true, downloaded: true, via: 'url', path, base, warn: String(e?.message || e) };
          }
        }

        // backend devolveu PDF (Blob)
        if (data instanceof Blob) {
          triggerDownload(data, fname);
          return { ok: true, downloaded: true, via: 'blob', path, base, filename: fname };
        }

        // devolveu texto/qualquer coisa (debug)
        return { ok: true, downloaded: false, via: 'text', path, base, data };
      } catch (e) {
        lastErr = e;
        await sleep(150);
      }
    }

    return {
      ok: false,
      base,
      error: String((lastErr && lastErr.message) || lastErr || 'unknown'),
      details: (lastErr && (lastErr.url || lastErr.body))
        ? { url: lastErr.url, body: lastErr.body }
        : undefined
    };
  }
  
// --------------------------------------------------
// Devolutiva do Guia (Lumen / Zion / Arion)
// --------------------------------------------------

async function gerarDevolutiva(payload) {
  const base = API_PRIMARY;

  try {
    const { data } = await postJSON(
      base,
      '/jornada/devolutiva',
      payload,
      { timeout: 120000 }
    );

    if (data && data.devolutiva) {
      return {
        ok: true,
        texto: data.devolutiva,
        guia: data.guia || payload?.guia || 'lumen'
      };
    }

    return {
      ok: false,
      error: 'Resposta sem devolutiva',
      raw: data
    };

  } catch (e) {
    console.warn('[API] devolutiva falhou', {
      message: e?.message,
      status: e?.status,
      body: e?.body,
      url: e?.url,
      raw: e
    });

    return {
      ok: false,
      error: String(e?.body || e?.message || e || 'Erro desconhecido')
    };
  }
}

async function gerarDevolutivaBloco(payload) {
  const base = API_PRIMARY;

  try {
    const { data } = await postJSON(
      base,
      '/jornada/devolutiva-bloco',
      payload,
      { timeout: 120000 }
    );

    if (data && data.devolutivaBloco) {
      return {
        ok: true,
        texto: data.devolutivaBloco,
        guia: data.guia || payload?.guia || 'lumen'
      };
    }

    return {
      ok: false,
      error: 'Resposta sem devolutiva de bloco',
      raw: data
    };

  } catch (e) {
    console.warn('[API] devolutiva do bloco falhou', {
      message: e?.message,
      status: e?.status,
      body: e?.body,
      url: e?.url,
      raw: e
    });

    return {
      ok: false,
      error: String(e?.body || e?.message || e || 'Erro desconhecido')
    };
  }
}
  
window.API = window.API || {};
window.API.gerarPDFEHQ = gerarPDFEHQ;
window.API.gerarDevolutiva = gerarDevolutiva;
window.API.gerarDevolutivaBloco = gerarDevolutivaBloco;
  // Log de sanidade
  try {
    console.log('[API] pronto · PRIMARY=', API_PRIMARY, '· PDF_PATHS=', PDF_PATHS);
  } catch {}

})();
