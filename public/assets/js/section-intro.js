(function () {
  'use strict';

  // Namespace para isolar a seção
  window.JCIntro = window.JCIntro || {};

  // Verificar se o script já foi incluído
  if (document.querySelector('script[src*="section-intro.js"]')) {
    console.log('[JCIntro] Script já incluído, ignorando...');
    return;
  }

  // Verificar inicialização
  if (window.JCIntro.__bound) {
    console.log('[JCIntro] Já inicializado, ignorando...');
    return;
  }
  window.JCIntro.__bound = true;

  // Estado da seção
  window.JCIntro.state = {
    INTRO_READY: false,
    LISTENER_ADDED: false
  };

  // Funções utilitárias
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 10000, step = 50 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) {
          return reject(new Error(`timeout waiting ${selector}`));
        }
        setTimeout(tick, step);
      };
      tick();
    });
  }

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  function fromDetail(detail = {}) {
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    const node = detail.node || detail.root || null;
    return { sectionId, node };
  }

  // Handler principal
  const handler = async (evt) => {
    console.log('[JCIntro] Handler disparado:', evt?.detail);
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-intro') return;

    if (window.JCIntro.state.INTRO_READY || node?.dataset?.introInitialized) {
      console.log('[JCIntro] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForElement('#section-intro', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 15000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        console.error('[JCIntro] Section not found:', e);
        return;
      }
    }

    root.dataset.introInitialized = 'true';
    root.classList.add('section-intro');

    let p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn;
    try {
      p1_1 = await waitForElement('#intro-p1-1', { within: root, timeout: 15000 });
      p1_2 = await waitForElement('#intro-p1-2', { within: root, timeout: 15000 });
      p1_3 = await waitForElement('#intro-p1-3', { within: root, timeout: 15000 });
      p2_1 = await waitForElement('#intro-p2-1', { within: root, timeout: 15000 });
      p2_2 = await waitForElement('#intro-p2-2', { within: root, timeout: 15000 });
      avancarBtn = await waitForElement('#btn-avancar', { within: root, timeout: 15000 });
    } catch (e) {
      console.error('[JCIntro] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Intro.', 'error');
      return;
    }

    [p1_1, p1_2, p1_3, p2_1, p2_2].forEach(el => {
      if (el) {
        el.style.color = '#fff !important';
        el.style.opacity = '0 !important';
        el.style.visibility = 'hidden !important';
        el.style.display = 'none !important';
        console.log('[JCIntro] Texto inicializado:', el.id, el.textContent?.substring(0, 50));
      }
    });

    root.style.cssText = `
      background: transparent !important;
      padding: 24px !important;
      border-radius: 12px !important;
      width: 100% !important;
      max-width: 600px !important;
      margin: 12px auto !important;
      text-align: center !important;
      box-shadow: none !important;
      border: none !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 2 !important;
      overflow: hidden !important;
      min-height: 80vh !important;
      height: 80vh !important;
      box-sizing: border-box !important;
    `;

    if (avancarBtn) {
      avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
      avancarBtn.disabled = true;
      avancarBtn.style.opacity = '0.5 !important';
      avancarBtn.style.cursor = 'not-allowed !important';
      avancarBtn.style.display = 'inline-block !important';
      avancarBtn.style.margin = '8px auto !important';
      avancarBtn.style.visibility = 'visible !important';
      avancarBtn.textContent = 'Iniciar';
      console.log('[JCIntro] Botão inicializado:', avancarBtn.className, avancarBtn.textContent);
    }

    once(avancarBtn, 'click', () => {
      console.log('[JCIntro] Avançando para section-termos');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
        console.warn('[JCIntro] Fallback navigation to /termos');
      }
    });

    const runTypingChain = async () => {
      console.log('[JCIntro] runTypingChain chamado');
      if (window.__typingLock) {
        console.log('[JCIntro] Typing lock ativo, aguardando...');
        await new Promise(resolve => {
          const checkLock = () => {
            if (!window.__typingLock) {
              resolve();
            } else {
              setTimeout(checkLock, 100);
            }
          };
          checkLock();
        });
      }

      console.log('[JCIntro] Iniciando datilografia...');
      const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');

      if (!typingElements.length) {
        console.warn('[JCIntro] Nenhum elemento com data-typing="true" encontrado');
        if (avancarBtn) {
          avancarBtn.disabled = false;
          avancarBtn.style.opacity = '1 !important';
          avancarBtn.style.cursor = 'pointer !important';
        }
        return;
      }

      console.log('[JCIntro] Elementos encontrados:', Array.from(typingElements).map(el => el.id));

      // Fallback para window.runTyping
      if (typeof window.runTyping !== 'function') {
        console.warn('[JCIntro] window.runTyping não encontrado, usando fallback');
        window.runTyping = (el, text, resolve, options) => {
          let i = 0;
          const speed = options.speed || 50;
          const type = () => {
            if (i < text.length) {
              el.textContent += text.charAt(i);
              i++;
              setTimeout(type, speed);
            } else {
              el.textContent = text;
              resolve();
            }
          };
          type();
        };
      }

      for (const el of typingElements) {
        const text = getText(el);
        console.log('[JCIntro] Datilografando:', el.id, text.substring(0, 50));
        
        try {
          el.textContent = '';
          el.classList.add('typing-active', 'lumen-typing');
          el.style.color = '#fff !important';
          el.style.opacity = '0 !important';
          el.style.display = 'block !important';
          el.style.visibility = 'hidden !important';
          await new Promise(resolve => window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 50),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          }));
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
          el.style.opacity = '1 !important';
          el.style.visibility = 'visible !important';
          el.style.display = 'block !important';
          if (typeof window.EffectCoordinator?.speak === 'function') {
            window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
            console.log('[JCIntro] TTS ativado para:', el.id);
            await new Promise(resolve => setTimeout(resolve, text.length * 30));
          } else {
            console.warn('[JCIntro] window.EffectCoordinator.speak não encontrado');
          }
        } catch (err) {
          console.error('[JCIntro] Erro na datilografia para', el.id, err);
          el.textContent = text;
          el.classList.add('typing-done');
          el.style.opacity = '1 !important';
          el.style.visibility = 'visible !important';
          el.style.display = 'block !important';
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('[JCIntro] Datilografia concluída');
      if (avancarBtn) {
        avancarBtn.disabled = false;
        avancarBtn.style.opacity = '1 !important';
        avancarBtn.style.cursor = 'pointer !important';
      }
    };

    window.JCIntro.state.INTRO_READY = false;
    try {
      await runTypingChain();
      window.JCIntro.state.INTRO_READY = true;
    } catch (err) {
      console.error('[JCIntro] Erro na datilografia:', err);
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
      });
      if (avancarBtn) {
        avancarBtn.disabled = false;
        avancarBtn.style.opacity = '1 !important';
        avancarBtn.style.cursor = 'pointer !important';
      }
    }

    console.log('[JCIntro] Elementos encontrados:', {
      p1_1: !!p1_1, p1_1Id: p1_1?.id,
      p1_2: !!p1_2, p1_2Id: p1_2?.id,
      p1_3: !!p1_3, p1_3Id: p1_3?.id,
      p2_1: !!p2_1, p2_1Id: p2_1?.id,
      p2_2: !!p2_2, p2_2Id: p2_2?.id,
      avancarBtn: !!avancarBtn, avancarId: avancarBtn?.id
    });
  };

  // Método para limpar a seção
  window.JCIntro.destroy = () => {
    console.log('[JCIntro] Destruindo seção intro');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    const root = document.getElementById('section-intro');
    if (root) {
      root.dataset.introInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCIntro.state.INTRO_READY = false;
    window.JCIntro.state.LISTENER_ADDED = false;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  // Registrar handler
  if (!window.JCIntro.state.LISTENER_ADDED) {
    window.addEventListener('sectionLoaded', handler, { once: true });
    window.JCIntro.state.LISTENER_ADDED = true;
  }

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    setTimeout(() => {
      const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
      if (visibleIntro && !visibleIntro.dataset.introInitialized) {
        handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
