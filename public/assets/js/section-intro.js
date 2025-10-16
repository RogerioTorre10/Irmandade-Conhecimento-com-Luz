(function () {
  'use strict';

  // Namespace para isolar a seção
  window.JCIntro = window.JCIntro || {};

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
    console.log('[JCIntro] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) {
          console.log('[JCIntro] Elemento encontrado:', selector);
          return resolve(el);
        }
        if (performance.now() - start >= timeout) {
          console.error('[JCIntro] Timeout aguardando:', selector);
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
    if (sectionId !== 'section-intro') {
      console.log('[JCIntro] Ignorando, sectionId não é section-intro:', sectionId);
      return;
    }

    if (window.JCIntro.state.INTRO_READY || (node && node.dataset.introInitialized)) {
      console.log('[JCIntro] Já inicializado (INTRO_READY ou data-intro-initialized), ignorando...');
      return;
    }

    let root = node || document.getElementById('section-intro');
    if (!root) {
      console.log('[JCIntro] Tentando localizar #section-intro...');
      try {
        root = await waitForElement('#section-intro', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 15000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        console.error('[JCIntro] Section not found:', e);
        // Fallback para criar seção
        const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
        root = document.createElement('section');
        root.id = 'section-intro';
        wrapper.appendChild(root);
        console.log('[JCIntro] Seção #section-intro criada como fallback');
      }
    }

    console.log('[JCIntro] Root encontrado:', root);
    root.dataset.introInitialized = 'true';
    root.classList.add('section-intro');

    let p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn;
    try {
      console.log('[JCIntro] Buscando elementos...');
      p1_1 = await waitForElement('#intro-p1-1', { within: root, timeout: 15000 });
      p1_2 = await waitForElement('#intro-p1-2', { within: root, timeout: 15000 });
      p1_3 = await waitForElement('#intro-p1-3', { within: root, timeout: 15000 });
      p2_1 = await waitForElement('#intro-p2-1', { within: root, timeout: 15000 });
      p2_2 = await waitForElement('#intro-p2-2', { within: root, timeout: 15000 });
      avancarBtn = await waitForElement('#btn-avancar', { within: root, timeout: 15000 });
    } catch (e) {
      console.error('[JCIntro] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Intro.', 'error');
      // Fallback para criar elementos
      const createFallbackElement = (id) => {
        const el = document.createElement('div');
        el.id = id;
        el.setAttribute('data-typing', 'true');
        el.textContent = `Placeholder para ${id}`;
        root.appendChild(el);
        return el;
      };
      p1_1 = p1_1 || createFallbackElement('intro-p1-1');
      p1_2 = p1_2 || createFallbackElement('intro-p1-2');
      p1_3 = p1_3 || createFallbackElement('intro-p1-3');
      p2_1 = p2_1 || createFallbackElement('intro-p2-1');
      p2_2 = p2_2 || createFallbackElement('intro-p2-2');
      avancarBtn = avancarBtn || document.createElement('button');
      avancarBtn.id = 'btn-avancar';
      root.appendChild(avancarBtn);
      console.log('[JCIntro] Elementos criados como fallback');
    }

    console.log('[JCIntro] Elementos carregados:', { p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn });

    [p1_1, p1_2, p1_3, p2_1, p2_2].forEach(el => {
      if (el) {
        el.style.color = '#fff';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        el.style.display = 'none';
        console.log('[JCIntro] Texto inicializado:', el.id, el.textContent?.substring(0, 50));
      }
    });

    root.style.cssText = `
      background: transparent;
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
      margin: 12px auto;
      text-align: center;
      box-shadow: none;
      border: none;
      display: block;
      opacity: 1;
      visibility: visible;
      position: relative;
      z-index: 2;
      overflow: hidden;
      min-height: 80vh;
      height: 80vh;
      box-sizing: border-box;
    `;

    if (avancarBtn) {
      avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
      avancarBtn.disabled = true;
      avancarBtn.style.opacity = '0.5';
      avancarBtn.style.cursor = 'not-allowed';
      avancarBtn.style.display = 'inline-block';
      avancarBtn.style.margin = '8px auto';
      avancarBtn.style.visibility = 'visible';
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
              console.log('[JCIntro] Lock liberado, prosseguindo...');
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
          avancarBtn.style.opacity = '1';
          avancarBtn.style.cursor = 'pointer';
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
          el.style.color = '#fff';
          el.style.opacity = '0';
          el.style.display = 'block';
          el.style.visibility = 'hidden';
          await new Promise(resolve => window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 50),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          }));
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.display = 'block';
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
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.display = 'block';
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('[JCIntro] Datilografia concluída');
      if (avancarBtn) {
        avancarBtn.disabled = false;
        avancarBtn.style.opacity = '1';
        avancarBtn.style.cursor = 'pointer';
      }
    };

    window.JCIntro.state.INTRO_READY = false;
    console.log('[JCIntro] Iniciando runTypingChain...');
    try {
      await runTypingChain();
      window.JCIntro.state.INTRO_READY = true;
      console.log('[JCIntro] Inicialização concluída');
    } catch (err) {
      console.error('[JCIntro] Erro na datilografia:', err);
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        el.style.display = 'block';
      });
      if (avancarBtn) {
        avancarBtn.disabled = false;
        avancarBtn.style.opacity = '1';
        avancarBtn.style.cursor = 'pointer';
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
    console.log('[JCIntro] Registrando listener para sectionLoaded');
    window.addEventListener('sectionLoaded', handler, { once: true });
    window.JCIntro.state.LISTENER_ADDED = true;
  }

  // Inicialização manual
  const bind = () => {
    console.log('[JCIntro] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    setTimeout(() => {
      const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
      if (visibleIntro && !window.JCIntro.state.INTRO_READY && !visibleIntro.dataset.introInitialized) {
        console.log('[JCIntro] Seção visível encontrada, disparando handler');
        handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
      } else {
        console.log('[JCIntro] Nenhuma seção visível ou já inicializada');
      }
    }, 1000);
  };

  if (document.readyState === 'loading') {
    console.log('[JCIntro] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCIntro] DOM já carregado, chamando bind');
    bind();
  }
})();
