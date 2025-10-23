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
    typingInProgress: false,
    observer: null,
    initialized: false
  };

  // ---------- UTILIDADES ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  
  const textOf = (el) => {
    if (!el) return '';
    const ds = el.dataset?.text?.trim();
    const tc = el.textContent?.trim() || '';
    return ds || tc;
  };

  function normalizeParagraph(el) {
    if (!el) return false;
    const source = textOf(el);
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
    const text = textOf(el);
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
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
        } catch (e) {
          console.warn('[JCTermos] runTyping falhou, usando fallback', e);
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
        console.log('[JCTermos] TTS iniciado:', text);
        await sleep(TTS_FALLBACK_DELAY_MS);
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

  // ---------- TRANSIÇÃO ----------
  function playTransitionVideo(nextSectionId) {
    if (document.getElementById('termos-transition-overlay')) return;

    console.log('[JCTermos] Iniciando transição para:', nextSectionId);
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
      console.log('[JCTermos] Transição concluída');
      if (typeof window.JC?.show === 'function') {
        window.JC.show(nextSectionId);
      } else {
        window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
      }
    };

    video.addEventListener('ended', cleanup, { once: true });
    video.addEventListener('error', () => {
      console.error('[JCTermos] Erro no vídeo:', TRANSITION_SRC);
      setTimeout(cleanup, 1200);
    }, { once: true });
    setTimeout(() => { if (!done) cleanup(); }, TRANSITION_TIMEOUT_MS);

    Promise.resolve().then(() => video.play?.()).catch(() => {
      console.warn('[JCTermos] Falha ao iniciar vídeo, usando fallback.');
      setTimeout(cleanup, 800);
    });
  }

  // ---------- BLINDAGEM ----------
  function ensureSectionVisible(root) {
    if (!root) return;
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'block';
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.zIndex = '2';
    root.style.transition = 'opacity 0.3s ease';
    console.log('[JCTermos] Blindagem aplicada');
  }

  // ---------- DATILOGRAFIA POR PÁGINA ----------
  async function runTypingSequence(pageEl) {
    if (!pageEl) return;
    window.JCTermos.state.typingInProgress = true;

    const elements = Array.from(pageEl.querySelectorAll('[data-typing="true"]')).sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.top - bRect.top || aRect.left - bRect.left;
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

  // ---------- OBSERVER ----------
  function armObserver(root) {
    if (window.JCTermos.state.observer) {
      window.JCTermos.state.observer.disconnect();
    }
    const obs = new MutationObserver(() => {
      if (!window.JCTermos.state.typingInProgress && !window.JCTermos.state.initialized) {
        const pg = window.JCTermos.state.currentPage === 1 
          ? root.querySelector('#termos-pg1')
          : root.querySelector('#termos-pg2');
        if (pg) runTypingSequence(pg);
      }
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    window.JCTermos.state.observer = obs;
  }

  // ---------- HANDLER ----------
  const handler = async (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;

    if (window.JCTermos.state.ready || (node && node.dataset.termosInitialized)) {
      console.log('[JCTermos] Já inicializado');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.error('[JCTermos] #section-termos não encontrado');
      return;
    }

    root.dataset.termosInitialized = 'true';
    ensureSectionVisible(root);

    const pg1 = root.querySelector('#termos-pg1');
    const pg2 = root.querySelector('#termos-pg2');
    const nextBtn = root.querySelector('.nextBtn');
    const prevBtn = root.querySelector('.prevBtn');
    const avancarBtn = root.querySelector('.avancarBtn');

    // Mostrar pg1, esconder pg2
    pg1.style.display = 'block';
    pg1.style.opacity = '1';
    pg1.style.visibility = 'visible';
    pg2.style.display = 'none';
    pg2.style.opacity = '0';
    pg2.style.visibility = 'hidden';

    // Desabilitar botões
    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0';
        btn.style.cursor = 'default';
      }
    });

    // Datilografia pg1
    await runTypingSequence(pg1);

    // Habilitar botão "Próxima página"
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      nextBtn.style.cursor = 'pointer';
    }

    // Botão "Próxima página"
    nextBtn?.addEventListener('click', async () => {
      if (nextBtn.disabled) return;
      speechSynthesis.cancel();

      pg1.style.display = 'none';
      pg2.style.display = 'block';
      pg2.style.opacity = '1';
      pg2.style.visibility = 'visible';
      window.JCTermos.state.currentPage = 2;

      await runTypingSequence(pg2);

      // Habilitar "Voltar" e "Aceito"
      [prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        }
      });
    });

    // Botão "Voltar"
    prevBtn?.addEventListener('click', () => {
      if (prevBtn.disabled) return;
      speechSynthesis.cancel();
      window.location.href = '/';
    });

    // Botão "Aceito e quero continuar"
    avancarBtn?.addEventListener('click', () => {
      if (avancarBtn.disabled) return;
      speechSynthesis.cancel();
      playTransitionVideo(NEXT_SECTION_ID);
    });

    armObserver(root);
    window.JCTermos.state.ready = true;
    window.JCTermos.state.initialized = true;
    console.log('[JCTermos] Termos inicializados com sucesso!');
  };

  // ---------- LIMPEZA ----------
  window.JCTermos.destroy = () => {
    console.log('[JCTermos] Destruindo...');
    document.removeEventListener('sectionLoaded', handler);
    if (window.JCTermos.state.observer) window.JCTermos.state.observer.disconnect();
    const root = document.getElementById(SECTION_ID);
    if (root) {
      root.dataset.termosInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCTermos.state = { ready: false, currentPage: 1, listenerAdded: false, typingInProgress: false, observer: null, initialized: false };
  };

  // ---------- REGISTRO ----------
  if (!window.JCTermos.state.listenerAdded) {
    document.addEventListener('sectionLoaded', handler, { once: true });
    window.JCTermos.state.listenerAdded = true;
  }

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });
    const tryInit = (attempt = 1, max = 10) => {
      setTimeout(() => {
        const visible = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visible && !visible.dataset.termosInitialized) {
          handler({ detail: { sectionId: SECTION_ID, node: visible } });
        } else if (attempt < max) {
          tryInit(attempt + 1, max);
        }
      }, 1000 * attempt);
    };
    tryInit();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
