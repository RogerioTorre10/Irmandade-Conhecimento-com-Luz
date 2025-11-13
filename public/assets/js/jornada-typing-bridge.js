(function (window) {
  'use strict';

  if (window.__TypingBridgeReady) {
    console.log('[TypingBridge] Já carregado, ignorando');
    return;
  }
  window.__TypingBridgeReady = true;

  const typingLog = (...args) => console.log('[TypingBridge]', ...args);

  // Objeto i18n mantido como fallback e para pegar a linguagem
  const i18n = window.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (_, fallback) => fallback || _,
    apply: () => {},
    waitForReady: async () => {}
  };

  // Garante o estilo do cursor (Mantido)
  (function ensureStyle() {
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret { display: inline-block; width: 0.6ch; margin-left: 2px; animation: blink 1s step-end infinite; }
      .typing-done[data-typing]::after { content: ''; }
      @keyframes blink { 50% { opacity: 0; } }
      [data-typing="true"] { opacity: 0; transition: opacity 0.1s; visibility: visible; }
      [data-typing="true"].typing-done { opacity: 1; visibility: visible; }
    `;
    document.head.appendChild(st);
    console.log('[TypingBridge] Estilo de datilografia aplicado');
  })();

  let ACTIVE = false;
  let abortCurrent = null;

  // ===== FUNÇÕES DE CONTROLE DE LOCK =====
  function lock() {
    ACTIVE = true;
    window.__typingLock = true;
  }

  function unlock() {
    ACTIVE = false;
    window.__typingLock = false;
  }

  // ===== FUNÇÃO PRIMÁRIA DE DATILOGRAFIA =====
  async function typeText(element, text, speed = 40, showCursor = false) {
    return new Promise(resolve => {
      if (!element || !text) return resolve();

      if (abortCurrent) abortCurrent();

      let abort = false;
      abortCurrent = () => (abort = true);

      element.classList.remove('typing-done');
      element.style.visibility = 'visible';
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

        const currentText = text.slice(0, i + 1);
        if (showCursor) {
          element.textContent = currentText;
          element.appendChild(caret);
        } else {
          element.textContent = currentText;
        }

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

  // ===== RUN TYPING (A função que você usa no section-intro.js) =====
  window.runTyping = (element, text, callback, options = {}) => {
    const speed = options.speed || 36;
    const cursor = options.cursor === undefined ? true : options.cursor;
    typingLog('Iniciando runTyping para elemento:', element);
    lock();

    typeText(element, text, speed, cursor).then(() => {
      typingLog('Typing concluído');
      unlock();
      if (callback) callback();
    });
  };

  // ===== FUNÇÕES TTS AUXILIARES (Para o EffectCoordinator) =====
  window.EffectCoordinator = window.EffectCoordinator || {};

  let ultimoTexto = '';
  let ultimoTempo = 0;

  window.EffectCoordinator.speak = (text, options = {}) => {
    if (!('speechSynthesis' in window) || !text || window.isMuted) return;
    const agora = Date.now();
    if (text === ultimoTexto && agora - ultimoTempo < 1000) {
      typingLog('TTS ignorado, texto repetido:', text.substring(0, 30) + '...');
      return;
    }
    ultimoTexto = text;
    ultimoTempo = agora;
    const utt = new SpeechSynthesisUtterance(text.trim());
    utt.lang = i18n.lang || 'pt-BR';
    utt.rate = options.rate || 1.03;
    utt.pitch = options.pitch || 1.0;
    utt.volume = 1;
    speechSynthesis.speak(utt);
    typingLog('TTS disparado:', text.substring(0, 30) + '...');
  };

  window.EffectCoordinator.stopAll = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      typingLog('TTS cancelado');
    }
    if (abortCurrent) abortCurrent();
    unlock();
  };

  typingLog('Pronto');

})(window);
