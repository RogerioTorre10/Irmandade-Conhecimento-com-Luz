/* =====================================================================================
   section-final.js (clean / robust)
   - Reata botões mesmo quando JC.attachButtonEvents = 0
   - PDF/HQ via API.gerarPDFEHQ(payload) com guard-rail "diamante"
   - SelfieCard download local (dataURL ou base64)
   - Datilografia + TTS (runTyping/speakText se existirem; fallback)
   ===================================================================================== */
(() => {
  'use strict';

  // ---------------------------------------------
  // CONFIG
  // ---------------------------------------------
  const SECTION_ID = 'section-final';

  // Keys mais comuns no seu projeto
  const LS_KEYS = {
    nome: ['JORNADA_NOME', 'JORNADA_NAME', 'NOME', 'USER_NAME'],
    guia: ['JORNADA_GUIA', 'JORNADA_GUIDE', 'GUIA', 'GUIDE'],
    respostas: [
      'JORNADA_RESPOSTAS',
      'JORNADA_ANSWERS',
      'JOURNEY_ANSWERS',
      'RESPOSTAS',
      'ANSWERS'
    ],
    selfie: [
      'JORNADA_SELFIE',
      'JORNADA_SELFIE_DATAURL',
      'SELFIE_DATAURL',
      'SELFIE',
      'SELFIE_BASE64'
    ]
  };

  // IDs esperados (mantém compatibilidade com sua UI)
  const UI_IDS = {
    btnPdf: '#btnBaixarPDFHQ',
    btnSelfie: '#btnSelfieCard',
    status: '#finalStatus',
    // área onde o texto final aparece (tentamos várias)
    textTargets: ['#finalTexto', '#final-texto', '.final-texto', '.jp-typing', '[data-final-text]']
  };

  // ---------------------------------------------
  // HELPERS (DOM)
  // ---------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function getSectionRoot() {
    return document.getElementById(SECTION_ID) || document.querySelector(`#${SECTION_ID}`) || null;
  }

  function setStatus(msg) {
    const root = getSectionRoot();
    const el = root && $(UI_IDS.status, root);
    if (el) el.textContent = String(msg || '');
  }

  function disableButton(btn, disabled, labelWhenDisabled) {
    if (!btn) return;
    btn.disabled = !!disabled;
    btn.classList.toggle('is-loading', !!disabled);

    // preserva rótulo original
    if (!btn.__origText) btn.__origText = btn.textContent;
    if (disabled && labelWhenDisabled) btn.textContent = labelWhenDisabled;
    if (!disabled) btn.textContent = btn.__origText || btn.textContent;
  }

  // ---------------------------------------------
  // HELPERS (storage / parsing)
  // ---------------------------------------------
  function lsGetFirst(keys) {
    for (const k of keys) {
      try {
        const v = localStorage.getItem(k);
        if (v !== null && v !== undefined && String(v).trim() !== '') return v;
      } catch (_) {}
    }
    return null;
  }

  function tryJSONParse(value) {
    if (value == null) return null;
    if (typeof value === 'object') return value;
    const s = String(value).trim();
    if (!s) return null;
    try {
      return JSON.parse(s);
    } catch (_) {
      return null;
    }
  }

  function toArrayOfStrings(x) {
    // guard-rail "diamante": sempre array<string>
    if (x == null) return [];
    if (Array.isArray(x)) return x.map(v => String(v ?? '')).filter(s => s.trim() !== '');
    if (typeof x === 'object') {
      // caso venha como map {q1: "...", q2:"..."} -> pega values
      const vals = Object.values(x).map(v => String(v ?? '')).filter(s => s.trim() !== '');
      if (vals.length) return vals;
    }
    const s = String(x).trim();
    if (!s) return [];
    return [s];
  }

  function normalizeSelfie(selfie) {
    // aceita:
    // - data:image/...;base64,...
    // - base64 puro
    // - objeto { dataUrl, base64, mime }
    if (!selfie) return null;

    if (typeof selfie === 'object') {
      const dataUrl = selfie.dataUrl || selfie.dataURL || selfie.data_uri || selfie.uri;
      if (dataUrl && String(dataUrl).startsWith('data:image/')) return String(dataUrl);

      const b64 = selfie.base64 || selfie.b64;
      const mime = selfie.mime || selfie.type || 'image/jpeg';
      if (b64 && String(b64).length > 50) {
        const clean = String(b64).replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
        return `data:${mime};base64,${clean}`;
      }
      return null;
    }

    const s = String(selfie).trim();
    if (!s) return null;
    if (s.startsWith('data:image/')) return s;

    // base64 puro
    if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s/g, '').length > 200) {
      const clean = s.replace(/\s/g, '').replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      return `data:image/jpeg;base64,${clean}`;
    }

    return null;
  }

  // ---------------------------------------------
  // COLETA (múltiplas fontes)
  // ---------------------------------------------
  function collectNomeGuia() {
    const nome = (lsGetFirst(LS_KEYS.nome) || '').trim();
    const guia = (lsGetFirst(LS_KEYS.guia) || '').trim();

    // tenta também globais, se existirem
    const gNome =
      (window.JORNADA_NOME && String(window.JORNADA_NOME).trim()) ||
      (window.JORNADA?.nome && String(window.JORNADA.nome).trim()) ||
      (window.state?.nome && String(window.state.nome).trim());

    const gGuia =
      (window.JORNADA_GUIA && String(window.JORNADA_GUIA).trim()) ||
      (window.JORNADA?.guia && String(window.JORNADA.guia).trim()) ||
      (window.state?.guia && String(window.state.guia).trim());

    return {
      nome: (gNome || nome || '').trim(),
      guia: (gGuia || guia || '').trim()
    };
  }

  function collectRespostas() {
    // 1) globais prováveis
    const candidates = [
      window.JORNADA_RESPOSTAS,
      window.JORNADA_ANSWERS,
      window.JORNADA?.respostas,
      window.JORNADA?.answers,
      window.state?.respostas,
      window.state?.answers,
      window.JORNADA_STATE?.answers,
      window.JORNADA_STATE?.respostas
    ];

    for (const c of candidates) {
      const arr = toArrayOfStrings(c);
      if (arr.length) return arr;
    }

    // 2) localStorage (JSON ou texto)
    const raw = lsGetFirst(LS_KEYS.respostas);
    const parsed = tryJSONParse(raw);
    const arr2 = toArrayOfStrings(parsed ?? raw);
    if (arr2.length) return arr2;

    // 3) fallback: tenta pegar de campos DOM (se existir histórico renderizado)
    const root = getSectionRoot();
    if (root) {
      const fromDom = $$('[data-answer]', root).map(el => el.getAttribute('data-answer'));
      const arr3 = toArrayOfStrings(fromDom);
      if (arr3.length) return arr3;
    }

    return [];
  }

  function collectSelfie() {
    const candidates = [
      window.JORNADA_SELFIE,
      window.JORNADA?.selfie,
      window.state?.selfie,
      window.JORNADA_STATE?.selfie
    ];

    for (const c of candidates) {
      const s = normalizeSelfie(c);
      if (s) return s;
    }

    const raw = lsGetFirst(LS_KEYS.selfie);
    const parsed = tryJSONParse(raw);
    const s2 = normalizeSelfie(parsed ?? raw);
    if (s2) return s2;

    return null;
  }

  function buildDiamantePayload() {
    const { nome, guia } = collectNomeGuia();
    const respostas = collectRespostas();
    const selfieDataUrl = collectSelfie();

    // Guard-rail “diamante”
    const payload = {
      meta: {
        nome: String(nome || ''),
        guia: String(guia || ''),
        // timestamp local (UTC-3 no seu padrão, mas aqui deixamos ISO local do browser)
        ts: new Date().toISOString()
      },
      respostas: toArrayOfStrings(respostas),
      selfie: selfieDataUrl ? String(selfieDataUrl) : null
    };

    // garante tipos
    if (!Array.isArray(payload.respostas)) payload.respostas = [];
    payload.respostas = payload.respostas.map(s => String(s ?? ''));

    return payload;
  }

  // ---------------------------------------------
  // DOWNLOAD helpers
  // ---------------------------------------------
  function downloadDataUrl(dataUrl, filename) {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'arquivo';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // ---------------------------------------------
  // DATILOGRAFIA + TTS (fallback)
  // ---------------------------------------------
  async function runFinalTyping(root) {
    root = root || getSectionRoot();
    if (!root) return;

    // acha um alvo de texto razoável
    let target = null;
    for (const sel of UI_IDS.textTargets) {
      target = $(sel, root);
      if (target) break;
    }
    if (!target) return;

    const text =
      (target.getAttribute('data-text') || target.textContent || '').trim();

    if (!text) return;

    // Se existir runTyping, usa; senão apenas garante texto
    const runTyping = window.runTyping || window.JORNADA_TYPING?.runTyping;
    const speakText = window.speakText || window.JORNADA_TTS?.speakText;

    try {
      if (typeof runTyping === 'function') {
        // assinatura tolerante: (el, text, opts)
        await runTyping(target, text, { speak: true });
        return;
      }

      target.textContent = text;

      if (typeof speakText === 'function') {
        try { await speakText(text); } catch (_) {}
      }
    } catch (_) {
      // fallback silencioso
      target.textContent = text;
    }
  }

  // ---------------------------------------------
  // ACTIONS
  // ---------------------------------------------
  async function onClickPDF(ev) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const root = getSectionRoot();
    const btn = root && $(UI_IDS.btnPdf, root);

    disableButton(btn, true, 'GERANDO PDF…');
    setStatus('Gerando PDF/HQ…');

    const payload = buildDiamantePayload();

    try {
      if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
        throw new Error('API.gerarPDFEHQ não está disponível (window.API)');
      }

      // Chamando API (ela pode:
      // - disparar download automaticamente; ou
      // - retornar { url } / { dataUrl } / Blob; então tentamos lidar)
      const res = await window.API.gerarPDFEHQ(payload);

      // Tentativas de compatibilidade: url / dataUrl / blob
      if (res && typeof res === 'object') {
        if (res.dataUrl && String(res.dataUrl).startsWith('data:application/pdf')) {
          downloadDataUrl(String(res.dataUrl), `Jornada-${payload.meta.nome || 'Participante'}.pdf`);
        } else if (res.url && typeof res.url === 'string') {
          // abre em nova aba (se for download direto, melhor ainda)
          window.open(res.url, '_blank', 'noopener,noreferrer');
        } else if (res.blob instanceof Blob) {
          const url = URL.createObjectURL(res.blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
      }

      setStatus('PDF/HQ gerado. Se não baixou automaticamente, verifique a nova aba/pop-up.');
    } catch (err) {
      console.error('[section-final] Erro ao gerar PDF/HQ:', err);
      setStatus(`Falha ao gerar PDF/HQ: ${err?.message || err}`);
      alert(`Falha ao gerar PDF/HQ.\n\n${err?.message || err}`);
    } finally {
      disableButton(btn, false);
      // limpa status depois de um tempo (não obrigatório)
      setTimeout(() => setStatus(''), 2500);
    }
  }

  function onClickSelfie(ev) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const root = getSectionRoot();
    const btn = root && $(UI_IDS.btnSelfie, root);

    disableButton(btn, true, 'BAIXANDO…');
    setStatus('Preparando SelfieCard…');

    try {
      const { nome } = collectNomeGuia();
      const selfie = collectSelfie();
      if (!selfie) {
        throw new Error('Selfie não encontrada (nem global nem localStorage).');
      }

      const safeName = (nome || 'Participante').replace(/[^\w\-]+/g, '_');
      downloadDataUrl(selfie, `SelfieCard-${safeName}.png`);

      setStatus('SelfieCard baixado.');
    } catch (err) {
      console.error('[section-final] Erro ao baixar SelfieCard:', err);
      setStatus(`Falha ao baixar SelfieCard: ${err?.message || err}`);
      alert(`Falha ao baixar SelfieCard.\n\n${err?.message || err}`);
    } finally {
      disableButton(btn, false);
      setTimeout(() => setStatus(''), 2500);
    }
  }

  // ---------------------------------------------
  // BIND (robusto: reata sempre que a seção aparecer)
  // ---------------------------------------------
  function bindUIOnce(root) {
    if (!root) return;
    if (root.__finalBound) return;
    root.__finalBound = true;

    const btnPdf = $(UI_IDS.btnPdf, root);
    const btnSelfie = $(UI_IDS.btnSelfie, root);

    if (btnPdf) btnPdf.addEventListener('click', onClickPDF);
    if (btnSelfie) btnSelfie.addEventListener('click', onClickSelfie);

    // tenta typing/TTS ao entrar
    runFinalTyping(root).catch(() => {});
  }

  function tryBindNow() {
    const root = getSectionRoot();
    if (!root) return false;
    bindUIOnce(root);
    return true;
  }

  // Observa DOM (caso a seção seja injetada depois pelo controller)
  function observeSection() {
    if (tryBindNow()) return;

    const mo = new MutationObserver(() => {
      const ok = tryBindNow();
      if (ok) mo.disconnect();
    });

    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // Também escuta um evento padrão, caso exista no seu controller
  function hookControllerEvents() {
    const handler = (e) => {
      // se o controller emitir algo como { detail: { id: 'section-final' } }
      const id = e?.detail?.id || e?.detail?.section || e?.detail;
      if (String(id || '').includes('final')) {
        tryBindNow();
      }
    };

    // nomes comuns
    window.addEventListener('jornada:section:shown', handler);
    window.addEventListener('JC:shown', handler);
    window.addEventListener('section:shown', handler);
  }

  // ---------------------------------------------
  // EXPORT opcional (se o controller quiser chamar)
  // ---------------------------------------------
  window.JORNADA_SECTION_FINAL = {
    mount() {
      // chamado quando a seção final for exibida
      tryBindNow();
    }
  };

  // ---------------------------------------------
  // BOOT
  // ---------------------------------------------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observeSection();
      hookControllerEvents();
      tryBindNow();
    });
  } else {
    observeSection();
    hookControllerEvents();
    tryBindNow();
  }
})();
