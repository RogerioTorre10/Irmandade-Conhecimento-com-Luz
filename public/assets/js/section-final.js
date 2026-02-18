(() => {
  'use strict';

  const TAG = '[section-final]';
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function log(...a){ console.log(TAG, ...a); }
  function warn(...a){ console.warn(TAG, ...a); }
  function err(...a){ console.error(TAG, ...a); }

  function getRoot(){
    return document.getElementById('section-final') || document.querySelector('[id^="section-final"]');
  }

  function hydrateFinalMessage(root){
    const box = $('#final-message', root);
    if (!box) return;

    const ps = $$('p[data-original]', box);
    ps.forEach(p => {
      if (!p.textContent || !p.textContent.trim()) {
        p.textContent = p.getAttribute('data-original') || '';
      }
    });
  }

  async function runTitleTyping(root){
    const titleEl = $('#final-title', root);
    if (!titleEl) return;

    // Se você usa i18n, pode pôr data-original aqui também; se não tiver, define um fallback
    const text = (titleEl.getAttribute('data-original') || titleEl.textContent || 'Jornada concluída.').trim();
    if (!text) return;

    const runTyping = window.runTyping || window.JORNADA_TYPING?.runTyping;
    const speakText = window.speakText || window.JORNADA_TTS?.speakText;

    try{
      if (typeof runTyping === 'function') {
        await runTyping(titleEl, text, { speak: true });
      } else {
        titleEl.textContent = text;
        if (typeof speakText === 'function') {
          try { await speakText(text); } catch(_){}
        }
      }
    } catch(e){
      err('typing/TTS falhou:', e);
      titleEl.textContent = text;
    }
  }

  // ---------- payload “diamante” ----------
  const LS_KEYS = {
    nome: ['JORNADA_NOME','JORNADA_NAME','NOME','USER_NAME'],
    guia: ['JORNADA_GUIA','JORNADA_GUIDE','GUIA','GUIDE'],
    respostas: ['JORNADA_RESPOSTAS','JORNADA_ANSWERS','RESPOSTAS','ANSWERS'],
    selfie: ['JORNADA_SELFIE','JORNADA_SELFIE_DATAURL','SELFIE_DATAURL','SELFIE','SELFIE_BASE64']
  };

  function lsGetFirst(keys){
    for (const k of keys){
      try{
        const v = localStorage.getItem(k);
        if (v != null && String(v).trim() !== '') return v;
      } catch(_){}
    }
    return null;
  }

  function tryJSONParse(v){
    if (v == null) return null;
    if (typeof v === 'object') return v;
    const s = String(v).trim();
    if (!s) return null;
    try { return JSON.parse(s); } catch(_) { return null; }
  }

  function toArrayOfStrings(x){
    if (x == null) return [];
    if (Array.isArray(x)) return x.map(v => String(v ?? '')).filter(s => s.trim() !== '');
    if (typeof x === 'object') {
      const vals = Object.values(x).map(v => String(v ?? '')).filter(s => s.trim() !== '');
      if (vals.length) return vals;
    }
    const s = String(x).trim();
    return s ? [s] : [];
  }

  function normalizeSelfie(selfie){
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

    if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s/g,'').length > 200){
      const clean = s.replace(/\s/g,'').replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      return `data:image/jpeg;base64,${clean}`;
    }
    return null;
  }

  function collectNomeGuia(){
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

  function collectRespostas(){
    const candidates = [
      window.JORNADA_RESPOSTAS,
      window.JORNADA_ANSWERS,
      window.JORNADA?.respostas,
      window.JORNADA?.answers,
      window.state?.respostas,
      window.state?.answers
    ];
    for (const c of candidates){
      const arr = toArrayOfStrings(c);
      if (arr.length) return arr;
    }
    const raw = lsGetFirst(LS_KEYS.respostas);
    const parsed = tryJSONParse(raw);
    return toArrayOfStrings(parsed ?? raw);
  }

  function collectSelfie(){
    const candidates = [window.JORNADA_SELFIE, window.JORNADA?.selfie, window.state?.selfie];
    for (const c of candidates){
      const s = normalizeSelfie(c);
      if (s) return s;
    }
    const raw = lsGetFirst(LS_KEYS.selfie);
    const parsed = tryJSONParse(raw);
    return normalizeSelfie(parsed ?? raw);
  }

  function buildPayload(){
    const { nome, guia } = collectNomeGuia();
    const respostas = collectRespostas();
    const selfie = collectSelfie();
    return {
      meta: { nome: String(nome || ''), guia: String(guia || ''), ts: new Date().toISOString() },
      respostas: toArrayOfStrings(respostas),
      selfie: selfie ? String(selfie) : null
    };
  }

  function downloadDataUrl(dataUrl, filename){
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = filename || 'arquivo';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function disable(btn, on, label){
    if (!btn) return;
    btn.disabled = !!on;
    btn.classList.toggle('is-loading', !!on);
    if (!btn.__origText) btn.__origText = btn.textContent;
    if (on && label) btn.textContent = label;
    if (!on) btn.textContent = btn.__origText || btn.textContent;
  }

  async function onClickPdfSelfie(ev){
    ev?.preventDefault?.();
    ev?.stopPropagation?.();

    const root = getRoot();
    const btn = root && $('#btnBaixarPDFHQ', root);
    disable(btn, true, 'GERANDO…');

    try{
      const payload = buildPayload();
      log('payload:', payload);

      if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
        throw new Error('API.gerarPDFEHQ não disponível em window.API');
      }

      const res = await window.API.gerarPDFEHQ(payload);

      // se o backend devolver dataUrl do PDF
      if (res && typeof res === 'object') {
        if (res.dataUrl && String(res.dataUrl).startsWith('data:application/pdf')) {
          downloadDataUrl(String(res.dataUrl), `Jornada-${payload.meta.nome || 'Participante'}.pdf`);
        } else if (res.url && typeof res.url === 'string') {
          window.open(res.url, '_blank', 'noopener,noreferrer');
        } else if (res.blob instanceof Blob) {
          const url = URL.createObjectURL(res.blob);
          window.open(url, '_blank', 'noopener,noreferrer');
          setTimeout(() => URL.revokeObjectURL(url), 60000);
        }
      }

      // selfie também (se existir)
      if (payload.selfie && payload.selfie.startsWith('data:image/')) {
        const safeName = (payload.meta.nome || 'Participante').replace(/[^\w\-]+/g, '_');
        downloadDataUrl(payload.selfie, `SelfieCard-${safeName}.png`);
      } else {
        warn('Selfie não encontrada para download (ok se não capturou).');
      }

    } catch(e){
      err('PDF/SELFIE falhou:', e);
      alert(`Falha ao gerar PDF/SELFIE.\n\n${e?.message || e}`);
    } finally {
      disable(btn, false);
    }
  }

  function onClickVoltar(ev){
    ev?.preventDefault?.();
    ev?.stopPropagation?.();
    // se você tem controller:
    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show('section-intro');
      return;
    }
    // fallback: volta para index/jornadas
    window.location.href = '/';
  }

  function bind(root){
    if (!root) return false;
    if (root.__finalBound) return true;
    root.__finalBound = true;

    hydrateFinalMessage(root);

    const btnPdf = $('#btnBaixarPDFHQ', root);
    const btnVoltar = $('#btnVoltarInicio', root);

    if (btnPdf) {
      btnPdf.disabled = false; // 🔥 garante que não fica morto
      btnPdf.addEventListener('click', onClickPdfSelfie, { passive: false });
    } else {
      warn('btnBaixarPDFHQ não encontrado dentro do section-final');
    }

    if (btnVoltar) {
      btnVoltar.addEventListener('click', onClickVoltar, { passive: false });
    }

    runTitleTyping(root).catch(() => {});
    log('BIND OK:', { btnPdf: !!btnPdf, btnVoltar: !!btnVoltar });

    return true;
  }

  function boot(){
    const root = getRoot();
    if (root) return bind(root);

    const mo = new MutationObserver(() => {
      const r = getRoot();
      if (r) { bind(r); mo.disconnect(); }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });
  }

  log('LOADED ✅');
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
