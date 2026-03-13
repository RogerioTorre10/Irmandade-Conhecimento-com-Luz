/* /assets/js/section-final.js — v8.0
 * Página final da Jornada Essencial
 * - Compatível com section-perguntas-bloco.js
 * - Coleta respostas via jornada-paper-qa.js
 * - Integra devolutiva final do Guia
 * - PDF só libera após devolutiva final
 * - Mantém PDF + SelfieCard + Portal
 */

(function () {
  'use strict';

  const SECTION_ID  = 'section-final';
  const HOME_URL    = 'https://irmandade-conhecimento-com-luz.onrender.com/portal.html';
  const FINAL_MOVIE = '/assets/videos/filme-5-fim-da-jornada.mp4';

  let started = false;
  let finalReturning = false;
  let speechChain = Promise.resolve();

  // ================================
  // HELPERS
  // ================================
  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function safeParseJSON(raw) {
    try { return JSON.parse(raw); } catch { return null; }
  }

  function getActiveLang() {
    const l1 = window.i18n?.currentLang;
    const l2 = sessionStorage.getItem('jornada.lang') || sessionStorage.getItem('i18n.lang');
    const l3 = localStorage.getItem('jc.lang') || localStorage.getItem('i18n.lang');
    const l4 = document.documentElement?.lang;
    return (l1 || l2 || l3 || l4 || 'pt-BR').toString().trim();
  }

  function getStorageKey() {
    return (
      window.APP_CONFIG?.STORAGE_KEY ||
      window.JORNADA_CFG?.STORAGE_KEY ||
      window.CONFIG?.STORAGE_KEY ||
      'jornada_essencial_v1'
    );
  }

  function ensureFinalPdfStyles() {
    if (document.getElementById('final-pdf-magic-style')) return;

    const css = `
    @keyframes finalPdfPulse {
      0%   { box-shadow: 0 0 0 rgba(255,215,80,.0), 0 0 14px rgba(255,215,80,.25); }
      50%  { box-shadow: 0 0 0 rgba(255,215,80,.0), 0 0 26px rgba(255,215,80,.55); }
      100% { box-shadow: 0 0 0 rgba(255,215,80,.0), 0 0 14px rgba(255,215,80,.25); }
    }
    .final-pdf-status {
      width: min(560px, 92%);
      text-align: center;
      font-size: 14px;
      line-height: 1.25;
      opacity: .95;
      padding: 10px 12px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.18);
      backdrop-filter: blur(4px);
      margin: 12px auto 0;
    }
    .final-pdf-status.ok {
      border-color: rgba(120,255,170,.35);
      box-shadow: 0 0 18px rgba(120,255,170,.18);
    }
    .final-pdf-status.err {
      border-color: rgba(255,120,120,.35);
      box-shadow: 0 0 18px rgba(255,120,120,.18);
    }
    .final-guide-feedback {
      width: min(700px, 92%);
      margin: 18px auto 12px;
      padding: 18px 18px;
      border-radius: 18px;
      border: 1px solid rgba(255,255,255,.12);
      background: rgba(0,0,0,.22);
      backdrop-filter: blur(4px);
      line-height: 1.72;
      white-space: pre-wrap;
      text-align: center;
      box-shadow: 0 0 18px rgba(0,0,0,.20);
    }
    .final-guide-feedback.typing-active {
      opacity: 1;
    }
    `;
    const style = document.createElement('style');
    style.id = 'final-pdf-magic-style';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function setPdfStatus(root, msg, kind) {
    const el = root.querySelector('#finalPdfStatus');
    if (!el) return;
    el.classList.remove('ok', 'err');
    if (kind) el.classList.add(kind);
    el.textContent = msg;
  }

  function startMagicDots(root, baseMsg) {
    let n = 0;
    const tick = () => {
      n = (n + 1) % 4;
      setPdfStatus(root, baseMsg + '.'.repeat(n), null);
    };
    tick();
    return setInterval(tick, 420);
  }

  // ================================
  // ESTADO / GUIA / SELFIECARD
  // ================================
  function getJornadaState() {
    const fromWindow =
      (window.JORNADA_STATE && typeof window.JORNADA_STATE === 'object') ? window.JORNADA_STATE :
      (window.state && typeof window.state === 'object') ? window.state :
      (window.JC_STATE && typeof window.JC_STATE === 'object') ? window.JC_STATE :
      {};

    const key = getStorageKey();
    const candidates = [
      key,
      'jornada_essencial_v1',
      'jornada_essencial',
      'JORNADA_STATE',
      'jornada_state'
    ];

    let fromLS = {};
    for (const k of candidates) {
      const raw = localStorage.getItem(k) || sessionStorage.getItem(k);
      const parsed = raw ? safeParseJSON(raw) : null;
      if (parsed && typeof parsed === 'object') {
        fromLS = parsed;
        break;
      }
    }

    const nomeLS = (localStorage.getItem('JORNADA_NOME') || sessionStorage.getItem('JORNADA_NOME') || '').trim();
    const guiaLS = (localStorage.getItem('JORNADA_GUIA') || sessionStorage.getItem('JORNADA_GUIA') || '').trim();

    const merged = Object.assign({}, fromWindow, fromLS);
    if (!merged.nome && nomeLS) merged.nome = nomeLS;
    if (!merged.guiaSelecionado && !merged.guia && guiaLS) merged.guiaSelecionado = guiaLS;

    window.JORNADA_STATE = merged;
    return merged;
  }

  function normalizeGuide(raw) {
    const s = String(raw || '').trim();
    const x = s.toLowerCase();

    if (x === 'lumen' || x === 'guia-lumen' || x === 'guia_lumen' || x === 'lumen-1') return { id: 'lumen', nome: 'Lumen' };
    if (x === 'zion'  || x === 'guia-zion'  || x === 'guia_zion'  || x === 'zion-1')  return { id: 'zion',  nome: 'Zion'  };
    if (x === 'arion' || x === 'arian' || x === 'guia-arion' || x === 'guia_arion' || x === 'guia-arian' || x === 'guia_arian') {
      return { id: 'arion', nome: 'Arion' };
    }

    if (!x || x === 'guia' || x === 'guide' || x === 'selected' || x === 'selecionado') {
      return { id: '', nome: '' };
    }

    return { id: x, nome: s };
  }

  function readGuideFromEverywhere(stateObj) {
    let g =
      stateObj?.guiaSelecionado ??
      stateObj?.guia ??
      stateObj?.guide ??
      stateObj?.selectedGuide ??
      stateObj?.guiaId ??
      null;

    if (g && typeof g === 'object') {
      g = g.id || g.key || g.slug || g.nome || g.name || '';
    }

    const candidates = [
      'JORNADA_GUIA',
      'JORNADA_GUIA_ID',
      'JORNADA_GUIA_NOME',
      'GUIA_SELECIONADO',
      'jc.guia',
      'jornada.guia',
      'jornada.guiaSelecionado'
    ];

    let gs = '';
    for (const k of candidates) {
      const v = (localStorage.getItem(k) || sessionStorage.getItem(k) || '').trim();
      if (v) { gs = v; break; }
    }

    const n1 = normalizeGuide(g);
    if (n1.id) return n1;

    const n2 = normalizeGuide(gs);
    if (n2.id) return n2;

    const d1 = document.documentElement?.dataset?.guia || document.body?.dataset?.guia || '';
    const n3 = normalizeGuide(d1);
    if (n3.id) return n3;

    return { id: '', nome: '' };
  }

  function readSelfieCardFromEverywhere(stateObj) {
    let s =
      stateObj?.selfieBase64 ??
      stateObj?.selfieCard ??
      stateObj?.cardImage ??
      stateObj?.cardBase64 ??
      stateObj?.selfie_card ??
      null;

    if (!s && stateObj?.selfie && typeof stateObj.selfie === 'object') {
      s = stateObj.selfie.base64 || stateObj.selfie.dataUrl || stateObj.selfie.image || '';
    }

    if (!s) s = window.SELFIE_CARD || window.__SELFIE_CARD__ || window.JORNADA_SELFIE_CARD || null;

    if (typeof s === 'string' && s.trim()) return s.trim();

    const raw =
      localStorage.getItem('JORNADA_SELFIECARD') ||
      localStorage.getItem('SELFIE_CARD') ||
      localStorage.getItem('JORNADA_CARD_IMAGE') ||
      localStorage.getItem('JORNADA_SELFIE_CARD') ||
      localStorage.getItem('JORNADA_SELFIECARD_B64') ||
      sessionStorage.getItem('JORNADA_SELFIECARD') ||
      sessionStorage.getItem('SELFIE_CARD') ||
      sessionStorage.getItem('JORNADA_CARD_IMAGE') ||
      sessionStorage.getItem('JORNADA_SELFIE_CARD') ||
      sessionStorage.getItem('JORNADA_SELFIECARD_B64') ||
      sessionStorage.getItem('jornada.selfieCard') ||
      localStorage.getItem('jornada.selfieCard');

    return (raw || '').trim();
  }

  // ================================
  // RESPOSTAS — NOVO MODELO POR BLOCO
  // ================================
  function collectPerguntasPayload() {
    const qa = window.JORNADA_PAPER_QA;
    const blocks = qa?.getBlocks?.() || [];
    const respostas = [];

    blocks.forEach((bloco) => {
      (bloco.questions || []).forEach((pergunta) => {
        const key = `jornada_resp_${bloco.id}_${pergunta.id}`;
        const value = String(localStorage.getItem(key) || '').trim();

        respostas.push({
          blocoId: bloco.id,
          blocoTitulo: bloco.title,
          perguntaId: pergunta.id,
          pergunta: pergunta.label,
          resposta: value
        });
      });
    });

    return respostas;
  }

  function hasAnyRespostaValida(respostas) {
    return Array.isArray(respostas) && respostas.some(item => String(item?.resposta || '').trim().length > 0);
  }

  function collectIntermediateFeedbacks() {
    const bag = [];

    const candidates = [
      window.__BLOCK_FEEDBACKS__,
      window.__JORNADA_DEVOLUTIVAS__,
      window.JornadaState?.feedbacks,
      window.JornadaState?.blockFeedbacks
    ];

    for (const c of candidates) {
      if (Array.isArray(c)) {
        c.forEach(item => {
          const txt = String(typeof item === 'string' ? item : item?.text || item?.content || '').trim();
          if (txt) bag.push(txt);
        });
      }
    }

    try {
      const raw =
        sessionStorage.getItem('jornada.blockFeedbacks') ||
        localStorage.getItem('jornada.blockFeedbacks');

      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          arr.forEach(item => {
            const txt = String(typeof item === 'string' ? item : item?.text || item?.content || '').trim();
            if (txt) bag.push(txt);
          });
        }
      }
    } catch {}

    return [...new Set(bag)];
  }

  // ================================
  // PAYLOAD FINAL
  // ================================
  function buildFinalPayloadDiamante() {
    const s = getJornadaState();
    const nome = String(
      s.nome ?? s.name ?? s.participantName ?? s.participante ??
      localStorage.getItem('JORNADA_NOME') ?? sessionStorage.getItem('JORNADA_NOME') ?? ''
    ).trim();

    const guiaNorm = readGuideFromEverywhere(s);
    const guia = String(guiaNorm.id || '').trim().toLowerCase();

    const respostasEstruturadas = collectPerguntasPayload();
    const respostas = respostasEstruturadas
      .map(item => String(item.resposta || '').trim())
      .filter(Boolean);

    const selfieCard = readSelfieCardFromEverywhere(s);

    const payload = {
      nome,
      guia,
      respostas,
      respostasEstruturadas,
      selfieCard
    };

    console.log('[FINAL][PAYLOAD NORMALIZED]', payload, '[GUIA]', guiaNorm);
    return payload;
  }

  // ================================
  // TTS
  // ================================
   function queueSpeak(text) {
    if (!('speechSynthesis' in window) || !text) return Promise.resolve();

    const clean = String(text || '').trim();
    if (!clean) return Promise.resolve();

    function pickVoiceForGuide() {
      const guideRaw =
        sessionStorage.getItem('jornada.guia') ||
        localStorage.getItem('JORNADA_GUIA') ||
        document.body?.dataset?.guia ||
        'lumen';

      const guideObj = normalizeGuide(guideRaw);
      const guide = String(guideObj?.id || guideObj?.nome || guideRaw || 'lumen').toLowerCase();

      const lang = String(document.documentElement.lang || getActiveLang() || 'pt-BR').toLowerCase();
      const langPrefix = lang.split('-')[0];

      const voices = window.speechSynthesis?.getVoices?.() || [];
      if (!voices.length) return null;

      const femaleHints = [
        'female', 'woman', 'mulher', 'feminina', 'feminine',
        'maria', 'luciana', 'helena', 'samantha', 'victoria', 'sofia', 'ana', 'monica',
        'zira', 'google uk english female'
      ];

      const maleHints = [
        'male', 'man', 'homem', 'masculina', 'masculine',
        'paulo', 'daniel', 'ricardo', 'jorge', 'felipe', 'antonio', 'carlos', 'alex', 'david',
        'google uk english male'
      ];

      const langVoices = voices.filter(v =>
        String(v.lang || '').toLowerCase().startsWith(langPrefix)
      );

      const ptVoices = voices.filter(v =>
        String(v.lang || '').toLowerCase().startsWith('pt')
      );

      const enVoices = voices.filter(v =>
        String(v.lang || '').toLowerCase().startsWith('en')
      );

      const esVoices = voices.filter(v =>
        String(v.lang || '').toLowerCase().startsWith('es')
      );

      const preferredLangVoices =
        langPrefix === 'pt' ? ptVoices :
        langPrefix === 'en' ? enVoices :
        langPrefix === 'es' ? esVoices :
        langVoices;

      function findByHints(pool, hints) {
        return pool.find(v =>
          hints.some(h => String(v.name || '').toLowerCase().includes(h))
        );
      }

      if (guide === 'zion') {
        return (
          findByHints(preferredLangVoices, maleHints) ||
          findByHints(langVoices, maleHints) ||
          findByHints(voices, maleHints) ||
          preferredLangVoices[0] ||
          langVoices[0] ||
          voices[0] ||
          null
        );
      }

      if (guide === 'arian' || guide === 'arion') {
        return (
          findByHints(preferredLangVoices, femaleHints) ||
          findByHints(langVoices, femaleHints) ||
          findByHints(voices, femaleHints) ||
          preferredLangVoices[0] ||
          langVoices[0] ||
          voices[0] ||
          null
        );
      }

      return (
        findByHints(preferredLangVoices, femaleHints) ||
        findByHints(langVoices, femaleHints) ||
        findByHints(voices, femaleHints) ||
        preferredLangVoices[0] ||
        langVoices[0] ||
        voices[0] ||
        null
      );
    }

    speechChain = speechChain.then(() => new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = document.documentElement.lang || getActiveLang() || 'pt-BR';
      utter.rate = 0.92;
      utter.pitch = 1;
      utter.volume = 1;

      const guideObj = normalizeGuide(
        sessionStorage.getItem('jornada.guia') ||
        localStorage.getItem('JORNADA_GUIA') ||
        document.body?.dataset?.guia ||
        'lumen'
      );

      const guide = String(guideObj?.id || guideObj?.nome || 'lumen').toLowerCase();

      if (guide === 'zion') {
        utter.pitch = 0.82;
        utter.rate = 0.94;
      }

      if (guide === 'lumen') {
        utter.pitch = 1.04;
        utter.rate = 0.92;
      }

      if (guide === 'arian' || guide === 'arion') {
        utter.pitch = 1.12;
        utter.rate = 0.95;
      }

      const picked = pickVoiceForGuide();
      if (picked) {
        utter.voice = picked;
        utter.lang = picked.lang || utter.lang;
      }

      utter.onend = () => resolve();
      utter.onerror = () => resolve();

      try { window.speechSynthesis.cancel(); } catch {}
      try {
        window.speechSynthesis.speak(utter);
      } catch {
        resolve();
      }
    }));

    return speechChain;
  }

  async function typeText(el, text, delay = 55, withVoice = false) {
    if (!el || !text) return;

    el.textContent = '';
    el.style.opacity = '1';
    el.classList.add('typing-active');

    let speechPromise = Promise.resolve();
    if (withVoice) speechPromise = queueSpeak(text);

    for (let i = 0; i < text.length; i++) {
      el.textContent += text[i];
      if (i % 2 === 0) await sleep(delay);
    }

    await speechPromise;

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    await sleep(200);
  }

  // ================================
  // DEVOLUTIVA FINAL
  // ================================
  async function fetchFinalGuideFeedback() {
    const payload = buildFinalPayloadDiamante();

    const respostas = Array.isArray(payload?.respostas)
      ? payload.respostas.filter(Boolean)
      : [];

    const devolutivas = collectIntermediateFeedbacks();

    if (!respostas.length && !devolutivas.length) return '';

    const body = {
      nome: payload.nome || '',
      guia: payload.guia || 'lumen',
      respostas,
      devolutivas,
      idioma: getActiveLang()
    };

    const apiBase =
      window.API?.PRIMARY ||
      window.API_BASE ||
      window.APP_CONFIG?.API_BASE ||
      '/api';

    const base = String(apiBase).replace(/\/$/, '');
    const url = base.endsWith('/api')
      ? `${base}/jornada/devolutiva-final`
      : `${base}/api/jornada/devolutiva-final`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await resp.json().catch(() => ({}));

    if (!resp.ok || !data?.ok) {
      throw new Error(data?.detail || 'Falha ao gerar devolutiva final');
    }

    return String(data.devolutivaFinal || '').trim();
  }

  async function renderFinalGuideFeedback(section) {
    if (!section) return '';

    let box = section.querySelector('#finalGuideFeedback');
    if (!box) {
      box = document.createElement('div');
      box.id = 'finalGuideFeedback';
      box.className = 'final-guide-feedback';

      const status = section.querySelector('#finalPdfStatus');
      if (status && status.parentNode) {
        status.parentNode.insertBefore(box, status);
      } else {
        section.appendChild(box);
      }
    }

   try {

  box.textContent = "O Guia está reunindo as chamas da sua jornada...";

  const result = await fetchFinalGuideFeedback();

  if (!result?.ok) {
    throw new Error(result?.error || "Falha ao gerar devolutiva final");
  }

  const texto = result.text;

  box.textContent = "";
  await typeText(box, texto, 22, true);

  window.__JORNADA_DEVOLUTIVA_FINAL__ = texto;
  sessionStorage.setItem('JORNADA_DEVOLUTIVA_FINAL', texto);

  return texto;

} catch (err) {

  console.error("[FINAL] Sequência final falhou:", err);

  showFinalError("Não consegui concluir a devolutiva final do guia.");

  return null;
}

  // ================================
  // DOM
  // ================================
  function ensureFinalDOM() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return {};

    const titleEl = section.querySelector('#final-title');
    const msgEl   = section.querySelector('#final-message');
    const botoes  = section.querySelector('.final-acoes');

    return { section, titleEl, msgEl, botoes };
  }

  function unlockPortalButton(section) {
    if (!section) return;

    const portalBtn =
      section.querySelector('#btnVoltarPortal') ||
      section.querySelector('#btnFinalizar') ||
      section.querySelector('[data-action="finalizar"]') ||
      section.querySelector('[data-action="voltar-portal"]') ||
      section.querySelector('a[href*="portal"]');

    if (!portalBtn) return;

    portalBtn.disabled = false;
    portalBtn.classList.remove('disabled');
    portalBtn.removeAttribute('aria-disabled');
    portalBtn.style.pointerEvents = 'auto';
    portalBtn.style.opacity = '1';
    portalBtn.style.filter = 'none';
  }

  // ================================
  // VOLTAR AO PORTAL
  // ================================
  function handleVoltarInicio() {
    if (finalReturning) return;
    finalReturning = true;

    const src = FINAL_MOVIE;

    if (typeof window.playVideo === 'function') {
      window.playVideo(src, {
        useGoldBorder: true,
        pulse: true,
        onEnded: () => { window.location.href = HOME_URL; }
      });
      return;
    }

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, null);
      setTimeout(() => { window.location.href = HOME_URL; }, 16000);
      return;
    }

    window.location.href = HOME_URL;
  }

  // ================================
  // UI DE BOTÕES FINAL
  // ================================
  function mountFinalPdfUI(root) {
    if (!root) return;

    ensureFinalPdfStyles();

    const legacyWrap = root.querySelector('#finalPdfWrap') || root.querySelector('#finalPdfKrap');
    if (legacyWrap && legacyWrap.parentNode) legacyWrap.parentNode.removeChild(legacyWrap);

    let status = root.querySelector('#finalPdfStatus');
    if (!status) {
      status = document.createElement('div');
      status.id = 'finalPdfStatus';
      status.className = 'final-pdf-status';
      status.textContent = 'O Guia está reunindo as chamas da sua jornada...';
      const actions = root.querySelector('.final-acoes');
      if (actions && actions.parentNode) {
        actions.parentNode.insertBefore(status, actions.nextSibling);
      } else {
        root.appendChild(status);
      }
    }

    const actionsRoot = root.querySelector('.final-acoes') || root;

    let btnPdf = actionsRoot.querySelector('#btnPdf');
    if (!btnPdf) {
      btnPdf = document.createElement('button');
      btnPdf.id = 'btnPdf';
      btnPdf.type = 'button';
      btnPdf.className = 'btn btn-pdf';
      btnPdf.textContent = '✅ PDF';
      actionsRoot.appendChild(btnPdf);
    }

    let btnBaixarSelfie = actionsRoot.querySelector('#btnBaixarSelfie');
    if (!btnBaixarSelfie) {
      btnBaixarSelfie = document.createElement('button');
      btnBaixarSelfie.id = 'btnBaixarSelfie';
      btnBaixarSelfie.type = 'button';
      btnBaixarSelfie.className = 'btn btn-selfie';
      btnBaixarSelfie.textContent = '🖼️ SELFIECARD';
      actionsRoot.appendChild(btnBaixarSelfie);
    }

    let btnPortal = actionsRoot.querySelector('#btnVoltarPortal');
    if (!btnPortal) {
      btnPortal = document.createElement('button');
      btnPortal.id = 'btnVoltarPortal';
      btnPortal.type = 'button';
      btnPortal.className = 'btn btn-portal';
      btnPortal.textContent = '🏰 PORTAL';
      actionsRoot.appendChild(btnPortal);
    }

    // mantém só 3 botões
    (function enforce3Buttons() {
      const keep = new Set(['btnPdf', 'btnBaixarSelfie', 'btnVoltarPortal']);
      [...actionsRoot.querySelectorAll('button')].forEach(btn => {
        const id = btn.id || '';
        if (!keep.has(id)) btn.remove();
      });
    })();

    // PDF começa travado
    btnPdf.disabled = true;
    btnPdf.classList.add('disabled');

    if (!btnPdf.dataset.boundFinalPdf) {
      btnPdf.dataset.boundFinalPdf = '1';

     btnPdf.addEventListener('click', async (ev) => {
  ev.preventDefault();
  ev.stopPropagation();

  if (btnPdf.dataset.loading === '1') {
    btnPdf.disabled = true;
    btnPdf.textContent = 'Guia Pensando...';
    btnPdf.classList.add('is-loading');
    return;
  }

  btnPdf.dataset.loading = '1';
  btnPdf.disabled = true;
  btnPdf.textContent = 'Guia Pensando...';
  btnPdf.classList.add('is-loading');

  if (!window.API || typeof window.API.gerarPDFEHQ !== 'function') {
    setPdfStatus(root, '✖ API não está pronta. Verifique se /assets/js/api.js carregou.', 'err');
    btnPdf.dataset.loading = '0';
    btnPdf.disabled = false;
    btnPdf.textContent = '✅ PDF';
    btnPdf.classList.remove('is-loading');
    return;
  }

  btnBaixarSelfie.disabled = true;

  let timer = null;

  try {
    try {
      await Promise.race([
        window.__SELFIECARD_PROMISE__ || Promise.resolve(),
        new Promise(r => setTimeout(r, 900))
      ]);
    } catch {}

    const payload = buildFinalPayloadDiamante();

    payload.devolutivaFinal =
      window.__JORNADA_DEVOLUTIVA_FINAL__ ||
      sessionStorage.getItem('JORNADA_DEVOLUTIVA_FINAL') ||
      '';

    if (!payload.nome || payload.nome.length < 2) {
      setPdfStatus(root, '⚠ Nome inválido. Volte e confirme o nome antes de gerar o PDF.', 'err');
      return;
    }

    if (!payload.guia || payload.guia.length < 2) {
      setPdfStatus(root, '⚠ Guia não identificado. Volte e selecione Lumen/Zion/Arion antes de gerar o PDF.', 'err');
      return;
    }

    if (!hasAnyRespostaValida(payload.respostasEstruturadas)) {
      setPdfStatus(root, '⚠ Sem respostas. Finalize as perguntas antes de gerar o PDF.', 'err');
      return;
    }

    const selfieCard =
      sessionStorage.getItem('JORNADA_SELFIECARD') ||
      localStorage.getItem('JORNADA_SELFIECARD') ||
      payload.selfieCard ||
      '';

    payload.selfieCard = selfieCard;

    timer = startMagicDots(root, 'O Guia está forjando seu pergaminho');

    const result = await window.API.gerarPDFEHQ(payload);

    if (result && result.ok) {
      setPdfStatus(root, '✅ Pergaminho gerado e baixado com sucesso!', 'ok');
    } else {
      setPdfStatus(root, '✖ Não consegui gerar o PDF. Veja o console para detalhes.', 'err');
      console.warn('[FINAL][PDF] result:', result);
    }

  } catch (e) {
    console.error('[FINAL][PDF] erro:', e);
    setPdfStatus(root, '✖ Erro ao gerar o PDF. Confira o console (Network/Console).', 'err');

  } finally {
    if (timer) clearInterval(timer);
    btnPdf.dataset.loading = '0';
    btnPdf.disabled = false;
    btnBaixarSelfie.disabled = false;
    btnPdf.textContent = '✅ PDF';
    btnPdf.classList.remove('is-loading');
  }
  });
  }
    if (!btnBaixarSelfie.dataset.boundFinalSelfie) {
      btnBaixarSelfie.dataset.boundFinalSelfie = '1';

      btnBaixarSelfie.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const payload = buildFinalPayloadDiamante();
        const img = payload.selfieCard;

        if (!img || String(img).trim().length < 80) {
          setPdfStatus(root, '⚠️ SelfieCard ainda não está disponível.', 'err');
          return;
        }

        try {
          const dataUrl = String(img).trim().startsWith('data:image')
            ? String(img).trim()
            : ('data:image/jpeg;base64,' + String(img).trim().replace(/^base64,/, ''));

          const a = document.createElement('a');
          a.href = dataUrl;
          a.download = (payload.nome ? payload.nome : 'selfiecard') + '-selfiecard.jpg';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setPdfStatus(root, '✅ SelfieCard baixado com sucesso!', 'ok');
        } catch (e) {
          console.error('[FINAL][SELFIE] erro:', e);
          setPdfStatus(root, '❌ Não consegui baixar a SelfieCard. Veja o console.', 'err');
        }
      });
    }

    if (!btnPortal.dataset.boundFinalPortal) {
      btnPortal.dataset.boundFinalPortal = '1';

      btnPortal.addEventListener('click', (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        handleVoltarInicio();
      });
    }
  }

  // ================================
  // SEQUÊNCIA FINAL
  // ================================
  async function startFinalSequence() {
    if (started) return;
    started = true;

    try { speechSynthesis.cancel(); } catch {}
    speechChain = Promise.resolve();

    const { section, titleEl, msgEl, botoes } = ensureFinalDOM();
    if (!section || !titleEl || !msgEl) return;

    section.style.display = 'block';

    const tituloOriginal =
      titleEl.dataset.original ||
      titleEl.textContent.trim() ||
      'Gratidão por Caminhar com Luz';

    titleEl.dataset.original = tituloOriginal;
    titleEl.textContent = '';
    titleEl.style.opacity = 0;
    titleEl.style.transform = 'translateY(-16px)';

    const ps = msgEl.querySelectorAll('p');
    ps.forEach(p => {
      const txt = p.dataset.original || p.textContent.trim();
      p.dataset.original = txt;
      p.textContent = '';
      p.style.opacity = 0;
      p.style.transform = 'translateY(10px)';
      p.classList.remove('revealed');
    });

    section.classList.add('show');
    await sleep(200);

    titleEl.style.transition = 'all 0.9s ease';
    titleEl.style.opacity = 1;
    titleEl.style.transform = 'translateY(0)';
    await typeText(titleEl, tituloOriginal, 65, true);
    await sleep(600);

    for (let i = 0; i < ps.length; i++) {
      const p = ps[i];
      const txt = p.dataset.original || '';
      if (!txt) continue;

      p.style.transition = 'all 0.8s ease';
      p.style.opacity = 1;
      p.style.transform = 'translateY(0)';
      await typeText(p, txt, 55, true);
      p.classList.add('revealed');
      await sleep(300);
    }

    if (botoes) {
      botoes.style.opacity = '0';
      botoes.style.transform = 'scale(0.9)';
      botoes.style.transition = 'all 0.8s ease';
      botoes.style.pointerEvents = 'none';

      await sleep(400);

      botoes.classList.add('show');
      botoes.style.opacity = '1';
      botoes.style.transform = 'scale(1)';

      botoes.querySelectorAll('button, a').forEach(el => {
        el.disabled = false;
        el.classList.remove('disabled');
        el.removeAttribute('aria-disabled');
        el.style.pointerEvents = 'auto';
      });
    }

    unlockPortalButton(section);

    try {
      setPdfStatus(section, 'O Guia está reunindo as chamas da sua jornada...', null);
      await renderFinalGuideFeedback(section);
      setPdfStatus(section, '✅ Devolutiva final concluída. Agora você pode gerar o PDF ou baixar a SelfieCard.', 'ok');
    } catch (e) {
      console.error('[FINAL][DEVOLUTIVA FINAL] erro:', e);
      setPdfStatus(section, '⚠ Não consegui concluir a devolutiva final do Guia.', 'err');
    }

    const btnPdf = section.querySelector('#btnPdf');
    if (btnPdf) {
      btnPdf.disabled = false;
      btnPdf.classList.remove('disabled');
    }

    console.log('[FINAL] Sequência concluída com sucesso!');
  }

  function applyFinalGuideTheme(section) {
    const guiaRaw =
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('JORNADA_GUIA') ||
      localStorage.getItem('jornada.guia') ||
      document.body.dataset.guia ||
      localStorage.getItem('JORNADA_GUIA_ATIVO') ||
      'lumen';

    const guia = String(guiaRaw || 'lumen').trim().toLowerCase();

    const themeMap = {
      lumen: {
        main: '#00c781',
        soft: 'rgba(0,199,129,0.28)',
        strong: 'rgba(0,199,129,0.62)',
        text: '#e8fff7'
      },
      zion: {
        main: '#59c8ff',
        soft: 'rgba(89,200,255,0.28)',
        strong: 'rgba(89,200,255,0.62)',
        text: '#eefaff'
      },
      arian: {
        main: '#ff4fd8',
        soft: 'rgba(255,79,216,0.28)',
        strong: 'rgba(255,79,216,0.62)',
        text: '#fff0fb'
      },
      arion: {
        main: '#ff4fd8',
        soft: 'rgba(255,79,216,0.28)',
        strong: 'rgba(255,79,216,0.62)',
        text: '#fff0fb'
      }
    };

    const theme = themeMap[guia] || themeMap.lumen;
    const root = document.documentElement;

    root.style.setProperty('--guia-main', theme.main);
    root.style.setProperty('--guia-soft', theme.soft);
    root.style.setProperty('--guia-strong', theme.strong);
    root.style.setProperty('--guia-text', theme.text);

    document.body.dataset.guia = guia;
    if (section) section.dataset.guia = guia;

    console.log('[FINAL] tema do guia aplicado:', guia, theme.main);
  }

  try {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        try { window.speechSynthesis.getVoices(); } catch {}
      };
    }
  } catch {}

  // ================================
  // EVENTOS
  // ================================
  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId || e.detail;
    if (id !== SECTION_ID) return;

    console.log('[FINAL] section:shown recebido para section-final, iniciando sequência...');

    const sec = document.getElementById(SECTION_ID);
    if (sec) {
      applyFinalGuideTheme(sec);
      sec.style.display = 'block';
      mountFinalPdfUI(sec);
      unlockPortalButton(sec);
    }

    startFinalSequence();
  });

  document.addEventListener('click', (e) => {
    const t = e.target;
    if (!t) return;

    if (t.matches?.('[data-action="finalizar"], [data-action="voltar-portal"], #btnFinalizar, #btnVoltarPortal')) {
      e.preventDefault();
      handleVoltarInicio();
    }
  });
 

})();
