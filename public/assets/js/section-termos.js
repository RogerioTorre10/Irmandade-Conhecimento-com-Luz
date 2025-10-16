(function () {
  'use strict';

  // Namespace para isolar a seção
  window.JCTermos = window.JCTermos || {};

  // Verificar inicialização
  if (window.JCTermos.__bound) {
    console.log('[JCTermos] Já inicializado, ignorando...');
    return;
  }
  window.JCTermos.__bound = true;

  // Estado da seção
  window.JCTermos.state = {
    ready: false,
    currentPage: 1,
    listenerAdded: false,
    HANDLER_COUNT: 0,
    TYPING_COUNT: 0
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

  async function waitForElement(selector, { within = document, timeout = 2000, step = 50 } = {}) {
    console.log('[JCTermos] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) {
          console.log('[JCTermos] Elemento encontrado:', selector);
          return resolve(el);
        }
        if (performance.now() - start >= timeout) {
          console.error('[JCTermos] Timeout aguardando:', selector);
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
    window.JCTermos.state.HANDLER_COUNT++;
    console.log(`[JCTermos] Handler disparado (${window.JCTermos.state.HANDLER_COUNT}x):`, evt?.detail);
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-termos') {
      console.log('[JCTermos] Ignorando, sectionId não é section-termos:', sectionId);
      return;
    }

    if (window.JCTermos.state.ready || (node && node.dataset.termosInitialized)) {
      console.log('[JCTermos] Já inicializado (ready ou data-termos-initialized), ignorando...');
      return;
    }

    let root = node || document.getElementById('section-termos');
    if (!root) {
      console.log('[JCTermos] Tentando localizar #section-termos...');
      try {
        root = await waitForElement('#section-termos', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 10000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        console.error('[JCTermos] Section not found:', e);
        // Fallback para criar seção
        const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
        root = document.createElement('section');
        root.id = 'section-termos';
        wrapper.appendChild(root);
        console.log('[JCTermos] Seção #section-termos criada como fallback');
      }
    }

    console.log('[JCTermos] Root encontrado:', root);
    root.dataset.termosInitialized = 'true';
    root.classList.add('section-termos');

    // Aplicar estilos ao root
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
      overflow-y: scroll;
      min-height: 80vh;
      height: 80vh;
      box-sizing: border-box;
    `;

    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      console.log('[JCTermos] Buscando elementos...');
      pg1 = await waitForElement('#termos-pg1', { within: root, timeout: 2000 });
      pg2 = await waitForElement('#termos-pg2', { within: root, timeout: 2000 });
      nextBtn = await waitForElement('.nextBtn[data-action="termos-next"]', { within: root, timeout: 2000 });
      prevBtn = await waitForElement('.prevBtn[data-action="termos-prev"]', { within: root, timeout: 2000 });
      avancarBtn = await waitForElement('.avancarBtn[data-action="avancar"]', { within: root, timeout: 2000 });
    } catch (e) {
      console.error('[JCTermos] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Termos.', 'error');
      // Fallback para criar elementos
      const createFallbackElement = (id, isButton = false) => {
        const el = document.createElement(isButton ? 'button' : 'div');
        el.id = id;
        if (!isButton) {
          el.setAttribute('data-typing', 'true');
          el.textContent = `Placeholder para ${id}`;
        } else {
          el.classList.add('btn', 'btn-primary', 'btn-stone');
          el.setAttribute('data-action', id.includes('next') ? 'termos-next' : id.includes('prev') ? 'termos-prev' : 'avancar');
          el.textContent = id.includes('next') ? 'Próxima página' : id.includes('prev') ? 'Voltar' : 'Aceito e quero continuar';
        }
        root.appendChild(el);
        return el;
      };
      pg1 = pg1 || createFallbackElement('termos-pg1');
      pg2 = pg2 || createFallbackElement('termos-pg2');
      nextBtn = nextBtn || createFallbackElement('nextBtn-termos-next', true);
      prevBtn = prevBtn || createFallbackElement('prevBtn-termos-prev', true);
      avancarBtn = avancarBtn || createFallbackElement('avancarBtn-avancar', true);
      console.log('[JCTermos] Elementos criados como fallback');
    }

    console.log('[JCTermos] Elementos carregados:', { pg1, pg2, nextBtn, prevBtn, avancarBtn });

    [pg1, pg2].forEach((el, i) => {
      if (el) {
        el.classList.remove('hidden');
        el.style.display = i === 0 ? 'block' : 'none';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        el.style.minHeight = '60vh';
        console.log('[JCTermos] Página inicializada:', el.id);
      }
    });

    [pg1, pg2].forEach(pg => {
      if (pg) {
        pg.querySelectorAll('[data-typing="true"]').forEach(el => {
          el.textContent = ''; // Limpar texto inicialmente
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.style.display = 'none';
          console.log('[JCTermos] Texto inicializado:', el.id);
        });
      }
    });

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.display = 'inline-block';
        btn.style.margin = '8px';
        btn.style.visibility = 'visible';
        console.log('[JCTermos] Botão inicializado:', btn.className, btn.textContent);
      }
    });

    const runTypingChain = async () => {
      window.JCTermos.state.TYPING_COUNT++;
      console.log(`[JCTermos] runTypingChain chamado (${window.JCTermos.state.TYPING_COUNT}x) na página ${window.JCTermos.state.currentPage}`);
      if (window.__typingLock) {
        console.log('[JCTermos] Typing lock ativo, aguardando...');
        await new Promise(resolve => {
          const checkLock = () => {
            if (!window.__typingLock) {
              console.log('[JCTermos] Lock liberado, prosseguindo...');
              resolve();
            } else {
              setTimeout(checkLock, 100);
            }
          };
          checkLock();
        });
      }

      console.log('[JCTermos] Iniciando datilografia na página atual...');
      const currentPg = window.JCTermos.state.currentPage === 1 ? pg1 : pg2;
      const typingElements = currentPg.querySelectorAll('[data-typing="true"]:not(.typing-done)');

      if (!typingElements.length) {
        console.warn('[JCTermos] Nenhum elemento com data-typing="true" encontrado na página atual');
        [nextBtn, prevBtn, avancarBtn].forEach(btn => {
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        });
        currentPg.style.opacity = '1';
        currentPg.style.visibility = 'visible';
        return;
      }

      console.log('[JCTermos] Elementos encontrados na página:', Array.from(typingElements).map(el => el.id));

      // Fallback para window.runTyping
      if (typeof window.runTyping !== 'function') {
        console.warn('[JCTermos] window.runTyping não encontrado, usando fallback');
        window.runTyping = (el, text, resolve, options) => {
          let i = 0;
          const speed = options.speed || 100;
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
        console.log('[JCTermos] Datilografando:', el.id, text.substring(0, 50));
        
        try {
          el.textContent = '';
          el.classList.add('typing-active', 'lumen-typing');
          el.style.color = '#fff';
          el.style.opacity = '0';
          el.style.display = 'block';
          el.style.visibility = 'hidden';
          currentPg.style.opacity = '1';
          currentPg.style.visibility = 'visible';
          await new Promise(resolve => window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 100),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          }));
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.display = 'block';
          if (typeof window.EffectCoordinator?.speak === 'function') {
            speechSynthesis.cancel(); // Cancelar qualquer TTS anterior
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            console.log('[JCTermos] TTS iniciado para:', el.id);
            window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
            await new Promise(resolve => {
              utterance.onend = () => {
                console.log('[JCTermos] TTS concluído para:', el.id);
                resolve();
              };
              setTimeout(resolve, text.length * 50);
            });
          } else {
            console.warn('[JCTermos] window.EffectCoordinator.speak não encontrado');
            await new Promise(resolve => setTimeout(resolve, text.length * 50));
          }
        } catch (err) {
          console.error('[JCTermos] Erro na datilografia para', el.id, err);
          el.textContent = text;
          el.classList.add('typing-done');
          el.style.opacity = '1';
          el.style.visibility = 'visible';
          el.style.display = 'block';
        }
        
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      console.log('[JCTermos] Datilografia concluída na página atual');
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        }
      });
    };

    once(nextBtn, 'click', async () => {
      speechSynthesis.cancel(); // Cancelar TTS anterior
      if (window.JCTermos.state.currentPage === 1 && pg2) {
        pg1.style.display = 'none';
        pg2.style.display = 'block';
        avancarBtn.textContent = 'Aceito e quero continuar';
        window.JCTermos.state.currentPage = 2;
        await runTypingChain();
      }
    });

    once(prevBtn, 'click', async () => {
      speechSynthesis.cancel(); // Cancelar TTS anterior
      if (window.JCTermos.state.currentPage === 2 && pg1) {
        pg2.style.display = 'none';
        pg1.style.display = 'block';
        avancarBtn.textContent = 'Avançar';
        window.JCTermos.state.currentPage = 1;
        await runTypingChain();
      }
    });

    once(avancarBtn, 'click', async (e) => {
      if (e.isTrusted) { // Verificar se é um clique real
        speechSynthesis.cancel(); // Cancelar TTS ao avançar
        if (window.JCTermos.state.currentPage === 2) {
          console.log('[JCTermos] Avançando para section-senha');
          if (typeof window.JC?.show === 'function') {
            window.JC.show('section-senha');
          } else {
            window.location.href = '/senha';
            console.warn('[JCTermos] Fallback navigation to /senha');
          }
        }
      } else {
        console.log('[JCTermos] Clique simulado ignorado');
      }
    });

    window.JCTermos.state.ready = false;
    console.log('[JCTermos] Iniciando runTypingChain na página 1...');
    try {
      await runTypingChain();
      window.JCTermos.state.ready = true;
      console.log('[JCTermos] Inicialização concluída');
    } catch (err) {
      console.error('[JCTermos] Erro na datilografia:', err);
      [pg1, pg2].forEach(pg => {
        if (pg) {
          pg.querySelectorAll('[data-typing="true"]').forEach(el => {
            el.textContent = getText(el);
            el.classList.add('typing-done');
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            el.style.display = 'block';
          });
        }
      });
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        }
      });
    }

    console.log('[JCTermos] Elementos encontrados:', {
      pg1: !!pg1, pg1Id: pg1?.id,
      pg2: !!pg2, pg2Id: pg2?.id,
      nextBtn: !!nextBtn, nextBtnAction: nextBtn?.dataset?.action,
      prevBtn: !!prevBtn, prevBtnAction: prevBtn?.dataset?.action,
      avancarBtn: !!avancarBtn, avancarBtnAction: avancarBtn?.dataset?.action
    });
  };

  // Método para limpar a seção
  window.JCTermos.destroy = () => {
    console.log('[JCTermos] Destruindo seção termos');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    const root = document.getElementById('section-termos');
    if (root) {
      root.dataset.termosInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCTermos.state.ready = false;
    window.JCTermos.state.listenerAdded = false;
    window.JCTermos.state.HANDLER_COUNT = 0;
    window.JCTermos.state.TYPING_COUNT = 0;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  // Registrar handler
  if (!window.JCTermos.state.listenerAdded) {
    console.log('[JCTermos] Registrando listener para sectionLoaded');
    window.addEventListener('sectionLoaded', handler, { once: true });
    window.JCTermos.state.listenerAdded = true;
  }

  // Inicialização manual com tentativas repetidas
  const bind = () => {
    console.log('[JCTermos] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 10) => {
      setTimeout(() => {
        const visibleTermos = document.querySelector('#section-termos:not(.hidden)');
        if (visibleTermos && !window.JCTermos.state.ready && !visibleTermos.dataset.termosInitialized) {
          console.log('[JCTermos] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: 'section-termos', node: visibleTermos } });
        } else if (document.getElementById('section-termos') && !window.JCTermos.state.ready && !document.getElementById('section-termos').dataset.termosInitialized) {
          console.log('[JCTermos] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: 'section-termos', node: document.getElementById('section-termos') } });
        } else if (attempt < maxAttempts) {
          console.log('[JCTermos] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCTermos] Falha ao inicializar após ' + maxAttempts + ' tentativas');
        }
      }, 1000 * attempt);
    };

    tryInitialize();
  };

  if (document.readyState === 'loading') {
    console.log('[JCTermos] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCTermos] DOM já carregado, chamando bind');
    bind();
  }
})();
