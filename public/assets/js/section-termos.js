(function () {
  'use strict';

  const MOD = 'section-termos.js';
  const SECTION_ID = 'section-termos';
  const NEXT_SECTION_ID = 'section-senha';
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

  if (window.JCTermos?.__bound) {
    console.log('[JCTermos] Já inicializado, ignorando...');
    return;
  }

  window.JCTermos = window.JCTermos || {};
  window.JCTermos.__bound = true;
  window.JCTermos.state = {
    ready: false,
    currentPage: 1,
    listenerAdded: false,
    HANDLER_COUNT: 0,
    TYPING_COUNT: 0,
    observer: null
  };

  // Utils
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const textOf = (el) => {
    if (!el) return '';
    const ds = el.dataset?.text;
    const tc = el.textContent || '';
    return (ds && ds.trim().length ? ds : tc).trim();
  };

  function normalizeParagraph(el) {
    if (!el) return false;
    const current = el.textContent?.trim() || '';
    const ds = el.dataset?.text?.trim() || '';
    const source = ds || current;

    if (!source) return false;

    el.dataset.text = source;
    if (!el.classList.contains('typing-done')) {
      el.textContent = '';
      el.classList.remove('typing-active', 'typing-done');
      delete el.dataset.spoken;
    }
    return true;
  }

  async function localType(el, text, speed = 20) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      };
      tick();
    });
  }

  async function typeOnce(el, { speed = 20, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || '').trim();
    if (!text) return;

    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.classList.add('typing-active', 'lumen-typing');
    el.classList.remove('typing-done');
    el.style.textAlign = 'left';

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(
            el,
            text,
            () => resolve(),
            { speed, cursor: true }
          );
        } catch (e) {
          console.warn('[JCTermos] runTyping falhou, usando fallback local', e);
          usedFallback = true;
          resolve();
        }
      });
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      await localType(el, text, speed);
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    window.G.__typingLock = prevLock;

    if (speak && text && window.EffectCoordinator?.speak && !el.dataset.spoken) {
      try {
        window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.1, pitch: 1.0 });
        console.log('[JCTermos] Iniciando TTS para:', text);
        await sleep(TTS_FALLBACK_DELAY_MS);
        console.log('[JCTermos] TTS assumido como concluído:', text);
        el.dataset.spoken = 'true';
      } catch (e) {
        console.error('[JCTermos] Erro no TTS:', e);
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
    return true;
  }

  function playTransitionThen(nextStep) {
    if (document.getElementById('termos-transition-overlay')) return;
    console.log('[JCTermos] Iniciando transição de vídeo:', TRANSITION_SRC);
    const overlay = document.createElement('div');
    overlay.id = 'termos-transition-overlay';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: #000; z-index: 999999;
      display: flex; align-items: center; justify-content: center;`;
    const video = document.createElement('video');
    video.src = TRANSITION_SRC;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;
    video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    overlay.appendChild(video);
    document.body.appendChild(overlay);

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      try { video.pause(); } catch {}
      overlay.remove();
      console.log('[JCTermos] Transição concluída, executando próximo passo.');
      if (typeof nextStep === 'function') nextStep();
    };

    video.addEventListener('ended', () => {
      console.log('[JCTermos] Vídeo terminou, limpando e prosseguindo.');
      cleanup();
    }, { once: true });
    video.addEventListener('error', () => {
      console.error('[JCTermos] Erro ao reproduzir vídeo:', TRANSITION_SRC);
      setTimeout(cleanup, 1200);
    }, { once: true });
    setTimeout(() => { if (!done) cleanup(); }, TRANSITION_TIMEOUT_MS);

    Promise.resolve().then(() => video.play?.()).catch(() => {
      console.warn('[JCTermos] Erro ao iniciar vídeo, usando fallback.');
      setTimeout(cleanup, 800);
    });
  }

  function ensureSectionVisible(root, sectionId) {
    if (!root) return;
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'block';
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.zIndex = '2';
    root.style.transition = 'opacity 0.3s ease';
    console.log(`[JCTermos] Visibilidade forçada para ${sectionId}`);
  }

  function armObserver(root) {
    if (window.JCTermos.state.observer) {
      window.JCTermos.state.observer.disconnect();
    }
    const obs = new MutationObserver((mutations) => {
      let needRetype = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'subtree' || m.addedNodes?.length) {
          needRetype = true;
          break;
        }
      }
      if (needRetype && !window.JCTermos.state.typingInProgress && !window.JCTermos.state.initialized) {
        console.log('[JCTermos] Observer detectou mudanças, reiniciando datilografia');
        runTypingSequence(root);
      }
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    window.JCTermos.state.observer = obs;
    console.log('[JCTermos] Observer configurado');
  }

  async function runTypingSequence(root, pg) {
    window.JCTermos.state.typingInProgress = true;
    const elements = Array.from(pg.querySelectorAll('[data-typing="true"]')).sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.left - bRect.left || aRect.top - bRect.top;
    });

    elements.forEach(normalizeParagraph);
    await waitForTypingBridge();

    for (const el of elements) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 20, speak: true });
      }
    }

    window.JCTermos.state.typingInProgress = false;
  }

  const handler = async (evt) => {
    window.JCTermos.state.HANDLER_COUNT++;
    console.log(`[JCTermos] Handler disparado (${window.JCTermos.state.HANDLER_COUNT}x):`, evt?.detail);
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) {
      console.log('[JCTermos] Ignorando, sectionId não é section-termos:', sectionId);
      return;
    }

    if (window.JCTermos.state.ready || (node && node.dataset.termosInitialized)) {
      console.log('[JCTermos] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.log('[JCTermos] Tentando localizar #section-termos...');
      try {
        root = await new Promise((resolve, reject) => {
          const start = Date.now();
          const tick = () => {
            const el = document.querySelector(`#jornada-content-wrapper #${SECTION_ID}`);
            if (el) return resolve(el);
            if (Date.now() - start >= 10000) return reject(new Error('timeout waiting #section-termos'));
            setTimeout(tick, 50);
          };
          tick();
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        console.error('[JCTermos] Section not found:', e);
        return;
      }
    }

    console.log('[JCTermos] Root encontrado:', root);
    root.dataset.termosInitialized = 'true';
    root.classList.add('section-termos');

    ensureSectionVisible(root, SECTION_ID);

    const pg1 = root.querySelector('#termos-pg1');
    const pg2 = root.querySelector('#termos-pg2');
    const nextBtn = root.querySelector('.nextBtn[data-action="termos-next"]');
    const prevBtn = root.querySelector('.prevBtn[data-action="termos-prev"]');
    const avancarBtn = root.querySelector('.avancarBtn[data-action="avancar"]');

    [pg1, pg2].forEach((el, i) => {
      if (el) {
        el.classList.remove('hidden');
        el.style.display = i === 0 ? 'block' : 'none';
        el.style.opacity = i === 0 ? '1' : '0';
        el.style.visibility = i === 0 ? 'visible' : 'hidden';
      }
    });

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0';
        btn.style.cursor = 'default';
      }
    });

    await runTypingSequence(root, pg1);

    nextBtn?.addEventListener('click', async () => {
      if (window.JCTermos.state.currentPage === 1 && pg2) {
        speechSynthesis.cancel();
        pg1.style.display = 'none';
        pg2.style.display = 'block';
        pg2.style.opacity = '1';
        pg2.style.visibility = 'visible';
        window.JCTermos.state.currentPage = 2;
        await runTypingSequence(root, pg2);
      }
    });

    prevBtn?.addEventListener('click', async (e) => {
      if (e.isTrusted) {
        speechSynthesis.cancel();
        console.log('[JCTermos] Redirecionando para site fora da jornada');
        window.location.href = '/';
      }
    });

    avancarBtn?.addEventListener('click', async (e) => {
      if (e.isTrusted) {
        speechSynthesis.cancel();
        console.log('[JCTermos] Avançando para section-senha com transição de vídeo');
        playTransitionThen(() => {
          if (typeof window.JC?.show === 'function') {
            window.JC.show(NEXT_SECTION_ID);
          } else {
            window.location.href = `jornada-conhecimento-com-luz1.html#${NEXT_SECTION_ID}`;
            console.warn('[JCTermos] Fallback navigation to section-senha');
          }
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

    armObserver(root);
    window.JCTermos.state.ready = true;
    console.log('[JCTermos] Seção termos inicializada.');
  };

  // Método para limpar a seção
  window.JCTermos.destroy = () => {
    console.log('[JCTermos] Destruindo seção termos');
    document.removeEventListener('sectionLoaded', handler);
    if (window.JCTermos.state.observer) {
      window.JCTermos.state.observer.disconnect();
    }
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
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  if (!window.JCTermos.state.listenerAdded) {
    console.log('[JCTermos] Registrando listener para sectionLoaded');
    document.addEventListener('sectionLoaded', handler, { once: true });
    window.JCTermos.state.listenerAdded = true;
  }

  const bind = () => {
    console.log('[JCTermos] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 10) => {
      setTimeout(() => {
        const visibleTermos = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visibleTermos && !window.JCTermos.state.ready && !visibleTermos.dataset.termosInitialized) {
          console.log('[JCTermos] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: SECTION_ID, node: visibleTermos } });
        } else if (document.getElementById(SECTION_ID) && !window.JCTermos.state.ready && !document.getElementById(SECTION_ID).dataset.termosInitialized) {
          console.log('[JCTermos] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: SECTION_ID, node: document.getElementById(SECTION_ID) } });
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
