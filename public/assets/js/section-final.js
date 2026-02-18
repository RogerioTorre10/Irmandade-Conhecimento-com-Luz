/* =====================================================================================
   section-final.js (ultra-robusto)
   - Garante bind mesmo se:
     • IDs mudarem / não existirem
     • section-final vier com id diferente (prefixo)
     • botões forem <button> ou <div role="button">
   ===================================================================================== */
(() => {
  'use strict';

  const TAG = '[section-final]';

  // ---------------------------------------------
  // HELPERS
  // ---------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function log(...args) { console.log(TAG, ...args); }
  function warn(...args) { console.warn(TAG, ...args); }
  function err(...args) { console.error(TAG, ...args); }

  // ---------------------------------------------
  // ACHAR ROOT (muito tolerante)
  // ---------------------------------------------
  function getFinalRoot() {
    // 1) id exato
    let el = document.getElementById('section-final');
    if (el) return el;

    // 2) qualquer id que começa com section-final
    el = document.querySelector('[id^="section-final"]');
    if (el) return el;

    // 3) data-section / data-step
    el = document.querySelector('[data-section="final"], [data-step="final"]');
    if (el) return el;

    // 4) fallback: seção visível com "final" no id/class
    el = document.querySelector('.section-final, .final, [class*="final"]');
    return el || null;
  }

  // ---------------------------------------------
  // STORAGE helpers (mesmo padrão)
  // ---------------------------------------------
  const LS_KEYS = {
    nome: ['JORNADA_NOME', 'JORNADA_NAME', 'NOME', 'USER_NAME'],
    guia: ['JORNADA_GUIA', 'JORNADA_GUIDE', 'GUIA', 'GUIDE'],
    respostas: ['JORNADA_RESPOSTAS', 'JORNADA_ANSWERS', 'RESPOSTAS', 'ANSWERS'],
    selfie: ['JORNADA_SELFIE', 'JORNADA_SELFIE_DATAURL', 'SELFIE_DATAURL', 'SELFIE', 'SELFIE_BASE64']
  };

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
    try { return JSON.parse(s); } catch (_) { return null; }
  }

  function toArrayOfStrings(x) {
    if (x == null) return [];
    if (Array.isArray(x)) return x.map(v => String(v ?? '')).filter(s => s.trim() !== '');
    if (typeof x === 'object') {
      const vals = Object.values(x).map(v => String(v ?? '')).filter(s => s.trim() !== '');
      if (vals.length) return vals;
    }
    const s = String(x).trim();
    return s ? [s] : [];
  }

  function normalizeSelfie(selfie) {
    if (!selfie) return null;

    if (typeof selfie === 'object') {
      const dataUrl = selfie.dataUrl || selfie.dataURL || selfie.uri;
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

    if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s/g, '').length > 200) {
      const clean = s.replace(/\s/g, '').replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      return `data:image/jpeg;base64,${clean}`;
    }

    return null;
  }

  function collectNomeGuia() {
    const nomeLS = (lsGetFirst(LS_KEYS.nome) || '').trim();
    const guiaLS = (lsGetFirst(LS_KEYS.guia) || '').trim();

    const nomeG =
      (window.JORNADA_NOME && String(window.JORNADA_NOME).trim()) ||
      (window.JORNADA?.nome && String(window.JORNADA.nome).trim()) ||
      (window.state?.nome && String(window.state.nome).trim()) || '';

    const guiaG =
      (window.JORNADA_GUIA && String(window.JORNADA_GUIA).trim()) ||
      (window.JORNADA?.guia && String(window.JORNADA.guia).trim()) ||
      (window.state?.guia && String(window.state.guia).trim()) || '';

    return { nome: (nomeG || nomeLS || ''), guia: (guiaG || guiaLS || '') };
  }

  function collectRespostas() {
    const candidates = [
      window.JORNADA_RESPOSTAS,
      window.JORNADA_ANSWERS,
      window.JORNADA?.respostas,
      window.JORNADA?.answers,
      window.state?.respostas,
      window.state?.answers
    ];
    for (const c of candidates) {
      const arr = toArrayOfStrings(c);
      if (arr.length) return arr;
    }

    const raw = lsGetFirst(LS_KEYS.respostas);
    const parsed = tryJSONParse(raw);
    const arr2 = toArrayOfStrings(parsed ?? raw);
    return arr2;
  }

  function collectSelfie() {
    const candidates = [
      window.JORNADA_SELFIE,
      window.JORNADA?.selfie,
      window.state?.selfie
    ];
    for (const c of candidates) {
      const s = normalizeSelfie(c);
      if (s) return s;
    }

    const raw = lsGetFirst(LS_KEYS.selfie);
    const parsed = tryJSONParse(raw);
    return normalizeSelfie(parsed ?? raw);
  }

  function buildDiamantePayload() {
    const { nome, guia } = collectNomeGuia();
    const respostas = collectRespostas();
    const selfie = collectSelfie();

    return {
      meta: { nome: String(nome || ''), guia: String(guia || ''), ts: new Date().toISOString() },
      respostas: toArrayOfStrings(respostas),
      selfie: selfie ? String(selfie) : null
    };
  }

  // ---------------------------------------------
  // DOWNLOAD
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
  // DATILOGRAFIA + TTS (tentativa)
  // ---------------------------------------------
  async function runFinalTyping(root) {
    const target =
      $('[data-final-text]', root) ||
      $('#finalTexto', root) ||
      $('#final-texto', root) ||
      $('.final-texto', root) ||
      $('.jp-typing', root);

    if (!target) {
      warn('Alvo de mensagem final não encontrado (ok se sua UI não usa typing aqui).');
      return;
    }

    const text = (target.getAttribute('data-text') || target.textContent || '').trim();
    if (!text) return;

    const runTyping = window.runTyping || window.JORNADA_TYPING?.runTyping;
    const speakText = window.speakText || window.JORNADA_TTS?.speakText;

    try {
      if (typeof runTyping === 'function') {
        await runTyping(target, text, { speak: true });
      } else {
        target.textContent = text;
        if (typeof speakText === 'function') {
          try { await speakText(text); } catch (_) {}
        }
      }
    } catch (e) {
      err('Falha no typing/TTS:', e);
      target.textContent = text;
    }
  }

  // ---------------------------------------------
  // BUTTON FINDER (resolve seu "0 botões")
  // ---------------------------------------------
  function findActionButtons(root) {
    // 1) IDs oficiais
    let btnPdf = $('#btnBaixarPDFHQ', root);
    let btnSelfie = $('#btnSelfieCard', root);

    // 2) data-action
    if (!btnPdf) btnPdf = $('[data-action="pdf"]', root);
    if (!btnSelfie) btnSelfie = $('[data-action="selfie"]', root);

    // 3) fallback por “botões visíveis”
    // aceita <button> e também <div role="button">
    const candidates = $$('.j-btn, button, [role="button"]', root)
      .filter(el => {
        const r = el.getBoundingClientRect();
        return r.width > 10 && r.height > 10; // visível o bastante
      });

    // Se ainda não achou, tenta pegar os 2 primeiros dentro do “card” central
    if ((!btnPdf || !btnSelfie) && candidates.length >= 2) {
      // Heurística: no seu print tem 2 botões lado a lado. Primeiro = pdf, segundo = selfie.
      btnPdf = btnPdf || candidates[0];
      btnSelfie = btnSelfie || candidates[1];
    }

    return { btnPdf, btnSelfie };
  }

  function disable(btn, on, label) {
    if (!btn) return;
    btn.disabled = !!on;
    btn.classList.toggle('is-loading', !!on);
    if (!btn.__origText) btn.__origText = btn.textContent;
    if (on && label) btn.textContent = label;
    if (!on) btn.textContent = btn.__origText || btn.textContent;
  }

  // ---------------------------------------------
  // ACTIONS
  // ---------------------------------------------
  async function onPDFClick(ev) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const root = getFinalRoot();
    const { btnPdf } = findActionButtons(root);

    disable(btnPdf, true, 'GERANDO…');

    try {
      if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
        throw new Error('API.gerarPDFEHQ não disponível em window.API');
      }

      const payload = buildDiamantePayload();
      log('Chamando API.gerarPDFEHQ(payload):', payload);

      const res = await window.API.gerarPDFEHQ(payload);

      // compat: url / dataUrl / blob
      if (res && typeof res === 'object') {
        if (res.dataUrl && String(res.dataUrl).startsWith('data:application/pdf')) {
          downloadDataUrl(String(res.dataUrl), `Jornada-${payload.meta.nome || 'Participante'}.pdf`);
        } else if (res.url && typeof res.url === 'string') {
          window.open(res.url, '_blank', 'noopener,noreferrer');
        } else if (res.blob instanceof Blob) {
          const url = URL.createObjectURL(res.blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
      }
    } catch (e) {
      err('Erro PDF/HQ:', e);
      alert(`Falha ao gerar PDF/HQ.\n\n${e?.message || e}`);
    } finally {
      disable(btnPdf, false);
    }
  }

  function onSelfieClick(ev) {
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const root = getFinalRoot();
    const { btnSelfie } = findActionButtons(root);

    disable(btnSelfie, true, 'BAIXANDO…');

    try {
      const selfie = collectSelfie();
      const { nome } = collectNomeGuia();
      if (!selfie) throw new Error('Selfie não encontrada.');

      const safeName = (nome || 'Participante').replace(/[^\w\-]+/g, '_');
      downloadDataUrl(selfie, `SelfieCard-${safeName}.png`);
    } catch (e) {
      err('Erro SelfieCard:', e);
      alert(`Falha ao baixar SelfieCard.\n\n${e?.message || e}`);
    } finally {
      disable(btnSelfie, false);
    }
  }

  // ---------------------------------------------
  // BIND (com “rebinding”)
  // ---------------------------------------------
  function bind(root) {
    if (!root) return false;

    // evita duplicar listeners, mas permite “reatar” se o DOM foi recriado
    if (root.__finalBindStamp && root.__finalBindStamp === root.innerHTML.length) {
      return true;
    }
    root.__finalBindStamp = root.innerHTML.length;

    const { btnPdf, btnSelfie } = findActionButtons(root);
    log('Root encontrado:', root.id || '(sem id)', '| btnPdf:', !!btnPdf, '| btnSelfie:', !!btnSelfie);

    if (btnPdf) {
      btnPdf.onclick = null;
      btnPdf.addEventListener('click', onPDFClick, { passive: false });
    }
    if (btnSelfie) {
      btnSelfie.onclick = null;
      btnSelfie.addEventListener('click', onSelfieClick, { passive: false });
    }

    // typing / TTS
    runFinalTyping(root).catch(() => {});

    // Se ainda não encontrou botões, avisa forte (pra você bater o olho no DOM)
    if (!btnPdf && !btnSelfie) {
      warn('Nenhum botão detectado dentro da section-final. Provável: botões estão fora do root OU não são button/role=button.');
    }

    return true;
  }

  function bindWhenReady() {
    const root = getFinalRoot();
    if (root) return bind(root);

    return false;
  }

  function observe() {
    // tenta já
    if (bindWhenReady()) return;

    const mo = new MutationObserver(() => {
      if (bindWhenReady()) mo.disconnect();
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  // ---------------------------------------------
  // BOOT
  // ---------------------------------------------
  log('LOADED ✅ (se você não ver isso, o arquivo NÃO está carregando!)');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observe);
  } else {
    observe();
  }

  // expõe um mount manual (se quiser chamar do controller)
  window.JORNADA_SECTION_FINAL = window.JORNADA_SECTION_FINAL || {};
  window.JORNADA_SECTION_FINAL.mount = () => bindWhenReady();
})();
