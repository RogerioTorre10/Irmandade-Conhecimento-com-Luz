(function () {
  'use strict';

  const MOD = 'section-termos.js';
  const SECTION_ID = 'section-termos';
  const PREV_SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-senha';
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

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
    TYPING_COUNT: 0,
    typingInProgress: false,
    initialized: false
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

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

  function normalizeParagraph(el) {
    if (!el) return false;
    const source = getText(el);
    if (!source) return false;

    el.dataset.text = source;
    if (!el.classList.contains('typing-done')) {
      el.textContent = '';
      el.classList.remove('typing-active', 'typing-done');
      delete el.dataset.spoken;
    }
    return true;
  }

  async function typeOnce(el, { speed = 20, speak = true } = {}) {
    if (!el) return;
    const text = getText(el);
    if (!text) {
      console.warn('[JCTermos] Texto vazio para elemento:', el);
      return;
    }

    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.classList.add('typing-active', 'lumen-typing');
    el.classList.remove('typing-done');
    el.style.color = '#fff';
    el.style.opacity = '0';
    el.style.display = 'block';
    el.style.visibility = 'visible'; // Garantir visibilidade inicial

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || speed),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          });
        } catch (err) {
          console.warn('[JCTermos] runTyping falhou, usando fallback', err);
          usedFallback = true;
          resolve();
        }
      });
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      let i = 0;
      el.textContent = '';
      const type = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(type, speed);
        }
      };
      await new Promise(resolve => {
        const typeWrapper = () => {
          type();
          resolve();
        };
        typeWrapper();
      });
    }

    el.classList.add('typing-done');
    el.classList.remove('typing-active');
    el.style.opacity = '1';
    el.style.visibility = 'visible';
    window.G.__typingLock = prevLock;

    if (speak && typeof window.EffectCoordinator?.speak === 'function' && !el.dataset.spoken) {
      try {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'pt-BR';
        utterance.rate = 1.1;
        utterance.pitch = 1.0;
        console.log('[JCTermos] TTS iniciado para:', text);
        window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
        await new Promise(resolve => {
          utterance.onend = () => {
            console.log('[JCTermos] TTS concluído para:', text);
            resolve();
          };
          setTimeout(resolve, text.length * 70);
        });
        el.dataset.spoken = 'true';
      } catch (err) {
        console.error('[JCTermos] Erro no TTS:', err);
      }
    }

    await sleep(80);
  }

  async function waitForTypingBridge(maxMs = 3000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    console.warn('[JCTermos] window.runTyping não encontrado após', maxMs, 'ms');
    return true;
  }

  async function waitForVideoEnd(videoElementId = 'videoTransicao') {
    const video = document.getElementById(videoElementId);
    if (!video) {
      console.log('[JCTermos] Vídeo de transição não encontrado, usando timeout padrão');
      return sleep(TRANSITION_TIMEOUT_MS);
    }

    return new Promise((resolve) => {
      video.addEventListener('ended', () => {
        console.log('[JCTermos] Vídeo terminou');
        resolve();
      }, { once: true });
      setTimeout(resolve, TRANSITION_TIMEOUT_MS);
    });
  }

  function playTransitionVideo(nextSectionId) {
    console.log('[JCTermos] Iniciando transição de vídeo:', TRANSITION_SRC);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(TRANSITION_SRC, nextSectionId);
    } else {
      console.warn('[JCTermos] window.playTransitionVideo não encontrado, usando fallback');
      setTimeout(() => {
        console.log('[JCTermos] Fallback: navegando para:', nextSectionId);
        if (typeof window.JC?.show === 'function') {
          window.JC.show(nextSectionId);
        } else {
          console.warn('[JCTermos] Fallback navigation to:', nextSectionId);
          window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
        }
      }, 2000);
    }
  }

  function pickElements(root) {
    return {
      pg1: root.querySelector('#termos-pg1'),
      pg2: root.querySelector('#termos-pg2'),
      nextBtn: root.querySelector('.nextBtn[data-action="termos-next"]'),
      prevBtn: root.querySelector('.prevBtn[data-action="termos-prev"]'),
      avancarBtn: root.querySelector('.avancarBtn[data-action="avancar"]')
    };
  }

  async function runTypingSequence(root) {
    window.JCTermos.state.typingInProgress = true;
    console.log('[JCTermos] Iniciando sequência de datilografia');

    const { pg1, pg2, nextBtn, prevBtn, avancarBtn } = pickElements(root);
    const currentPg = window.JCTermos.state.currentPage === 1 ? pg1 : pg2;
    const seq = Array.from(currentPg.querySelectorAll('[data-typing="true"]:not(.typing-done)')).sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.left - bRect.left || aRect.top - bRect.top;
    });

    nextBtn?.setAttribute('disabled', 'true');
    prevBtn?.setAttribute('disabled', 'true');
    avancarBtn?.setAttribute('disabled', 'true');

    seq.forEach(normalizeParagraph);

    await waitForVideoEnd();
    await sleep(1000);

    await waitForTypingBridge();

    if (!seq.length) {
      console.warn('[JCTermos] Nenhum elemento com data-typing="true" encontrado na página atual');
      currentPg.style.opacity = '1';
      currentPg.style.visibility = 'visible';
      currentPg.style.display = 'block';
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
          btn.style.visibility = 'visible';
        }
      });
      window.JCTermos.state.typingInProgress = false;
      window.JCTermos.state.initialized = true;
      return;
    }

    for (const el of seq) {
      await typeOnce(el, { speed: 20, speak: true });
    }

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.visibility = 'visible';
      }
    });

    currentPg.style.opacity = '1';
    currentPg.style.visibility = 'visible';
    currentPg.style.display = 'block';

    window.JCTermos.state.typingInProgress = false;
    window.JCTermos.state.initialized = true;
    console.log('[JCTermos] Datilografia concluída na página atual');
  }

  const onShown = async (evt) => {
    window.JCTermos.state.HANDLER_COUNT++;
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) {
      console.log('[JCTermos] Ignorando, sectionId não é section-termos:', sectionId);
      return;
    }

    if (window.JCTermos.state.ready || node?.dataset.termosInitialized === 'true') {
      console.log('[JCTermos] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.error('[JCTermos] Root #section-termos não encontrado');
      window.toast?.('Erro: Seção Termos não carregada.', 'error');
      return;
    }

    console.log('[JCTermos] Root encontrado:', root);
    root.dataset.termosInitialized = 'true';

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
      overflow-y: auto;
      min-height: calc(100vh - 100px);
      height: auto;
      box-sizing: border-box;
      @media (max-width: 768px) {
        padding: 16px;
        margin: 8px auto;
        font-size: 14px;
      }
      @media (max-width: 480px) {
        padding: 12px;
        font-size: 12px;
      }
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
        el.style.opacity = '1'; // Garantir visibilidade inicial
        el.style.visibility = 'visible';
        el.style.minHeight = '60vh';
        console.log('[JCTermos] Página inicializada:', el.id);
      }
    });

    [pg1, pg2].forEach(pg => {
      if (pg) {
        pg.querySelectorAll('[data-typing="true"]').forEach(el => {
          el.textContent = '';
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          el.style.display = 'block'; // Garantir display inicial
          console.log('[JCTermos] Texto inicializado:', el.id);
        });
      }
    });

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = true;
        btn.style.padding = '12px 20px';
        btn.style.fontSize = '16px';
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
        btn.style.display = 'inline-block';
        btn.style.margin = '10px';
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
      await runTypingSequence(root);
    };

    once(nextBtn, 'click', async () => {
      speechSynthesis.cancel();
      if (window.JCTermos.state.currentPage === 1 && pg2) {
        pg1.style.display = 'none';
        pg2.style.display = 'block';
        pg2.style.opacity = '1';
        pg2.style.visibility = 'visible';
        avancarBtn.textContent = 'Aceito e quero continuar';
        window.JCTermos.state.currentPage = 2;
        await runTypingChain();
      }
    });

    once(prevBtn, 'click', async (e) => {
      if (e.istrusted) {
        speechSynthesis.cancel();
        console.log('[JCTermos] Redirecionando para site fora da jornada');
        window.location.href = '/';
      } else {
        console.log('[JCTermos] Clique simulado ignorado');
      }
    });

    once(avancarBtn, 'click', async (e) => {
      if (e.isTrusted) {
        speechSynthesis.cancel();
        if (window.JCTermos.state.currentPage === 2) {
          console.log('[JCTermos] Avançando para section-senha com transição de vídeo');
          playTransitionVideo(NEXT_SECTION_ID);
        }
      } else {
        console.log('[JCTermos] Clique simulado ignorado');
      }
    });

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          btn.click();
          console.log('[JCTermos] Toque detectado em:', btn.id);
        }, { passive: false });
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
          btn.style.visibility = 'visible';
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
    document.removeEventListener('section:shown', onShown);
    const root = document.getElementById(SECTION_ID);
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
    window.JCTermos.state.typingInProgress = false;
    window.JCTermos.state.initialized = false;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  // Registrar handler
  if (!window.JCTermos.state.listenerAdded) {
    console.log('[JCTermos] Registrando listener para section:shown');
    document.addEventListener('section:shown', onShown, { once: true });
    window.JCTermos.state.listenerAdded = true;
  }

  // Inicialização manual com tentativas repetidas
  const bind = () => {
    console.log('[JCTermos] Executando bind');
    document.removeEventListener('section:shown', onShown);
    document.addEventListener('section:shown', onShown, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 10) => {
      setTimeout(() => {
        const visibleTermos = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visibleTermos && !window.JCTermos.state.ready && !visibleTermos.dataset.termosInitialized) {
          console.log('[JCTermos] Seção visível encontrada, disparando handler');
          onShown({ detail: { sectionId: SECTION_ID, node: visibleTermos } });
        } else if (document.getElementById(SECTION_ID) && !window.JCTermos.state.ready && !document.getElementById(SECTION_ID).dataset.termosInitialized) {
          console.log('[JCTermos] Forçando inicialização manual (tentativa ' + attempt + ')');
          onShown({ detail: { sectionId: SECTION_ID, node: document.getElementById(SECTION_ID) } });
        } else if (attempt < maxAttempts) {
          console.log('[JCTermos] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCTermos] Falha ao inicializar após', maxAttempts, 'tentativas');
        }
      }, 100);
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
