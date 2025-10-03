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
      .typing-caret {
        display: inline-block;
        width: var(--caret-width, 0.6ch);
        margin-left: var(--caret-margin, 2px);
        animation: blink 1s step-end infinite;
        color: var(--caret-color, currentColor);
      }
      .typing-done[data-typing]::after { content: '' }
      @keyframes blink { 50% { opacity: 0 } }
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
      if (!element) {
        console.warn('[TypingBridge] Elemento inválido para typeText');
        return resolve();
      }
      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => {
        abort = true;
        speechSynthesis.cancel(); // Cancela TTS ativo
      };

      const isVisible = element.offsetParent !== null && 
        window.getComputedStyle(element).visibility !== 'hidden' && 
        window.getComputedStyle(element).display !== 'none';
      if (!isVisible) {
        console.warn('[TypingBridge] Elemento não visível, pulando datilografia:', element.id || element.className);
        return resolve();
      }

      element.setAttribute('aria-live', 'polite');
      element.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'typing-caret';
      caret.textContent = '|';
      if (showCursor) element.appendChild(caret);

      let i = 0;
      typingLog('Iniciando datilografia para:', element.id || element.className, 'Texto:', text);
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          typingLog('Datilografia abortada para:', element.id || element.className);
          return resolve();
        }
        element.textContent = text.slice(0, i);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          element.classList.add('typing-done');
          typingLog('Datilografia concluída para:', element.id || element.className);
          document.dispatchEvent(new CustomEvent('typingComplete', { detail: { element, text } }));
          resolve();
        }
      }, speed);

      const delay = parseInt(element.getAttribute('data-delay')) || 0;
      if (delay) {
        setTimeout(() => {}, delay);
      }
    });
  }

  async function typePlaceholder(input, text, speed = 22) {
    return new Promise(resolve => {
      if (!input) {
        console.warn('[TypingBridge] Input inválido para typePlaceholder');
        return resolve();
      }
      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => {
        abort = true;
        speechSynthesis.cancel();
      };
      input.placeholder = '';
      let i = 0;
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          return resolve();
        }
        input.placeholder = text.slice(0, i) + (i < text.length ? '▌' : '');
        i++;
        if (i > text.length) {
          clearInterval(interval);
          input.placeholder = text;
          typingLog('Placeholder digitado:', text);
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
          if (list && list.length) {
            elements = Array.from(list);
          } else {
            const active = document.querySelector('div[id^="section-"].active') || document.getElementById('section-intro');
            if (active) container = active;
            typingLog('Seção ativa como fallback:', active ? active.id : 'Nenhuma');
          }
        }
      } else if (target instanceof HTMLElement) {
        container = target;
      } else if (target && typeof NodeList !== 'undefined' && target instanceof NodeList) {
        elements = Array.from(target);
      } else if (Array.isArray(target)) {
        elements = target.filter(Boolean);
      } else {
        const active = document.querySelector('div[id^="section-"].active') || document.getElementById('section-intro');
        if (active) container = active;
        typingLog('Usando seção ativa:', active ? active.id : 'Nenhuma');
      }

      if (!elements) {
        if (!container) {
          if (_attempt < 3) {
            typingLog('Tentativa', _attempt + 1, 'para target:', target);
            setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 220);
            return;
          } else {
            console.error('[TypingBridge] Nenhum container/elemento encontrado para:', target);
            document.dispatchEvent(new CustomEvent('typingError', { detail: { target, error: 'No elements found' } }));
            if (callback) callback();
            return;
          }
        }
        const nodeList = container.hasAttribute('data-typing')
          ? [container]
          : container.querySelectorAll('[data-typing="true"]:not(.hidden)');
        elements = Array.from(nodeList);
        typingLog('Elementos [data-typing] encontrados:', elements.length);
      }

      if (!elements.length) {
        if (_attempt < 3) {
          typingLog('Tentativa', _attempt + 1, 'sem elementos [data-typing]');
          setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 220);
          return;
        } else {
          console.error('[TypingBridge] Nenhum elemento com [data-typing] encontrado para:', target || '(seção ativa)');
          document.dispatchEvent(new CustomEvent('typingError', { detail: { target, error: 'No typing elements found' } }));
          if (callback) callback();
          return;
        }
      }

      try { await i18n.waitForReady(5000); } catch (_) {}

      let ttsQueue = [];
      let completed = 0;
      const total = elements.length;

      for (const el of elements) {
        const texto =
          el.getAttribute('data-text') ||
          i18n.t(el.getAttribute('data-i18n-key') || el.getAttribute('data-i18n') || 'welcome', { ns: 'common' }) ||
          el.textContent || '';
        typingLog('Processando elemento com texto:', texto, 'Elemento:', el.id || el.className);

        const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
        const mostrarCursor = el.getAttribute('data-cursor') === 'true';

        if (!texto) {
          console.warn('[TypingBridge] Nenhum texto encontrado para elemento:', el.id || el.className);
          completed++;
          if (completed === total) {
            document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
          }
          continue;
        }

        await typeText(el, texto, velocidade, mostrarCursor);
        completed++;
        if (completed === total) {
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
          typingLog('Todos os elementos datilografados para:', target);
        }

        if ('speechSynthesis' in window && texto) {
          if (target === '#section-termos' || (target instanceof HTMLElement && target.closest('#section-termos'))) {
            ttsQueue.push(texto.trim());
          } else {
            const utt = new SpeechSynthesisUtterance(texto.trim());
            utt.lang = i18n.lang || 'pt-BR';
            utt.rate = 1.03;
            utt.pitch = 1.0;
            utt.volume = window.isMuted !== undefined ? (window.isMuted ? 0 : 1) : 1;
            utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
            speechSynthesis.speak(utt);
            typingLog('TTS iniciado automaticamente para:', target);
          }
        }
      }

      if (ttsQueue.length > 0 && (target === '#section-termos' || (target instanceof HTMLElement && target.closest('#section-termos')))) {
        const pageId = window.currentTermosPage || 'termos-pg1';
        const btn = document.querySelector(`#${pageId} [data-action="termos-next"], #${pageId} [data-action="avancar"]`);
        if (btn) {
          btn.addEventListener('click', () => {
            setTimeout(() => {
              ttsQueue.forEach((text, index) => {
                setTimeout(() => {
                  const utt = new SpeechSynthesisUtterance(text);
                  utt.lang = i18n.lang || 'pt-BR';
                  utt.rate = 1.03;
                  utt.pitch = 1.0;
                  utt.volume = window.isMuted !== undefined ? (window.isMuted ? 0 : 1) : 1;
                  utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
                  speechSynthesis.speak(utt);
                  typingLog('TTS iniciado para texto', index + 1, 'de', ttsQueue.length, 'em:', pageId);
                }, index * 1000);
              });
              ttsQueue = [];
            }, 100);
          }, { once: true });
        } else {
          console.warn('[TypingBridge] Botão de navegação não encontrado para:', pageId);
          ttsQueue.forEach((text, index) => {
            setTimeout(() => {
              const utt = new SpeechSynthesisUtterance(text);
              utt.lang = i18n.lang || 'pt-BR';
              utt.rate = 1.03;
              utt.pitch = 1.0;
              utt.volume = window.isMuted !== undefined ? (window.isMuted ? 0 : 1) : 1;
              utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
              speechSynthesis.speak(utt);
            }, index * 1000);
          });
          ttsQueue = [];
        }
      }

      if (callback) callback();
    } catch (e) {
      console.error('[TypingBridge] Erro:', e);
      document.dispatchEvent(new CustomEvent('typingError', { detail: { target, error: e.message } }));
      if (callback) callback();
    } finally {
      unlock();
    }
  }

  const TypingBridge = { 
    play: playTypingAndSpeak,
    typeText,
    typePlaceholder
  };
  global.TypingBridge = TypingBridge;
  global.runTyping = playTypingAndSpeak;

  typingLog('Pronto');

  document.addEventListener('bootstrapComplete', () => {
    setTimeout(() => {
      const active = document.querySelector('div[id^="section-"].active') || document.getElementById('section-intro');
      typingLog('Seção ativa após bootstrapComplete:', active ? active.id : 'Nenhuma');
      playTypingAndSpeak(active ? `#${active.id}` : '#section-intro', null);
    }, 100);
  });
})(window);
