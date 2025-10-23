(function () {
  'use strict';

  const MOD = 'section-intro.js';
  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos';
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

  if (window.JCIntro?.__bound) {
    console.log('[JCIntro] Já inicializado, ignorando...');
    return;
  }

  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = {
    ready: false,
    listenerAdded: false,
    typingInProgress: false,
    observer: null,
    initialized: false
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
          console.warn('[JCIntro] runTyping falhou, usando fallback local', e);
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
        console.log('[JCIntro] Iniciando TTS para:', text);
        await sleep(TTS_FALLBACK_DELAY_MS);
        console.log('[JCIntro] TTS assumido como concluído:', text);
        el.dataset.spoken = 'true';
      } catch (e) {
        console.error('[JCIntro] Erro no TTS:', e);
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

  function playTransitionVideo(nextSectionId) {
    if (document.getElementById('intro-transition-overlay')) return;
    console.log('[JCIntro] Iniciando transição de vídeo:', TRANSITION_SRC);
    const overlay = document.createElement('div');
    overlay.id = 'intro-transition-overlay';
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
      console.log('[JCIntro] Transição concluída, navegando para:', nextSectionId);
      if (typeof window.JC?.show === 'function') {
        window.JC.show(nextSectionId);
      } else {
        window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
        console.warn('[JCIntro] Fallback navigation to:', nextSectionId);
      }
    };

    video.addEventListener('ended', () => {
      console.log('[JCIntro] Vídeo terminou, limpando e prosseguindo.');
      cleanup();
    }, { once: true });
    video.addEventListener('error', () => {
      console.error('[JCIntro] Erro ao reproduzir vídeo:', TRANSITION_SRC);
      setTimeout(cleanup, 1200);
    }, { once: true });
    setTimeout(() => { if (!done) cleanup(); }, TRANSITION_TIMEOUT_MS);

    Promise.resolve().then(() => video.play?.()).catch(() => {
      console.warn('[JCIntro] Erro ao iniciar vídeo, usando fallback.');
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
    console.log(`[JCIntro] Visibilidade forçada para ${sectionId}`);
  }

  function pickElements(root) {
    return {
      title: root.querySelector('.intro-title'),
      texts: root.querySelectorAll('.parchment-text-rough.lumen-typing'),
      btnAvancar: root.querySelector('#btn-avancar')
    };
  }

  async function runTypingSequence(root) {
    const { title, texts, btnAvancar } = pickElements(root);
    window.JCIntro.state.typingInProgress = true;

    const seq = [...texts].filter(Boolean).sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.left - bRect.left || aRect.top - bRect.top;
    });

    btnAvancar?.disabled = true;
    btnAvancar?.style.opacity = '0';
    btnAvancar?.style.cursor = 'default';

    seq.forEach(normalizeParagraph);
    await waitForTypingBridge();

    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 20, speak: true });
      }
    }

    if (btnAvancar) {
      btnAvancar.disabled = false;
      btnAvancar.style.opacity = '1';
      btnAvancar.style.cursor = 'pointer';
    }

    window.JCIntro.state.typingInProgress = false;
    window.JCIntro.state.initialized = true;
  }

  function armObserver(root) {
    if (window.JCIntro.state.observer) {
      window.JCIntro.state.observer.disconnect();
    }
    const obs = new MutationObserver((mutations) => {
      let needRetype = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'subtree' || m.addedNodes?.length) {
          needRetype = true;
          break;
        }
      }
      if (needRetype && !window.JCIntro.state.typingInProgress && !window.JCIntro.state.initialized) {
        console.log('[JCIntro] Observer detectou mudanças, reiniciando datilografia');
        runTypingSequence(root);
      }
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    window.JCIntro.state.observer = obs;
    console.log('[JCIntro] Observer configurado');
  }

  const handler = async (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) {
      console.log('[JCIntro] Ignorando, sectionId não é section-intro:', sectionId);
      return;
    }

    if (window.JCIntro.state.ready || (node && node.dataset.introInitialized)) {
      console.log('[JCIntro] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.log('[JCIntro] Tentando localizar #section-intro...');
      try {
        root = await new Promise((resolve, reject) => {
          const start = Date.now();
          const tick = () => {
            const el = document.querySelector(`#jornada-content-wrapper #${SECTION_ID}`);
            if (el) return resolve(el);
            if (Date.now() - start >= 10000) return reject(new Error('timeout waiting #section-intro'));
            setTimeout(tick, 50);
          };
          tick();
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        console.error('[JCIntro] Section not found:', e);
        return;
      }
    }

    console.log('[JCIntro] Root encontrado:', root);
    root.dataset.introInitialized = 'true';
    root.classList.add('section-intro');

    ensureSectionVisible(root, SECTION_ID);

    const { title, texts, btnAvancar } = pickElements(root);

    [title, ...texts].forEach(el => {
      if (el) {
        el.classList.remove('hidden');
        el.style.display = 'block';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    });

    btnAvancar?.addEventListener('click', () => {
      if (!btnAvancar.disabled) {
        speechSynthesis.cancel();
        console.log('[JCIntro] Botão Avançar clicado');
        playTransitionVideo(NEXT_SECTION_ID);
      }
    });

    armObserver(root);
    runTypingSequence(root);

    window.JCIntro.state.ready = true;
    console.log('[JCIntro] Seção intro inicializada.');
  };

  // Método para limpar a seção
  window.JCIntro.destroy = () => {
    console.log('[JCIntro] Destruindo seção intro');
    document.removeEventListener('sectionLoaded', handler);
    if (window.JCIntro.state.observer) {
      window.JCIntro.state.observer.disconnect();
    }
    const root = document.getElementById(SECTION_ID);
    if (root) {
      root.dataset.introInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCIntro.state.ready = false;
    window.JCIntro.state.listenerAdded = false;
    window.JCIntro.state.typingInProgress = false;
    window.JCIntro.state.initialized = false;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  if (!window.JCIntro.state.listenerAdded) {
    console.log('[JCIntro] Registrando listener para sectionLoaded');
    document.addEventListener('sectionLoaded', handler, { once: true });
    window.JCIntro.state.listenerAdded = true;
  }

  const bind = () => {
    console.log('[JCIntro] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 10) => {
      setTimeout(() => {
        const visibleIntro = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visibleIntro && !window.JCIntro.state.ready && !visibleIntro.dataset.introInitialized) {
          console.log('[JCIntro] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: SECTION_ID, node: visibleIntro } });
        } else if (document.getElementById(SECTION_ID) && !window.JCIntro.state.ready && !document.getElementById(SECTION_ID).dataset.introInitialized) {
          console.log('[JCIntro] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: SECTION_ID, node: document.getElementById(SECTION_ID) } });
        } else if (attempt < maxAttempts) {
          console.log('[JCIntro] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCIntro] Falha ao inicializar após ' + maxAttempts + ' tentativas');
        }
      }, 1000 * attempt);
    };

    tryInitialize();
  };

  if (document.readyState === 'loading') {
    console.log('[JCIntro] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCIntro] DOM já carregado, chamando bind');
    bind();
  }
})();
