import i18n from './i18n.js';

if (window.__TypingBridgeReady) {
  console.log('[TypingBridge] Já carregado, ignorando');
} else {
  window.__TypingBridgeReady = true;

  const typingLog = (...args) => console.log('[TypingBridge]', ...args);

  (function ensureStyle() {
    if (document.getElementById('typing-style')) return;
    const st = document.createElement('style');
    st.id = 'typing-style';
    st.textContent = `
      .typing-caret{display:inline-block;width:0.6ch;margin-left:2px;animation:blink 1s step-end infinite}
      .typing-done[data-typing]::after{content:''}
      @keyframes blink{50%{opacity:0}}
    `;
    document.head.appendChild(st);
  })();

  let ACTIVE = false;
  let abortCurrent = null;

  function lock() {
    ACTIVE = true;
    window.__typingLock = true;
  }

  function unlock() {
    ACTIVE = false;
    window.__typingLock = false;
  }

  async function typeText(element, text, speed = 40, showCursor = false) {
    return new Promise(resolve => {
      if (!element) return resolve();
      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => (abort = true);

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

  async function playTypingAndSpeak(selectorOrElement, callback) {
    if (ACTIVE) {
      typingLog('Já em execução, ignorando');
      if (callback) callback();
      return;
    }
    lock();
    try {
      let container;
      if (typeof selectorOrElement === 'string') {
        container = document.querySelector(selectorOrElement);
        if (!container) {
          console.warn('[TypingBridge] Seletor não encontrou elementos:', selectorOrElement);
          if (callback) callback();
          return;
        }
      } else if (selectorOrElement instanceof HTMLElement) {
        container = selectorOrElement;
      } else {
        console.error('[TypingBridge] Argumento inválido:', selectorOrElement);
        if (callback) callback();
        return;
      }

      const elementos = container.hasAttribute('data-typing')
        ? [container]
        : container.querySelectorAll('[data-typing]');

      if (!elementos.length) {
        console.warn('[TypingBridge] Nenhum elemento com data-typing encontrado em:', container);
        if (callback) callback();
        return;
      }

      await i18n.waitForReady(5000);
      typingLog('i18n pronto, idioma:', i18n.lang || 'pt-BR (fallback)');

      for (const el of elementos) {
        const texto = el.getAttribute('data-text') || 
                      i18n.t(el.getAttribute('data-i18n-key') || el.getAttribute('data-i18n') || 'welcome', { ns: 'common' }) || 
                      el.textContent || '';
        const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
        const mostrarCursor = el.getAttribute('data-cursor') === 'true';

        if (!texto) {
          console.warn('[TypingBridge] Texto não encontrado para elemento:', el);
          continue;
        }

        await typeText(el, texto, velocidade, mostrarCursor);

        if (!abortCurrent && 'speechSynthesis' in window && texto) {
          const utt = new SpeechSynthesisUtterance(texto.trim());
          utt.lang = i18n.lang || 'pt-BR';
          utt.rate = 1.03;
          utt.pitch = 1.0;
          utt.volume = window.isMuted ? 0 : 1;
          utt.onend = () => typingLog('Leitura concluída para:', texto);
          utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
          speechSynthesis.cancel();
          speechSynthesis.speak(utt);
          typingLog('Iniciando leitura com idioma:', utt.lang);
        }
      }

      if (callback) callback();
    } catch (e) {
      console.error('[TypingBridge] Erro:', e);
      if (callback) callback();
    } finally {
      unlock();
    }
  }

  const TypingBridge = {
    play: playTypingAndSpeak,
  };

  window.TypingBridge = TypingBridge;
  window.runTyping = playTypingAndSpeak;

  typingLog('Pronto');

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => playTypingAndSpeak('.text', null), 3000);
  });

  export function playTypingAndSpeak(selector, options) {
  // lógica da função
}

export default TypingBridge;

