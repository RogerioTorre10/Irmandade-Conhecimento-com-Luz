// /assets/js/jornada-typing-bridge.js — VERSÃO LIMPA E CORRIGIDA
(function (window) {
  'use strict';

  if (window.__TypingBridgeReady) {
    console.log('[TypingBridge] Já carregado, ignorando');
    return;
  }
  window.__TypingBridgeReady = true;

  const typingLog = (...args) => console.log('[TypingBridge]', ...args);

  // i18n Fallback
  const i18n = window.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (_, fallback) => fallback || _,
    apply: () => {},
    waitForReady: async () => {}
  };

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
          resolve();
        }
      }, speed);
    });
  }

  // ====== API PRINCIPAL ======
  window.runTyping = (element, text, callback, options = {}) => {
    const speed = options.speed || 36;
    const showCursor = options.cursor ?? true;

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

  window.EffectCoordinator.speak = (text, options = {}) => {
    if (!text || !('speechSynthesis' in window)) return;

    try { speechSynthesis.cancel(); } catch {}

    const utt = new SpeechSynthesisUtterance(String(text).trim());
    utt.lang = i18n.lang || 'pt-BR';
    utt.rate = options.rate || 1.03;
    utt.pitch = options.pitch || 1.0;

    utt.onboundary = () => {
      try { window.Luz?.startPulse({ min: 1, max: 1.45, speed: 120 }); } catch {};
    };

    utt.onend = () => {
      try { window.Luz?.stopPulse(); } catch {};
    };

    speechSynthesis.speak(utt);
    typingLog('TTS falando…');
  };

  window.EffectCoordinator.stopAll = () => {
    try { speechSynthesis.cancel(); } catch {}
    if (abortCurrent) abortCurrent();
    unlock();
    try { window.Luz?.stopPulse(); } catch {}
  };

  // ===========================================================
  //  typeAndSpeak — avança só quando a voz terminar
  // ===========================================================
  window.typeAndSpeak = async function (element, text, speed = 36) {
    if (!text || !element) return;

    let terminou = false;

    if ('speechSynthesis' in window) {
      const utt = new SpeechSynthesisUtterance(String(text).trim());
      utt.lang = i18n.lang || 'pt-BR';
      utt.rate = 0.95;
      utt.pitch = 1.0;
      utt.onend = () => { terminou = true; };

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
