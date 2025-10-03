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
      if (!element) {
        console.warn('[TypingBridge] Elemento inválido para typeText');
        return resolve();
      }
      if (abortCurrent) abortCurrent();
      let abort = false;
      abortCurrent = () => (abort = true);

      const isVisible = element.offsetParent !== null && window.getComputedStyle(element).visibility !== 'hidden' && window.getComputedStyle(element).display !== 'none';
      console.log('[TypingBridge] Elemento visível:', isVisible, 'ID:', element.id || element.className);
      if (!isVisible) {
        console.warn('[TypingBridge] Elemento não visível, pulando datilografia:', element.id || element.className);
        return resolve();
      }

      element.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'typing-caret';
      caret.textContent = '|';
      if (showCursor) element.appendChild(caret);

      let i = 0;
      console.log('[TypingBridge] Iniciando datilografia para:', element.id || element.className, 'Texto:', text);
      const interval = setInterval(() => {
        if (abort) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          console.log('[TypingBridge] Datilografia abortada para:', element.id || element.className);
          return resolve();
        }
        console.log('[TypingBridge] Datilografando caractere', i + 1, '/', text.length, '- Texto atual:', text.slice(0, i));
        element.textContent = text.slice(0, i);
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          if (showCursor) caret.remove();
          element.classList.add('typing-done');
          console.log('[TypingBridge] Datilografia concluída para:', element.id || element.className);
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

      console.log('[TypingBridge] Tentando processar target:', target);

      if (typeof target === 'string') {
        container = document.querySelector(target);
        console.log('[TypingBridge] Container encontrado:', container ? container.id : 'Nenhum');
        if (!container) {
          const list = document.querySelectorAll(target);
          if (list && list.length) {
            elements = Array.from(list);
          } else {
            const active = document.querySelector('div[id^="section-"].active') || document.getElementById('section-intro');
            if (active) container = active;
            console.log('[TypingBridge] Seção ativa como fallback:', active ? active.id : 'Nenhuma');
          }
        }
      } else if (target instanceof HTMLElement) {
        container = target;
        console.log('[TypingBridge] Container é HTMLElement:', container.id || container.className);
      } else if (target && typeof NodeList !== 'undefined' && target instanceof NodeList) {
        elements = Array.from(target);
      } else if (Array.isArray(target)) {
        elements = target.filter(Boolean);
      } else {
        const active = document.querySelector('div[id^="section-"].active') || document.getElementById('section-intro');
        if (active) container = active;
        console.log('[TypingBridge] Usando seção ativa:', active ? active.id : 'Nenhuma');
      }

      if (!elements) {
        if (!container) {
          if (_attempt < 3) {
            console.log('[TypingBridge] Tentativa', _attempt + 1, 'para target:', target);
            setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 220);
            return;
          } else {
            console.warn('[TypingBridge] Nenhum container/elemento encontrado para:', target);
            if (callback) callback();
            return;
          }
        }
        const nodeList = container.hasAttribute('data-typing')
          ? [container]
          : container.querySelectorAll('[data-typing="true"]:not(.hidden)');
        elements = Array.from(nodeList);
        console.log('[TypingBridge] Elementos [data-typing] encontrados:', elements.length);
      }

      if (!elements.length) {
        if (_attempt < 3) {
          console.log('[TypingBridge] Tentativa', _attempt + 1, 'sem elementos [data-typing]');
          setTimeout(() => playTypingAndSpeak(target, callback, _attempt + 1), 220);
          return;
        } else {
          console.warn('[TypingBridge] Nenhum elemento com [data-typing] encontrado para:', target || '(seção ativa)');
          if (callback) callback();
          return;
        }
      }

      try { await i18n.waitForReady(5000); } catch (_) {}

      let ttsQueue = [];
      for (const el of elements) {
        const texto =
          el.getAttribute('data-text') ||
          i18n.t(el.getAttribute('data-i18n-key') || el.getAttribute('data-i18n') || 'welcome', { ns: 'common' }) ||
          el.textContent || '';
        console.log('[TypingBridge] Processando elemento com texto:', texto, 'Elemento:', el.id || el.className);

        const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
        const mostrarCursor = el.getAttribute('data-cursor') === 'true';

        if (!texto) {
          console.warn('[TypingBridge] Nenhum texto encontrado para elemento:', el.id || el.className);
          continue;
        }

        await typeText(el, texto, velocidade, mostrarCursor);

        if ('speechSynthesis' in window && texto) {
          if (target === '#section-termos' || (target instanceof HTMLElement && target.closest('#section-termos'))) {
            console.log('[TypingBridge] Adicionando texto à fila TTS para section-termos, página:', window.currentTermosPage || 'termos-pg1');
            ttsQueue.push(texto.trim());
          } else {
            const utt = new SpeechSynthesisUtterance(texto.trim());
            utt.lang = i18n.lang || 'pt-BR';
            utt.rate = 1.03;
            utt.pitch = 1.0;
            utt.volume = window.isMuted ? 0 : 1;
            utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
            speechSynthesis.speak(utt);
            console.log('[TypingBridge] TTS iniciado automaticamente para:', target);
          }
        }
      }

      if (ttsQueue.length > 0 && (target === '#section-termos' || (target instanceof HTMLElement && target.closest('#section-termos')))) {
        console.log('[TypingBridge] Aguardando clique para TTS em section-termos, página:', window.currentTermosPage || 'termos-pg1');
        const btn = document.querySelector(`#${window.currentTermosPage || 'termos-pg1'} [data-action="termos-next"], #${window.currentTermosPage || 'termos-pg1'} [data-action="avancar"]`);
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
                  utt.onerror = (error) => console.error('[TypingBridge] Erro na leitura:', error);
                  speechSynthesis.speak(utt);
                  console.log('[TypingBridge] TTS iniciado para texto', index + 1, 'de', ttsQueue.length, 'em:', window.currentTermosPage || 'termos-pg1');
                }, index * 1000); // Delay para evitar sobreposição de áudio
              });
              ttsQueue = [];
            }, 100);
          }, { once: true });
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
  global.TypingBridge = TypingBridge;
  global.runTyping = playTypingAndSpeak;

  typingLog('Pronto');

  document.addEventListener('bootstrapComplete', () => {
    setTimeout(() => {
      const active = document.querySelector('div[id^="section-"].active') || document.getElementById('section-intro');
      console.log('[TypingBridge] Seção ativa após bootstrapComplete:', active ? active.id : 'Nenhuma');
      playTypingAndSpeak(active ? `#${active.id}` : '#section-intro', null);
    }, 100);
  });
})(window);
