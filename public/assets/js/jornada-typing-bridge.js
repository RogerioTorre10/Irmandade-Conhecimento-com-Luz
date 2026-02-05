// /assets/js/jornada-typing-bridge.js — FINAL (LATCH + anti-eco GLOBAL + logs controláveis)
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
      (window.i18n && window.i18n.lang) ||
      localStorage.getItem('i18n_lang') ||
      'pt-BR'
    );
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

    // tenta escolher uma voz compatível com o idioma
    try {
      const voices = speechSynthesis.getVoices?.() || [];
      const match =
        voices.find(v => (v.lang || '').toLowerCase() === lang.toLowerCase()) ||
        voices.find(v => (v.lang || '').toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
      if (match) utt.voice = match;
    } catch {}

    utt.onboundary = () => {
      try { window.Luz?.startPulse({ min: 1, max: 1.45, speed: 120 }); } catch {}
    };
    utt.onend = () => {
      try { window.Luz?.stopPulse(); } catch {}
    };

    speechSynthesis.speak(utt);
    typingLog('TTS falando…', lang);
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

      try {
        const voices = speechSynthesis.getVoices?.() || [];
        const match =
          voices.find(v => (v.lang || '').toLowerCase() === lang.toLowerCase()) ||
          voices.find(v => (v.lang || '').toLowerCase().startsWith(lang.toLowerCase().slice(0, 2)));
        if (match) utt.voice = match;
      } catch {}

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
