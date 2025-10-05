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
        speechSynthesis.cancel();
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
      element.style.opacity = '0';
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
        element.style.opacity = '1';
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

      const delay = parseInt(element.getAttribute('data-delay')) || 500;
      setTimeout(() => {}, delay);
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

  async function speakText(text, lang = 'pt-BR') {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window) || !text || !window.JORNADA?.tts?.enabled || window.isMuted) {
        console.warn('[TypingBridge] TTS desativado ou não suportado:', { 
          speechSynthesis: 'speechSynthesis' in window, 
          text, 
          ttsEnabled: window.JORNADA?.tts?.enabled, 
          isMuted: window.isMuted 
        });
        return resolve();
      }

      if (speechSynthesis.speaking || speechSynthesis.pending) {
        typingLog('TTS em andamento, aguardando conclusão...');
        const waitForTTS = () => new Promise(r => {
          const check = () => {
            if (!speechSynthesis.speaking && !speechSynthesis.pending) {
              r();
            } else {
              setTimeout(check, 100);
            }
          };
          check();
        });
        waitForTTS().then(() => {
          speechSynthesis.cancel();
          const utt = new SpeechSynthesisUtterance(text.trim());
          utt.lang = lang;
          utt.rate = 1.03;
          utt.pitch = 1.0;
          utt.volume = 1;
          utt.onend = () => {
            typingLog('TTS concluído para texto:', text);
            resolve();
          };
          utt.onerror = (error) => {
            console.error('[TypingBridge] Erro na leitura:', error, 'Texto:', text);
            resolve();
          };
          speechSynthesis.speak(utt);
          typingLog('TTS iniciado para texto:', text);
        });
      } else {
        speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text.trim());
        utt.lang = lang;
        utt.rate = 1.03;
        utt.pitch = 1.0;
        utt.volume = 1;
        utt.onend = () => {
          typingLog('TTS concluído para texto:', text);
          resolve();
        };
        utt.onerror = (error) => {
          console.error('[TypingBridge] Erro na leitura:', error, 'Texto:', text);
          resolve();
        };
        speechSynthesis.speak(utt);
        typingLog('TTS iniciado para texto:', text);
      }
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
            window.toast && window.toast(`Erro: Nenhum elemento encontrado para ${target}`);
            document.dispatchEvent(new CustomEvent('typingError', { detail: { target, error: 'No elements found' } }));
            document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
            if (callback) callback();
            return;
          }
        }
        const nodeList = container.hasAttribute('data-typing')
          ? [container]
          : container.querySelectorAll('[data-typing="true"]:not(.hidden)');
        elements = Array.from(nodeList);
        typingLog('Elementos [data-typing] encontrados:', elements.length, 'em', target);
      }

      if (!elements.length) {
        typingLog('Nenhum elemento com [data-typing], forçando allTypingComplete para:', target);
    document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
    if (callback) callback();
    return;
  }
      

      try { await i18n.waitForReady(10000); } catch (_) { console.warn('[TypingBridge] i18n.waitForReady falhou'); }

      let completed = 0;
      const total = elements.length;

      setTimeout(() => {
        if (completed < total) {
          console.warn('[TypingBridge] Timeout: Forçando allTypingComplete para:', target);
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
        }
      }, 15000); // Aumentado para dar tempo a parágrafos longos

      for (const el of elements) {
        const isVisible = el.offsetParent !== null && 
          window.getComputedStyle(el).visibility !== 'hidden' && 
          window.getComputedStyle(el).display !== 'none';
        typingLog('Verificando visibilidade do elemento:', el.id || el.className, 'Visível:', isVisible);

        const texto =
          el.getAttribute('data-text') ||
          (global.i18n ? i18n.t(el.getAttribute('data-i18n-key') || el.getAttribute('data-i18n') || 'welcome', { ns: 'common', defaultValue: el.textContent }) : el.textContent) ||
          el.textContent || '';
        typingLog('Processando elemento com texto:', texto, 'Elemento:', el.id || el.className);

        const velocidade = parseInt(el.getAttribute('data-speed')) || 40;
        const mostrarCursor = el.getAttribute('data-cursor') === 'true';

        if (!texto || !isVisible) {
          console.warn('[TypingBridge] Elemento sem texto ou invisível, pulando:', el.id || el.className);
          completed++;
          if (completed === total) {
            document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
            typingLog('Todos os elementos processados (alguns pulados) para:', target);
          }
          continue;
        }

        await typeText(el, texto, velocidade, mostrarCursor);
        await speakText(texto, i18n.lang || 'pt-BR');
        await new Promise(resolve => setTimeout(resolve, 600));
        completed++;
        if (completed === total) {
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
          typingLog('Todos os elementos datilografados para:', target);
        }
      }

      if (callback) callback();
    } catch (e) {
      console.error('[TypingBridge] Erro:', e);
      window.toast && window.toast('Erro ao processar conteúdo.');
      document.dispatchEvent(new CustomEvent('typingError', { detail: { target, error: e.message } }));
      document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target } }));
      if (callback) callback();
    } finally {
      unlock();
    }
  }

  const TypingBridge = { 
    play: playTypingAndSpeak,
    typeText,
    typePlaceholder,
    speakText
  };
  global.TypingBridge = TypingBridge;
  global.runTyping = playTypingAndSpeak;

  typingLog('Pronto');
})(window);
