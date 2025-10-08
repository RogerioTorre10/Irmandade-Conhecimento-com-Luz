(function (global) {
  'use strict';

  if (global.__TypingBridgeReady) {
    console.log('[TypingBridge] Já carregado, ignorando');
    return;
  }
  global.__TypingBridgeReady = true;

  const typingLog = (...args) => console.log('[TypingBridge]', ...args);

  const i18n = global.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (_, fallback) => fallback || _,
    apply: () => {},
    waitForReady: async () => {}
  };

  (function ensureStyle() {
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret { display: inline-block; width: 0.6ch; margin-left: 2px; animation: blink 1s step-end infinite; }
      .typing-done[data-typing]::after { content: ''; }
      @keyframes blink { 50% { opacity: 0; } }
      [data-typing="true"] { opacity: 0; transition: opacity 0.1s; visibility: visible; display: block !important; }
      [data-typing="true"].typing-done { opacity: 1; visibility: visible; }
    `;
    document.head.appendChild(st);
    console.log('[TypingBridge] Estilo de datilografia aplicado');
  })();

  let ACTIVE = false;
  let abortCurrent = null;

  function lock() {
    ACTIVE = true;
    global.__typingLock = true;
    console.log('[TypingBridge] Lock ativado');
  }

  function unlock() {
    ACTIVE = false;
    global.__typingLock = false;
    console.log('[TypingBridge] Lock desativado');
  }

  async function typeText(element, text, speed = 40, showCursor = false) {
    return new Promise(resolve => {
      if (!element || !text) {
        console.warn('[TypingBridge] Elemento ou texto inválido para typeText');
        return resolve();
      }
      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => (abort = true);

      element.style.visibility = 'visible';
      element.style.display = 'block';
      element.style.opacity = '0';
      element.textContent = '';

      const caret = document.createElement('span');
      caret.className = 'typing-caret';
      caret.textContent = '|';
      if (showCursor) element.appendChild(caret);

      let i = 0;
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          return resolve();
        }
        element.textContent = text.slice(0, i);
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

  async function playTypingAndSpeak(target, callback, _attempt = 0) {
    if (ACTIVE) {
      typingLog('Já em execução, ignorando');
      if (callback) callback();
      return;
    }
    lock();
    try {
      let container = null;
      let elements = null;

      if (typeof target === 'string') {
        container = document.querySelector(target);
        if (!container) {
          const list = document.querySelectorAll(target);
          if (list && list.length) elements = Array.from(list);
        }
      } else if (target instanceof HTMLElement) {
        container = target;
      } else if (target instanceof NodeList) {
        elements = Array.from(target);
      } else if (Array.isArray(target)) {
        elements = target.filter(Boolean);
      }

      if (!elements) {
        if (!container) {
          if (_attempt < 3) {
            setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 300);
            return;
          } else {
            if (callback) callback();
            return;
          }
        }
        const nodeList = container.hasAttribute('data-typing')
          ? [container]
          : container.querySelectorAll('[data-typing="true"]:not(.hidden)');
        elements = Array.from(nodeList);
      }

      if (!elements.length) {
        if (_attempt < 3) {
          setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 300);
          return;
        } else {
          if (callback) callback();
          return;
        }
      }

      try { await i18n.waitForReady(5000); } catch (e) {}

      let ttsQueue = [];
      for (const el of elements) {
        const texto = el.getAttribute('data-text') || el.textContent || '';
        const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
        const mostrarCursor = el.getAttribute('data-cursor') === 'true';

        if (!texto) continue;

        el.style.display = 'block';
        el.style.visibility = 'visible';
        await typeText(el, texto, velocidade, mostrarCursor);

        if ('speechSynthesis' in window && texto) {
          if (target === '#section-termos' || (target instanceof HTMLElement && target.closest('#section-termos'))) {
            ttsQueue.push(texto.trim());
          } else {
            const utt = new SpeechSynthesisUtterance(texto.trim());
            utt.lang = i18n.lang || 'pt-BR';
            utt.rate = 1.03;
            utt.pitch = 1.0;
            utt.volume = window.isMuted ? 0 : 1;
            speechSynthesis.speak(utt);
          }
        }
      }

      if (ttsQueue.length > 0) {
        const btn = document.querySelector(`#${window.currentTermosPage || 'termos-pg1'} [data-action="termos-next"], [data-action="avancar"]`);
        if (btn) {
          btn.addEventListener('click', () => {
            setTimeout(() => {
              ttsQueue.forEach((text, index) => {
                setTimeout(() => {
                  const utt = new SpeechSynthesisUtterance(text);
                  utt.lang = i18n.lang || 'pt-BR';
                  utt.rate = 1.03;
                  utt.pitch = 1.0;
                  utt.volume = window.isMuted ? 0 : 1;
                  speechSynthesis.speak(utt);
                }, index * 1000);
              });
              ttsQueue = [];
            }, 100);
          }, { once: true });
        }
      }

      if (callback) callback();
    } catch (e) {
      if (callback) callback();
    } finally {
      unlock();
    }
  }

  global.runTyping = (element, text, callback) => {
  console.log('[TypingBridge] Iniciando runTyping:', { element, text });
  if (!element || !text) {
    console.warn('[TypingBridge] Elemento ou texto inválido');
    if (callback) callback();
    return;
  }
  typeText(element, text, 36, true).then(() => {
    console.log('[TypingBridge] Typing concluído');
    if (callback) callback();
  });
};

  typingLog('Pronto');
})(window);
