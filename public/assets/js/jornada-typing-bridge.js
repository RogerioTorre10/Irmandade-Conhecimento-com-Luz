// /assets/js/jornada-typing-bridge.js — FINAL (LATCH + anti-eco GLOBAL + logs controláveis + VOICE MANAGER)
(function (window) {
  'use strict';

  if (window.__TypingBridgeReady) {
    // não loga aqui pra não poluir
    return;
  }
  window.__TypingBridgeReady = true;

  // =========================
  // DEBUG (desliga logs por padrão)
  // Use no console: window.DEBUG_TYPING = true
  // =========================
  const typingLog = (...args) => {
    if (window.DEBUG_TYPING) console.log('[TypingBridge]', ...args);
  };

  function getLangNow() {
    return (
      window.i18n?.currentLang ||
      window.i18n?.lang ||
      sessionStorage.getItem('jornada.lang') ||
      sessionStorage.getItem('i18n.lang') ||
      localStorage.getItem('jc.lang') ||
      localStorage.getItem('i18n_lang') ||
      document.documentElement?.lang ||
      'pt-BR'
    );
  }

  // =========================
  // VOICE MANAGER (global)
  // - garante voz correta por idioma
  // - espera carregamento das voices (voiceschanged)
  // =========================
  let __voices = [];
  let __voicesPromise = null;
  const __voiceCache = new Map(); // lang -> voice

  function __loadVoicesNow() {
    try { __voices = speechSynthesis.getVoices?.() || []; } catch { __voices = []; }
    return __voices;
  }

  function __normalizeLang(lang) {
    return String(lang || 'pt-BR').trim();
  }

  function __ensureVoicesReady(timeoutMs = 1400) {
    if (!('speechSynthesis' in window)) return Promise.resolve();

    __loadVoicesNow();
    if (__voices.length) return Promise.resolve();

    if (!__voicesPromise) {
      __voicesPromise = new Promise((resolve) => {
        const t0 = Date.now();

        const tick = () => {
          __loadVoicesNow();
          if (__voices.length) return resolve();
          if (Date.now() - t0 > timeoutMs) return resolve();
          setTimeout(tick, 80);
        };

        try {
          speechSynthesis.onvoiceschanged = () => {
            __loadVoicesNow();
            resolve();
          };
        } catch {}

        tick();
      });
    }

    return __voicesPromise;
  }

  function __pickBestVoice(lang) {
    lang = __normalizeLang(lang);
    if (__voiceCache.has(lang)) return __voiceCache.get(lang);

    const L = lang.toLowerCase();
    const prefix = L.split('-')[0];

    // 1) match exato
    let v = __voices.find(x => (x.lang || '').toLowerCase() === L) || null;

    // 2) match por prefixo (pt, en, es...)
    if (!v) v = __voices.find(x => (x.lang || '').toLowerCase().startsWith(prefix)) || null;

    // 3) preferência por localService quando possível
    if (v && typeof v.localService === 'boolean') {
      const same = __voices.filter(x => (x.lang || '').toLowerCase() === (v.lang || '').toLowerCase());
      const local = same.find(x => x.localService);
      if (local) v = local;
    }

    __voiceCache.set(lang, v);
    return v;
  }

  async function __applyVoice(utt, lang) {
    if (!utt || !('speechSynthesis' in window)) return;
    await __ensureVoicesReady();
    const v = __pickBestVoice(lang);
    if (v) utt.voice = v;
  }

  // ====== ESTILO DO CURSOR ======
  (function ensureStyle() {
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret {
        display: inline-block;
        width: 0.6ch;
        margin-left: 2px;
        animation: blink 1s step-end infinite;
      }
      @keyframes blink { 50% { opacity: 0; } }

      [data-typing="true"] { opacity: 0; transition: opacity 0.1s; }
      .typing-done[data-typing] { opacity: 1 !important; }
    `;
    document.head.appendChild(st);
  })();

  let abortCurrent = null;

  // ====== FUNÇÕES DE LOCK ======
  function lock() {
    window.__typingLock = true;
  }
  function unlock() {
    window.__typingLock = false;
  }

  // ====== HELPERS DE "LATCH" POR ELEMENTO ======
  function makeTypingSig(text) {
    const lang = getLangNow();
    const t = String(text || '').trim();
    return `${lang}::${t}`;
  }

  // ====== ANTI-ECO GLOBAL DO TYPING ======
  // Segura cascatas (i18n.apply + section:shown + controller) mesmo se o elemento for recriado.
  let __lastTypingSig = '';
  let __lastTypingAt = 0;

  function shouldSkipTyping(sig) {
    const now = Date.now();
    // janela maior para cascatas reais do seu app
    if (sig === __lastTypingSig && (now - __lastTypingAt) < 1400) return true;
    __lastTypingSig = sig;
    __lastTypingAt = now;
    return false;
  }

  // ====== FUNÇÃO PRINCIPAL DE DATILOGRAFIA ======
  async function typeText(element, text, speed = 40, showCursor = true) {
    return new Promise(resolve => {
      if (!element || !text) return resolve();

      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => (abort = true);

      element.classList.remove('typing-done');
      element.style.opacity = '0';

      let caret = element.querySelector('.typing-caret');
      if (!caret) {
        caret = document.createElement('span');
        caret.className = 'typing-caret';
        caret.textContent = '|';
      }

      element.textContent = '';
      if (showCursor) element.appendChild(caret);

      element.style.opacity = '1';

      let i = 0;
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          return resolve();
        }

        element.textContent = text.slice(0, i + 1);
        if (showCursor) element.appendChild(caret);

        try { window.Luz?.bump({ peak: 1.18, ms: 120 }); } catch {}

        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          element.classList.add('typing-done');
          element.dataset.typingDone = '1';
          resolve();
        }
      }, speed);
    });
  }

  // ====== API PRINCIPAL ======
  window.runTyping = (element, text, callback, options = {}) => {
    const speed = options.speed || 36;
    const showCursor = options.cursor ?? true;

    // ===== LATCH + ANTI-ECO =====
    try {
      const sig = makeTypingSig(text);

      // 1) anti-eco GLOBAL (segura cascatas mesmo se DOM recriou)
      if (shouldSkipTyping(sig)) {
        if (typeof callback === 'function') setTimeout(callback, 0);
        return;
      }

      // 2) latch por elemento (mesmo texto/idioma, mesmo elemento)
      const prev = element?.dataset?.typingSig;
      if (element && prev === sig && element.classList.contains('typing-done')) {
        if (typeof callback === 'function') setTimeout(callback, 0);
        return;
      }

      if (element) element.dataset.typingSig = sig;
    } catch {}

    typingLog('Iniciando runTyping…');
    lock();

    try { window.Luz?.startPulse({ min: 1, max: 1.25, speed: 140 }); } catch {}

    typeText(element, text, speed, showCursor).then(() => {
      try { window.Luz?.stopPulse(); } catch {}
      unlock();
      if (callback) callback();
    });
  };

  // ===========================================================
  //  EFEITOS DE VOZ + DATILOGRAFIA
  // ===========================================================
  window.EffectCoordinator = window.EffectCoordinator || {};

  // Anti-eco (mesmo texto/idioma em sequência)
  let __lastSpeakSig = '';
  let __lastSpeakAt = 0;

  window.EffectCoordinator.speak = (text, options = {}) => {
    if (!text || !('speechSynthesis' in window)) return;

    const lang = getLangNow();
    const clean = String(text).trim();
    const sig = `${lang}::${clean}`;
    const now = Date.now();

    // janela maior para cascatas reais do app
    if (sig === __lastSpeakSig && (now - __lastSpeakAt) < 1600) return;
    __lastSpeakSig = sig;
    __lastSpeakAt = now;

    try { speechSynthesis.cancel(); } catch {}

    const utt = new SpeechSynthesisUtterance(clean);
    utt.lang  = lang;
    utt.rate  = options.rate  || 1.03;
    utt.pitch = options.pitch || 1.0;

    utt.onboundary = () => {
      try { window.Luz?.startPulse({ min: 1, max: 1.45, speed: 120 }); } catch {}
    };
    utt.onend = () => {
      try { window.Luz?.stopPulse(); } catch {}
    };

    // fala com a melhor voice possível pro idioma (espera voices carregarem)
    const _speakNow = () => {
      speechSynthesis.speak(utt);
      typingLog('TTS falando…', lang);
    };

    Promise.resolve(__applyVoice(utt, lang))
      .catch(() => {})
      .finally(_speakNow);

    return;
  };

  // ===========================================================
  //  typeAndSpeak — avança só quando a voz terminar
  // ===========================================================
  window.typeAndSpeak = async function (element, text, speed = 36) {
    if (!text || !element) return;

    // latch por elemento/texto/idioma
    try {
      const sig = makeTypingSig(text);
      if (element.dataset.typingSig === sig && element.classList.contains('typing-done')) return;

      // anti-eco global também aqui (caso chamem typeAndSpeak em cascata)
      if (shouldSkipTyping(sig)) return;
      element.dataset.typingSig = sig;
    } catch {}

    let terminou = false;

    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(String(text).trim());
      const lang = getLangNow();
      utt.lang  = lang;
      utt.rate  = 0.95;
      utt.pitch = 1.0;
      utt.onend = () => { terminou = true; };
      utt.onerror = () => { terminou = true; };

      try { await __applyVoice(utt, lang); } catch {}

      try { speechSynthesis.cancel(); } catch {}
      speechSynthesis.speak(utt);
    } else {
      terminou = true;
    }

    await window.runTyping(element, text, null, { speed });

    while (!terminou) {
      await new Promise(r => setTimeout(r, 80));
    }
  };

  typingLog('TypingBridge pronto');
})(window);
