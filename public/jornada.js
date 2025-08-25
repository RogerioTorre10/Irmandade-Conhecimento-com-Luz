/* ==========================================================================
   jornada.js  —  VERSÃO: 1.0 (25-08-2025)
   - Compatível com páginas existentes
   - Sem Tailwind (pode remover o CDN dos HTMLs)
   - Fallback automático entre BASES de API
   - Aceita JSON (urls/base64) e PDF blob
   - Limpeza robusta de estado
   ========================================================================== */
(() => {
  // =============================
  //  CONFIG
  // =============================
  const CONFIG = {
    STORAGE_KEY: 'jornada_v1_state',
    API_BASES: [
      'https://lumen-backend-api.onrender.com',
      'https://conhecimento-com-luz-api.onrender.com',
      'http://localhost:8000'
    ],
    ENDPOINTS: {
      health: ['/health', '/api/health'],
      submitEssencial: [
        '/jornada/essencial',
        '/jornada-essencial',
        '/api/v1/jornada/essencial'
      ],
      pdfHqCombo: [
        '/jornada/essencial/pdf-hq',
        '/jornada-essencial/pdf-hq',
        '/api/v1/jornada/essencial/pdf-hq'
      ]
    }
  };

  // =============================
  //  STATE
  // =============================
  const State = {
    load() {
      try { return JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEY) || '{}'); }
      catch(_) { return {}; }
    },
    save(data) { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(data || {})); },
    clear() { localStorage.removeItem(CONFIG.STORAGE_KEY); }
  };

  // =============================
  //  HELPERS
  // =============================
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  async function tryFetch(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error('HTTP ' + res.status + ' @ ' + url);
    return res;
  }

  async function pickWorkingBase() {
    for (const base of CONFIG.API_BASES) {
      for (const hp of CONFIG.ENDPOINTS.health) {
        try {
          const res = await tryFetch(base + hp, { method: 'GET' });
          if (res) return base;
        } catch(_) { /* tenta próxima rota */ }
      }
    }
    throw new Error('Nenhuma API base respondeu ao /health.');
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click();
    a.remove(); URL.revokeObjectURL(url);
  }

  function base64ToBlob(base64, mime='application/pdf') {
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i=0; i<len; i++) bytes[i] = bin.charCodeAt(i);
    return new Blob([bytes], { type: mime });
  }

  async function fetchJsonOrBlob(url, options) {
    const res = await tryFetch(url, options);
    const ct = (res.headers.get('content-type') || '').toLowerCase();
    if (ct.includes('application/json')) return { type: 'json', data: await res.json() };
    if (ct.includes('application/pdf') || ct.includes('application/octet-stream')) {
      const blob = await res.blob();
      return { type: 'blob', data: blob };
    }
    return { type: 'blob', data: await res.blob() };
  }

  // =============================
  //  SUBMISSÃO
  // =============================
  async function submitEssencial(payload, { preferCombo = true } = {}) {
    const base = await pickWorkingBase();

    const tryEndpoints = preferCombo
      ? [...CONFIG.ENDPOINTS.pdfHqCombo, ...CONFIG.ENDPOINTS.submitEssencial]
      : [...CONFIG.ENDPOINTS.submitEssencial, ...CONFIG.ENDPOINTS.pdfHqCombo];

    const opts = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, application/pdf'
      },
      body: JSON.stringify(payload)
    };

    let lastErr;
    for (const ep of tryEndpoints) {
      const url = base + ep;
      try {
        const out = await fetchJsonOrBlob(url, opts);
        return { base, ep, ...out };
      } catch (e) {
        lastErr = e; await sleep(150);
      }
    }
    throw lastErr || new Error('Falha em todos endpoints mapeados.');
  }

  // =============================
  //  DOWNLOADS
  // =============================
  async function handlePdfHqResponse(resp) {
    if (resp.type === 'blob') {
      downloadBlob(resp.data, 'jornada_saida.pdf');
      return { pdf: true, hq: false, via: 'blob' };
    }

    const j = resp.data || {};
    if (j.pdf_url) window.open(j.pdf_url, '_blank');
    if (j.hq_url) window.open(j.hq_url, '_blank');

    if (j.pdf_base64) downloadBlob(base64ToBlob(j.pdf_base64, 'application/pdf'), 'jornada.pdf');
    if (j.hq_base64) {
      const mime = j.hq_mime || 'application/pdf';
      const name = mime.includes('zip') ? 'jornada_hq.zip' : 'jornada_hq.pdf';
      downloadBlob(base64ToBlob(j.hq_base64, mime), name);
    }

    return {
      pdf: Boolean(j.pdf_url || j.pdf_base64),
      hq: Boolean(j.hq_url || j.hq_base64),
      via: 'json'
    };
  }

  // =============================
  //  UI
  // =============================
  function el(id) { return document.getElementById(id); }

  function toast(msg) {
    let t = el('toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);padding:10px 16px;border-radius:10px;background:#111;color:#fff;z-index:9999;max-width:90%;text-align:center;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    setTimeout(() => { t.style.opacity = '0'; }, 1800);
  }

  function toggleWorking(on, label='Processando…') {
    const btn = el('btn-enviar');
    const spin = el('working');
    if (btn) {
      btn.disabled = !!on;
      if (!btn.dataset.label) btn.dataset.label = btn.textContent || 'Enviar respostas';
      btn.textContent = on ? label : btn.dataset.label;
    }
    if (spin) spin.style.display = on ? 'inline-block' : 'none';
  }

  async function onClickEnviarRespostas() {
    const st = State.load();
    const answers = st.answers || [];
    toggleWorking(true, 'Enviando suas respostas…');
    try {
      const resp = await submitEssencial({ answers });
      await handlePdfHqResponse(resp);
      toast('PDF/HQ gerados com sucesso. Voltando ao início…');
      setTimeout(() => { window.location.href = '/index.html'; }, 1200);
    } catch (e) {
      console.error(e);
      toast('Falha ao gerar PDF/HQ. Tente novamente em instantes.');
    } finally {
      toggleWorking(false);
    }
  }

  function onClickLimparRespostas() {
    State.clear();
    toast('Respostas apagadas desta jornada.');
    // window.location.reload(); // se quiser recarregar
  }

  function bindButtons() {
    const enviar = el('btn-enviar');
    const limpar = el('btn-limpar');
    if (enviar && !enviar.__bound) {
      enviar.__bound = true;
      enviar.addEventListener('click', onClickEnviarRespostas);
    }
    if (limpar && !limpar.__bound) {
      limpar.__bound = true;
      limpar.addEventListener('click', onClickLimparRespostas);
    }
  }

  // =============================
  //  INIT
  // =============================
  document.addEventListener('DOMContentLoaded', () => {
    try { bindButtons(); } catch(e) { console.error(e); }
  });
})();
