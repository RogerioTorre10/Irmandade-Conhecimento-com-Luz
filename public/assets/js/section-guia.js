// /assets/js/section-guia.js — v3.5 (lapidado)
// Guia: preview com áudio antes do nome; TTS da descrição após confirmar nome.

(function () {
  'use strict';

  const SECTION_ID = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS = 'hidden';

  const TYPING_SPEED = 42;
  const TTS_LATCH_MS = 600;
  const DATA_URL = '/assets/data/guias.json';

  // UX: confirmação em 2 passos
  const ARM_TIMEOUT_MS = 10000;
  const HOVER_DELAY_MS = 150;

  // Preview
  const PREVIEW_TIMEOUT_MS = 10200;

  if (window.JCGuia?.__bound) return;
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // =====================================================
  // ESTADO
  // =====================================================
  let nomeConfirmado = false;

  let hoverTimers = new Map();
  let armedId = null;
  let armTimer = null;
  let cancelArm = null;

  let previewOverlay = null;
  let previewVideo = null;
  let previewStopTimer = null;
  let previewPlaying = false;
  let previewCurrentSrc = null;

  // =====================================================
  // HELPERS
  // =====================================================
  function canonGuia(v) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return '';
    if (s.includes('lumen')) return 'lumen';
    if (s.includes('zion')) return 'zion';
    if (s.includes('arion') || s.includes('arian')) return 'arion';
    return '';
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  function safeSpeechCancel() {
    try { window.speechSynthesis?.cancel?.(); } catch {}
  }

  function readSavedGuide() {
    return canonGuia(
      window.JORNADA_STATE?.guiaSelecionado ||
      window.JORNADA_STATE?.guia ||
      window.JC?.data?.guiaSelecionado ||
      window.JC?.data?.guia ||
      sessionStorage.getItem('JORNADA_GUIA') ||
      localStorage.getItem('JORNADA_GUIA') ||
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('jc.guiaSelecionado') ||
      localStorage.getItem('jc.guia') ||
      localStorage.getItem('guiaEscolhido')
    );
  }

  function persistGuide(guiaCanon) {
    if (!guiaCanon) return;

    sessionStorage.setItem('JORNADA_GUIA', guiaCanon);
    localStorage.setItem('JORNADA_GUIA', guiaCanon);

    // chaves legadas compatíveis
    sessionStorage.setItem('jornada.guia', guiaCanon);
    localStorage.setItem('jc.guia', guiaCanon);
    localStorage.setItem('jc.guiaSelecionado', guiaCanon);
    localStorage.setItem('guiaEscolhido', guiaCanon);

    window.JORNADA_STATE = window.JORNADA_STATE || {};
    window.JORNADA_STATE.guia = guiaCanon;
    window.JORNADA_STATE.guiaSelecionado = guiaCanon;

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.guia = guiaCanon;
    window.JC.data.guiaSelecionado = guiaCanon;
  }

  function persistName(nome) {
    const upperName = String(nome || '').trim().toUpperCase();
    if (!upperName) return;

    sessionStorage.setItem('jornada.nome', upperName);
    localStorage.setItem('JORNADA_NOME', upperName);
    localStorage.setItem('jc.nome', upperName);

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = upperName;
  }

  // =====================================================
  // PREVIEW
  // =====================================================
  function ensurePreviewRefs() {
    if (previewOverlay && previewVideo) return true;

    previewOverlay = document.getElementById('guiaPreviewOverlay');
    previewVideo = document.getElementById('guiaPreviewVideo');

    if (!previewOverlay || !previewVideo) return false;

    previewVideo.playsInline = true;
    previewVideo.preload = 'auto';

    previewVideo.addEventListener('error', () => {
      stopPreview();
    });

    return true;
  }

  function showPreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.add('is-on');
    previewOverlay.setAttribute('aria-hidden', 'false');
  }

  function hidePreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.remove('is-on');
    previewOverlay.setAttribute('aria-hidden', 'true');
  }

  function stopPreview() {
    if (previewStopTimer) {
      clearTimeout(previewStopTimer);
      previewStopTimer = null;
    }

    previewPlaying = false;
    previewCurrentSrc = null;

    if (previewVideo) {
      try { previewVideo.pause(); } catch {}
      try { previewVideo.currentTime = 0; } catch {}
      try { previewVideo.removeAttribute('src'); previewVideo.load(); } catch {}
    }

    hidePreview();
  }

  async function playPreviewSrc(src, withAudio = false) {
    if (!src) return false;
    if (!ensurePreviewRefs()) return false;

    if (previewPlaying && previewCurrentSrc === src) return true;

    if (withAudio) safeSpeechCancel();

    stopPreview();
    previewPlaying = true;
    previewCurrentSrc = src;

    try {
      previewVideo.muted = !withAudio;
      previewVideo.volume = withAudio ? 1 : 0;
    } catch {}

    previewVideo.src = src;
    try { previewVideo.load(); } catch {}

    showPreview();
    previewStopTimer = setTimeout(stopPreview, PREVIEW_TIMEOUT_MS);

    try {
      await previewVideo.play();
      return true;
    } catch {
      stopPreview();
      return false;
    }
  }

  function bindPreviewToButtons(root, buttons) {
    if (!root || !buttons?.length) return;
    if (root.dataset.previewBound === '1') return;
    root.dataset.previewBound = '1';

    buttons.forEach((btn) => {
      if (btn.dataset.previewBtnBound === '1') return;
      btn.dataset.previewBtnBound = '1';

      const getSrc = () => (btn.dataset.previewSrc || '').trim();

      btn.addEventListener('mouseenter', () => {
        const src = getSrc();
        if (!src) return;
        playPreviewSrc(src, !nomeConfirmado);
      });

      btn.addEventListener('mouseleave', stopPreview);

      btn.addEventListener('focusin', () => {
        const src = getSrc();
        if (!src) return;
        playPreviewSrc(src, !nomeConfirmado);
      });

      btn.addEventListener('focusout', stopPreview);

      btn.addEventListener('touchstart', () => {
        const src = getSrc();
        if (!src) return;
        playPreviewSrc(src, !nomeConfirmado);
      }, { passive: true });
    });

    window.addEventListener('jc:section:leave', stopPreview, { passive: true });
  }

  // =====================================================
  // TRANSIÇÃO
  // =====================================================
  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;

    await Promise.race([
      new Promise((res) =>
        document.addEventListener('transition:ended', () => res(), { once: true })
      ),
      new Promise((res) => setTimeout(res, timeoutMs))
    ]);
  }

  function getTransitionSrc(root, btn) {
    return (
      btn?.dataset?.transitionSrc ||
      root?.dataset?.transitionSrc ||
      '/assets/videos/filme-conhecimento-com-luz-jardim.mp4'
    );
  }

  function playTransitionSafe(src, nextId) {
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, nextId);
      return;
    }

    if (typeof window.playTransitionThenGo === 'function') {
      window.playTransitionThenGo(nextId, src);
      return;
    }

    try {
      window.__TRANSITION_LOCK = true;

      const v = document.createElement('video');
      v.src = src || '/assets/videos/filme-conhecimento-com-luz-jardim.mp4';
      v.playsInline = true;
      v.muted = true;
      v.autoplay = true;
      v.preload = 'auto';
      v.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        background: #000;
        width: 100vw;
        height: 100vh;
        object-fit: cover;
        display: block;
      `;

      document.body.classList.add('vt-playing');

      const endTransition = () => {
        document.body.classList.remove('vt-playing');
        try { v.remove(); } catch {}
        window.__TRANSITION_LOCK = false;

        if (window.JC && typeof window.JC.show === 'function') {
          window.JC.show(nextId, { force: true });
        } else {
          location.hash = '#' + nextId;
        }

        document.dispatchEvent(new CustomEvent('transition:ended'));
      };

      v.addEventListener('ended', endTransition, { once: true });
      v.addEventListener('error', endTransition, { once: true });

      document.body.appendChild(v);

      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(endTransition);
      }
    } catch {
      window.__TRANSITION_LOCK = false;
      if (window.JC && typeof window.JC.show === 'function') {
        window.JC.show(nextId, { force: true });
      } else {
        location.hash = '#' + nextId;
      }
      document.dispatchEvent(new CustomEvent('transition:ended'));
    }
  }


  
  // =====================================================
  // DATILOGRAFIA / TTS
  // =====================================================
  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';

      (function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      })();
    });
  }

// ===============================================
// VOZ DO GUIA (NOVO)
// ===============================================

  // ===============================================
  // VOZ DO GUIA
  // ===============================================
  function getGuideForVoice() {
    return canonGuia(
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('JORNADA_GUIA') ||
      window.JORNADA_STATE?.guiaSelecionado ||
      window.JORNADA_STATE?.guia ||
      window.JC?.data?.guiaSelecionado ||
      window.JC?.data?.guia ||
      document.body.dataset.guia ||
      'lumen'
    ) || 'lumen';
  }

  function getLangForSpeech() {
    return (
      document.documentElement.lang ||
      localStorage.getItem('APP_LANG') ||
      sessionStorage.getItem('APP_LANG') ||
      'pt-BR'
    );
  }

  function pickVoiceForGuide(lang = 'pt-BR') {
    const synth = window.speechSynthesis;
    if (!synth) return null;

    const voices = synth.getVoices() || [];
    if (!voices.length) return null;

    const guide = getGuideForVoice();
    const langBase = String(lang || 'pt-BR').toLowerCase().split('-')[0];

    const norm = (s) =>
      String(s || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

    const femaleHints = [
      'female', 'woman', 'feminina', 'mulher',
      'maria', 'helena', 'luciana', 'samantha', 'victoria',
      'sofia', 'leticia', 'camila', 'google portugues brasil'
    ];

    const maleHints = [
      'male', 'man', 'masculina', 'homem',
      'paulo', 'daniel', 'ricardo', 'jorge', 'antonio', 'carlos'
    ];

    const langMatches = voices.filter(v =>
      String(v.lang || '').toLowerCase().startsWith(langBase)
    );

    const pool = langMatches.length ? langMatches : voices;

    const findByHints = (list, hints) =>
      list.find(v => {
        const n = norm(v.name);
        return hints.some(h => n.includes(norm(h)));
      });

    if (guide === 'zion') {
      return findByHints(pool, maleHints) || pool[0] || null;
    }

    if (guide === 'lumen' || guide === 'arion') {
      return findByHints(pool, femaleHints) || pool[0] || null;
    }

    return pool[0] || null;
  }

  async function speakGuideText(msg) {
    const text = String(msg || '').trim();
    if (!text) return;

    const synth = window.speechSynthesis;
    if (!synth) return;

    const guide = getGuideForVoice();
    const lang = getLangForSpeech();

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;

    // Base
    utter.rate = 1.02;
    utter.pitch = 1.0;

    // Perfis de voz
    if (guide === 'zion') {
      utter.rate = 0.98;
      utter.pitch = 0.88;   // masculina
    } else if (guide === 'lumen') {
      utter.rate = 1.02;
      utter.pitch = 1.12;   // feminina suave
    } else if (guide === 'arion') {
      utter.rate = 1.05;
      utter.pitch = 1.18;   // feminina inspiradora
    }

    const voice = pickVoiceForGuide(lang);
    if (voice) utter.voice = voice;

    await new Promise((resolve) => {
      utter.onend = () => resolve();
      utter.onerror = () => resolve();
      synth.speak(utter);
    });
  }
  
  async function typeOnce(el, text, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;

    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if (!msg) return;

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      await new Promise((res) => {
        try {
          window.runTyping(el, msg, () => res(), { speed, cursor: true });
        } catch {
          usedFallback = true;
          res();
        }
      });
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      await localType(el, msg, speed);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    if (speak && msg && !el.dataset.spoken) {
      try {
        safeSpeechCancel();

        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(msg, {
            lang: 'pt-BR',
            rate: 1.06,
            pitch: 1.0
          });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch {}
    }

    await sleep(60);
  }

  // =====================================================
  // TEMA
  // =====================================================
  function applyGuiaTheme(guiaIdOrNull) {
    const guia = guiaIdOrNull ? canonGuia(guiaIdOrNull) : readSavedGuide();

    if (!guia) {
      delete document.body.dataset.guia;
      return false;
    }

    document.body.setAttribute('data-guia', guia);
    return true;
  }

  function applyGuideThemeVars() {
    const guia = readSavedGuide();
    if (!guia) return false;

    let main = '#ffd700';
    let g1 = 'rgba(255,230,180,0.85)';
    let g2 = 'rgba(255,210,120,0.75)';

    if (guia === 'lumen') {
      main = '#00ff9d';
      g1 = 'rgba(0,255,157,0.90)';
      g2 = 'rgba(120,255,200,0.70)';
    }
    if (guia === 'zion') {
      main = '#00aaff';
      g1 = 'rgba(0,170,255,0.90)';
      g2 = 'rgba(255,214,91,0.70)';
    }
    if (guia === 'arion') {
      main = '#ff00ff';
      g1 = 'rgba(255,120,255,0.95)';
      g2 = 'rgba(255,180,255,0.80)';
    }

    document.documentElement.style.setProperty('--theme-main-color', main);
    document.documentElement.style.setProperty('--progress-main', main);
    document.documentElement.style.setProperty('--progress-glow-1', g1);
    document.documentElement.style.setProperty('--progress-glow-2', g2);
    document.documentElement.style.setProperty('--guide-color', main);

    document.body.setAttribute('data-guia', guia);
    console.log('[THEME] aplicado:', guia);
    return true;
  }

  window.applyGuideTheme = applyGuideThemeVars;
  window.aplicarGuiaTheme = window.aplicarGuiaTheme || applyGuiaTheme;

  // =====================================================
  // DADOS / RENDER
  // =====================================================
  function pick(root) {
    return {
      root,
      title: q('.titulo-pergaminho', root),
      nameInput: q('#guiaNameInput', root),
      confirmBtn: q('#btn-confirmar-nome', root),
      moldura: q('.moldura-grande', root),
      guiaTexto: q('#guiaTexto', root),
      optionsBox: q('.guia-options', root),
      errorBox: q('#guia-error', root)
    };
  }

  async function loadGuias() {
    const r = await fetch(DATA_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error(`GET ${DATA_URL} -> ${r.status}`);
    return r.json();
  }

  function renderButtons(optionsBox, guias) {
    if (!optionsBox) return;

    optionsBox.innerHTML = '';

    guias.forEach((g) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-stone-espinhos no-anim guia-option';
      btn.dataset.action = 'select-guia';
      btn.dataset.guia = canonGuia(g.id || g.nome || '');
      btn.dataset.locked = '1';
      btn.dataset.nome = g.nome || '';
      btn.setAttribute('aria-disabled', 'true');
      btn.setAttribute('aria-label', `Escolher o guia ${g.nome || ''}`);
      btn.classList.add('is-locked');

      const gid = btn.dataset.guia;
      const PREVIEW_BY_ID = {
        zion: '/assets/videos/Zion-escolhido.mp4',
        lumen: '/assets/videos/Lumen-escolhida.mp4',
        arion: '/assets/videos/Arian-escolhida.mp4'
      };

      btn.dataset.previewSrc = encodeURI(PREVIEW_BY_ID[gid] || '');
      btn.innerHTML = `<span class="label">${g.nome || gid}</span>`;

      if (g.bgImage) {
        btn.style.backgroundImage = `url('${g.bgImage}')`;
        btn.style.backgroundSize = 'cover';
        btn.style.backgroundPosition = 'center';
      }

      optionsBox.appendChild(btn);
    });
  }

  function findGuia(guias, id) {
    const canon = canonGuia(id);
    return guias.find((g) => canonGuia(g.id || g.nome || '') === canon);
  }

  // =====================================================
  // NOTICE
  // =====================================================
  function getNoticeRefs(root) {
    const box = q('#guia-error', root);
    if (!box) return { box: null, span: null };

    let span = box.querySelector('#guia-notice-text');
    if (!span) {
      span = document.createElement('span');
      span.id = 'guia-notice-text';
      box.innerHTML = '';
      box.appendChild(span);
    }

    return { box, span };
  }

  async function showNotice(root, text, { speak = true } = {}) {
    const { box, span } = getNoticeRefs(root);
    if (!box || !span) return;

    box.classList.remove(HIDE_CLASS);
    box.setAttribute('aria-hidden', 'false');
    span.dataset.text = text;
    span.dataset.spoken = '';
    span.textContent = '';

    await typeOnce(span, null, { speed: 30, speak });
  }

  function hideNotice(root) {
    const { box, span } = getNoticeRefs(root);
    if (!box) return;

    if (span) {
      span.textContent = '';
      delete span.dataset.spoken;
    }

    box.classList.add(HIDE_CLASS);
    box.setAttribute('aria-hidden', 'true');
  }

  // =====================================================
  // ARM / CONFIRM
  // =====================================================
  function unlockGuideButtons(buttons) {
    buttons.forEach((b) => {
      b.dataset.locked = '0';
      b.removeAttribute('aria-disabled');
      b.classList.remove('is-locked');
      b.disabled = false;
      b.style.opacity = '1';
      b.style.cursor = 'pointer';
      b.style.pointerEvents = 'auto';
    });
  }

  function lockGuideButtons(buttons) {
    buttons.forEach((b) => {
      b.dataset.locked = '1';
      b.setAttribute('aria-disabled', 'true');
      b.classList.add('is-locked');
      b.disabled = false; // mantém preview funcionando
      b.style.opacity = '0.6';
      b.style.cursor = 'pointer';
      b.style.pointerEvents = 'auto';
    });
  }

  function armGuide(root, btn, label) {
    const guiaId = canonGuia(btn?.dataset?.guia || '');
    if (!guiaId) return;

    if (armedId === guiaId) {
      confirmGuide(guiaId);
      if (cancelArm) cancelArm(root);
      return;
    }

    if (armTimer) {
      clearTimeout(armTimer);
      armTimer = null;
    }

    root.querySelectorAll('.guia-option').forEach((el) => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('armed');
    btn.setAttribute('aria-pressed', 'true');

    armedId = guiaId;

    showNotice(root, `Você escolheu ${label}. Clique novamente para confirmar.`, { speak: true });

    armTimer = setTimeout(() => {
      armedId = null;
      armTimer = null;

      root.querySelectorAll('.guia-option').forEach((el) => {
        el.classList.remove('armed');
        el.setAttribute('aria-pressed', 'false');
      });

      showNotice(root, 'Tempo esgotado. Selecione o guia e clique novamente para confirmar.', { speak: true });
    }, ARM_TIMEOUT_MS);
  }

  cancelArm = function (root) {
    armedId = null;

    if (armTimer) {
      clearTimeout(armTimer);
      armTimer = null;
    }

    root?.querySelectorAll('.guia-option').forEach((el) => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });

    hideNotice(root);
  };

  async function confirmGuide(guiaId) {
    const root = document.getElementById(SECTION_ID);
    if (!root) return;

    const input = root.querySelector('#guiaNameInput');
    if (!input) return;

    try {
      stopPreview();

      const nome = (input.value || '').trim();
      if (!nome) {
        input.focus();
        return;
      }

      const guiaCanon = canonGuia(guiaId);
      if (!guiaCanon) return;

      persistName(nome);
      persistGuide(guiaCanon);

      try { document.dispatchEvent(new CustomEvent('guia:changed')); } catch {}
      try { applyGuideThemeVars(); } catch {}
      try { applyGuiaTheme(guiaCanon); } catch {
        document.body.setAttribute('data-guia', guiaCanon);
      }

      // limpa artefatos antigos
      sessionStorage.removeItem('JORNADA_SELFIECARD');
      sessionStorage.removeItem('SELFIE_CARD');
      sessionStorage.removeItem('__SELFIECARD_SIG__');

      const btnAvancar =
        root.querySelector('#btn-avancar') ||
        root.querySelector('[data-action="avancar"]');

      if (btnAvancar) {
        btnAvancar.disabled = false;
        btnAvancar.classList.remove('is-hidden');
        btnAvancar.focus?.();
      }

      if (armTimer) {
        clearTimeout(armTimer);
        armTimer = null;
      }
      armedId = null;

      const src = getTransitionSrc(root, btnAvancar);
      playTransitionSafe(src, NEXT_SECTION_ID);
    } catch {
      playTransitionSafe(getTransitionSrc(root, null), NEXT_SECTION_ID);
    }
  }

  // =====================================================
  // INIT
  // =====================================================
  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    await waitForTransitionUnlock();
    ensureVisible(root);

    const els = pick(root);
    let guias = [];
    let guideButtons = [];

    const topBox = root.querySelector('.guia-options-top');
    const bottomBox = root.querySelector('.guia-options-bottom');

    // nome em maiúsculo
    if (els.nameInput && !els.nameInput.dataset.upperBound) {
      els.nameInput.dataset.upperBound = '1';
      els.nameInput.addEventListener('input', () => {
        const start = els.nameInput.selectionStart;
        const end = els.nameInput.selectionEnd;
        els.nameInput.value = (els.nameInput.value || '').toUpperCase();
        try { els.nameInput.setSelectionRange(start, end); } catch {}
      });
    }

    // garante botão confirmar visível no JS também
    if (els.confirmBtn) {
      els.confirmBtn.hidden = false;
      els.confirmBtn.style.removeProperty('display');
      els.confirmBtn.style.removeProperty('visibility');
      els.confirmBtn.style.removeProperty('opacity');
    }

    // título
    if (els.title && !els.title.classList.contains('typing-done')) {
      await typeOnce(els.title, null, { speed: 34, speak: true });
    }

    try {
      guias = await loadGuias();

      if (topBox) renderButtons(topBox, guias);
      if (bottomBox) renderButtons(bottomBox, guias);

      if (topBox) {
        topBox.classList.remove('disabled');
        topBox.classList.add('enabled');
      }

      if (bottomBox) {
        bottomBox.classList.remove('enabled');
        bottomBox.classList.add('disabled');
      }

      hideNotice(root);
    } catch {
      showNotice(root, 'Não foi possível carregar os guias. Tente novamente mais tarde.', {
        speak: false
      });
      return;
    }

    guideButtons = [
      ...qa('button[data-action="select-guia"]', topBox || root),
      ...qa('button[data-action="select-guia"]', bottomBox || root)
    ];

    lockGuideButtons(guideButtons);
    bindPreviewToButtons(root, guideButtons);

    let nameConfirmedOnce = false;

    if (els.confirmBtn) {
      els.confirmBtn.disabled = true;
      els.confirmBtn.setAttribute('aria-disabled', 'true');
    }

    if (els.nameInput && !els.nameInput.dataset.confirmGateBound) {
      els.nameInput.dataset.confirmGateBound = '1';

      const syncConfirmState = () => {
        const v = (els.nameInput?.value || '').trim();
        const enable = v.length >= 2;

        if (els.confirmBtn) {
          els.confirmBtn.disabled = !enable;
          els.confirmBtn.setAttribute('aria-disabled', enable ? 'false' : 'true');
        }
      };

      els.nameInput.addEventListener('input', syncConfirmState);
      syncConfirmState();
    }

    if (els.confirmBtn && !els.confirmBtn.dataset.confirmBound) {
      els.confirmBtn.dataset.confirmBound = '1';

      els.confirmBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const name = (els.nameInput?.value || '').trim();
        if (name.length < 2) {
          els.nameInput?.focus();
          return;
        }

        nomeConfirmado = true;
        stopPreview();
        safeSpeechCancel();

        const upperName = name.toUpperCase();
        els.nameInput.value = upperName;

        persistName(upperName);

        if (!nameConfirmedOnce) {
          nameConfirmedOnce = true;

          if (els.guiaTexto) {
            const base = (
              els.guiaTexto.dataset?.text ||
              els.guiaTexto.textContent ||
              'Escolha seu guia para a Jornada.'
            ).trim();

            const msg = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);

            els.guiaTexto.textContent = '';
            els.guiaTexto.dataset.spoken = '';
            await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });

            els.moldura?.classList.add('glow');
            els.guiaTexto?.classList.add('glow');
          }
        }

        unlockGuideButtons(guideButtons);
        hideNotice(root);
      });
    }

    if (root.dataset.guiaButtonsBound !== '1') {
      root.dataset.guiaButtonsBound = '1';

      guideButtons.forEach((btn) => {
        const guiaId = canonGuia(btn.dataset.guia || btn.textContent || '');
        const label = (btn.dataset.nome || btn.textContent || 'guia').trim().toUpperCase();

        btn.addEventListener('mouseenter', () => {
          if (!guiaId) return;

          if (hoverTimers.has(guiaId)) {
            clearTimeout(hoverTimers.get(guiaId));
          }

          const timer = setTimeout(async () => {
            const g = findGuia(guias, guiaId);
            if (g && els.guiaTexto) {
              els.guiaTexto.dataset.spoken = '';
              await typeOnce(els.guiaTexto, g.descricao, {
                speed: 34,
                speak: !!nomeConfirmado
              });
            }
            applyGuiaTheme(guiaId);
          }, HOVER_DELAY_MS);

          hoverTimers.set(guiaId, timer);
        });

        btn.addEventListener('mouseleave', () => {
          if (!guiaId) return;

          if (hoverTimers.has(guiaId)) {
            clearTimeout(hoverTimers.get(guiaId));
            hoverTimers.delete(guiaId);
          }

          const saved = readSavedGuide();
          applyGuiaTheme(saved || null);
        });

        btn.addEventListener('focus', () => {
          const g = findGuia(guias, guiaId);
          if (g && els.guiaTexto) {
            els.guiaTexto.dataset.spoken = '';
            typeOnce(els.guiaTexto, g.descricao, {
              speed: 34,
              speak: !!nomeConfirmado
            });
          }
        });

        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (btn.dataset.locked === '1') return;
          armGuide(root, btn, label);
        });

        btn.addEventListener('dblclick', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (btn.dataset.locked === '1') return;
          confirmGuide(guiaId);
          if (cancelArm) cancelArm(root);
        });

        btn.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            if (btn.dataset.locked === '1') return;
            armGuide(root, btn, label);
          }
        });

        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-pressed', 'false');
      });

      if (!document.documentElement.dataset.guiaOutsideCancelBound) {
        document.documentElement.dataset.guiaOutsideCancelBound = '1';

        document.addEventListener('click', (e) => {
          const inside = e.target.closest(
            '.guia-option, .guia-options, #btn-confirmar-nome, #guiaNameInput'
          );
          if (!inside && armedId && cancelArm) {
            const r = document.getElementById(SECTION_ID);
            if (r) cancelArm(r);
          }
        }, { passive: true });
      }
    }

    // reaplica tema salvo se já existir
    setTimeout(() => {
      try {
        applyGuideThemeVars();
      } catch {}
    }, 50);
  }

  // =====================================================
  // BIND GLOBAL
  // =====================================================
  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    document.addEventListener('section:shown', onSectionShown, { passive: true });

    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) {
      initOnce(now);
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();

  const applyThemeSafe = () => {
    try { window.applyGuideTheme?.(); } catch {}
  };

  document.addEventListener('sectionLoaded', () => setTimeout(applyThemeSafe, 50));
  document.addEventListener('guia:changed', applyThemeSafe);
})();
