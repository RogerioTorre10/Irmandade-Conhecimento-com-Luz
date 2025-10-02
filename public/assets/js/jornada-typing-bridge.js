/* jornada-typing-bridge.js — versão global (sem ESM) */
(function (global) {
  'use strict';

  if (global.__TypingBridgeReady) {
    console.log('[TypingBridge] Já carregado, ignorando');
    return;
  }
  global.__TypingBridgeReady = true;

  const typingLog = (...args) => console.log('[TypingBridge]', ...args);

  // Usa o i18n global se existir; senão, cria um stub seguro
  const i18n = global.i18n || {
    lang: 'pt-BR',
    ready: false,
    t: (_, fallback) => fallback || _,
    apply: () => {},
    waitForReady: async () => {}
  };

  // --- estilo do cursor (uma única vez) ---
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
    global.__typingLock = true;
  }

  function unlock() {
    ACTIVE = false;
    global.__typingLock = false;
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

    // 1) Descobrir container/elements a partir do "target"
    if (typeof target === 'string') {
      // tenta um único elemento
      container = document.querySelector(target);

      if (!container) {
        // tenta NodeList do seletor
        const list = document.querySelectorAll(target);
        if (list && list.length) {
          elements = Array.from(list);
        } else {
          // fallback: usa a seção ativa
          const active = document.querySelector('section.active, .section.active, [id^="section-"].active');
          if (active) container = active;
        }
      }
    } else if (target instanceof HTMLElement) {
      container = target;
    } else if (target && typeof NodeList !== 'undefined' && target instanceof NodeList) {
      elements = Array.from(target);
    } else if (Array.isArray(target)) {
      elements = target.filter(Boolean);
    } else {
      // sem target: usa a seção ativa
      const active = document.querySelector('section.active, .section.active, [id^="section-"].active');
      if (active) container = active;
    }

    // 2) Se ainda não temos "elements", extraímos do container
    if (!elements) {
      if (!container) {
        // re-tenta algumas vezes (aguarda render)
        if (_attempt < 3) {
          setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 220);
        } else {
          console.warn('[TypingBridge] Nenhum container/elemento encontrado para:', target);
          if (callback) callback();
        }
        return;
      }
      const nodeList = container.hasAttribute('data-typing')
        ? [container]
        : container.querySelectorAll('[data-typing]');
      elements = Array.from(nodeList);
    }

    // 3) Se ainda vazio, mais uma tentativa curta
    if (!elements.length) {
      if (_attempt < 3) {
        setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 220);
      } else {
        console.warn('[TypingBridge] Nenhum elemento com [data-typing] encontrado para:', target || '(seção ativa)');
        if (callback) callback();
      }
      return;
    }

    // 4) Aguarda i18n
    try { await i18n.waitForReady(5000); } catch (_) {}

    // 5) Digita + (opcional) Lê
    for (const el of elements) {
      const texto =
        el.getAttribute('data-text') ||
        i18n.t(el.getAttribute('data-i18n-key') || el.getAttribute('data-i18n') || 'welcome', { ns: 'common' }) ||
        el.textContent || '';

      const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
      const mostrarCursor = el.getAttribute('data-cursor') === 'true';

      if (!texto) continue;

      await typeText(el, texto, velocidade, mostrarCursor);

      if ('speechSynthesis' in window && texto) {
        const utt = new SpeechSynthesisUtterance(texto.trim());
        utt.lang = i18n.lang || 'pt-BR';
        utt.rate = 1.03;
        utt.pitch = 1.0;
        utt.volume = window.isMuted ? 0 : 1;
        utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
        speechSynthesis.cancel();
        speechSynthesis.speak(utt);
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

  const TypingBridge = { play: playTypingAndSpeak };

  // Exposição global (compatível com os outros arquivos)
  global.TypingBridge = TypingBridge;
  global.runTyping = playTypingAndSpeak;

  typingLog('Pronto');

  // Auto-play suave após carregar a página
  document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const active = document.querySelector('section.active, .section.active, [id^="section-"].active');
    playTypingAndSpeak(active || document.body, null);
  }, 1200);
});

})(window);
