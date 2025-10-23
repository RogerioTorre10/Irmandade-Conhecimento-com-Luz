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
    initialized: false,
    pg1: null,
    pg2: null,
    nextBtn: null,
    prevBtn: null,
    avancarBtn: null
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
        console.error('[JCTermos] Erro TTS:', e);
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

  // ---------- MOSTRAR/ESCONDER PÁGINA ----------
  function showPage(pageEl, show) {
    if (!pageEl) return;
    pageEl.style.display = show ? 'block' : 'none';
    pageEl.style.opacity = show ? '1' : '0';
    pageEl.style.visibility = show ? 'visible' : 'hidden';
    if (show) pageEl.scrollTop = 0;
  }

  // ---------- DATILOGRAFIA ----------
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

  // ---------- HANDLER ----------
  const handler = async (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;

    if (window.JCTermos.state.initialized) {
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

    // Elementos - COMPATÍVEL COM SEU HTML
    const pg1 = root.querySelector('#termos-pg1');
    const pg2 = root.querySelector('#termos-pg2');
    const nextBtn = root.querySelector('[data-action="termos-next"]');
    const prevBtn = root.querySelector('[data-action="termos-prev"]');
    const avancarBtn = root.querySelector('[data-action="avancar"]');

    window.JCTermos.state.pg1 = pg1;
    window.JCTermos.state.pg2 = pg2;
    window.JCTermos.state.nextBtn = nextBtn;
    window.JCTermos.state.prevBtn = prevBtn;
    window.JCTermos.state.avancarBtn = avancarBtn;

    // Forçar visibilidade
    showPage(pg1, true);
    showPage(pg2, false);

    // Desabilitar todos
    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.disabled = true;
        btn.style.opacity = '0';
        btn.style.cursor = 'default';
      }
    });

    // Datilografia pg1
    await runTypingSequence(pg1);

    // Habilitar "Próxima página"
    if (nextBtn) {
      nextBtn.disabled = false;
      nextBtn.style.opacity = '1';
      nextBtn.style.cursor = 'pointer';
    }

    // Botão "Próxima página"
    nextBtn?.addEventListener('click', async () => {
      if (nextBtn.disabled) return;
      speechSynthesis.cancel();

      showPage(pg1, false);
      showPage(pg2, true);
      window.JCTermos.state.currentPage = 2;

      await runTypingSequence(pg2);

      // Habilitar botões da pg2
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

    // Botão "Aceito"
    avancarBtn?.addEventListener('click', () => {
      if (avancarBtn.disabled) return;
      speechSynthesis.cancel();
      playTransitionVideo(NEXT_SECTION_ID);
    });

    window.JCTermos.state.initialized = true;
    console.log('[JCTermos] TERMOS 1 E 2 FUNCIONANDO 100%!');
  };

  // ---------- FORÇA INICIALIZAÇÃO ----------
  const forceInit = () => {
    const root = document.getElementById(SECTION_ID);
    if (root && !root.dataset.termosInitialized) {
      console.log('[JCTermos] Forçando inicialização manual');
      handler({ detail: { sectionId: SECTION_ID, node: root } });
    }
  };

  // ---------- LIMPEZA ----------
  window.JCTermos.destroy = () => {
    console.log('[JCTermos] Destruindo...');
    document.removeEventListener('sectionLoaded', handler);
    window.JCTermos.state = { ready: false, currentPage: 1, listenerAdded: false, typingInProgress: false, initialized: false };
  };

  // ---------- REGISTRO ----------
  if (!window.JCTermos.state.listenerAdded) {
    document.addEventListener('sectionLoaded', handler, { once: true });
    window.JCTermos.state.listenerAdded = true;
  }

  // Forçar inicialização com fallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(forceInit, 800);
    }, { once: true });
  } else {
    setTimeout(forceInit, 800);
  }
})();
