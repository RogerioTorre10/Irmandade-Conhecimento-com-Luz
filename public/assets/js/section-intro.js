(function () {
  'use strict';

  const MOD = 'section-intro.js';
  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos';
  const TRANSITION_SRC = '/assets/img/filme-pergaminho-ao-vento-mobile.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

  // Evitar múltiplas inicializações
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
        console.log('[JCIntro] TTS concluído (fallback):', text);
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

  async function waitForVideoEnd(videoElementId = 'videoTransicao') {
    const video = document.getElementById(videoElementId);
    if (!video) {
      console.log('[JCIntro] Vídeo de transição não encontrado, usando timeout padrão');
      return sleep(TRANSITION_TIMEOUT_MS);
    }

    return new Promise((resolve) => {
      video.addEventListener('ended', () => {
        console.log('[JCIntro] Vídeo terminou');
        resolve();
      }, { once: true });
      setTimeout(resolve, TRANSITION_TIMEOUT_MS);
    });
  }

  // ---------- TRANSIÇÃO DE VÍDEO ----------
  function playTransitionVideo(src, nextSectionId) {
    console.log('[JCIntro] Iniciando transição de vídeo:', src);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, nextSectionId);
    } else {
      console.warn('[JCIntro] window.playTransitionVideo não encontrado, usando fallback');
      setTimeout(() => {
        console.log('[JCIntro] Fallback: navegando para:', nextSectionId);
        if (typeof window.JC?.show === 'function') {
          window.JC.show(nextSectionId);
        } else {
          console.warn('[JCIntro] Fallback navigation to:', nextSectionId);
          window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
        }
      }, 2000);
    }
  }

  // ---------- BLINDAGEM VISUAL ----------
  function ensureSectionVisible(root) {
    if (!root) return;
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'block';
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.zIndex = '2';
    root.style.transition = 'opacity 0.3s ease';
    console.log('[JCIntro] Blindagem aplicada: seção visível');
  }

  // ---------- ELEMENTOS ----------
  function pickElements(root) {
    return {
      texts: root.querySelectorAll('.parchment-text-rough.lumen-typing'),
      btnAvancar: root.querySelector('#btn-avancar')
    };
  }

  // ---------- DATILOGRAFIA ----------
  async function runTypingSequence(root) {
    const { texts, btnAvancar } = pickElements(root);
    window.JCIntro.state.typingInProgress = true;

    const seq = Array.from(texts).sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.top - bRect.top || aRect.left - bRect.left;
    });

    btnAvancar?.setAttribute('disabled', 'true');
    btnAvancar && (btnAvancar.style.opacity = '0');
    btnAvancar && (btnAvancar.style.cursor = 'default');

    seq.forEach(normalizeParagraph);
    await waitForTypingBridge();

    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 20, speak: true });
      }
    }

    if (btnAvancar) {
      btnAvancar.removeAttribute('disabled');
      btnAvancar.style.opacity = '1';
      btnAvancar.style.cursor = 'pointer';
    }

    window.JCIntro.state.typingInProgress = false;
    window.JCIntro.state.initialized = true;
  }

  // ---------- OBSERVER (BLINDAGEM) ----------
  function armObserver(root) {
    if (window.JCIntro.state.observer) {
      window.JCIntro.state.observer.disconnect();
    }
    const obs = new MutationObserver((mutations) => {
      let needRetype = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.addedNodes?.length) {
          needRetype = true;
          break;
        }
      }
      if (needRetype && !window.JCIntro.state.typingInProgress && !window.JCIntro.state.initialized) {
        console.log('[JCIntro] Mudança detectada, reiniciando datilografia');
        runTypingSequence(root);
      }
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    window.JCIntro.state.observer = obs;
    console.log('[JCIntro] Observer de blindagem ativado');
  }

  // ---------- HANDLER PRINCIPAL ----------
  const handler = async (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;

    if (window.JCIntro.state.ready || (node && node.dataset.introInitialized)) {
      console.log('[JCIntro] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.warn('[JCIntro] #section-intro não encontrado, tentando fallback...');
      try {
        root = await new Promise((resolve, reject) => {
          const start = Date.now();
          const tick = () => {
            const el = document.querySelector(`#jornada-content-wrapper #${SECTION_ID}`);
            if (el) return resolve(el);
            if (Date.now() - start >= 10000) return reject();
            setTimeout(tick, 50);
          };
          tick();
        });
      } catch {
        console.error('[JCIntro] Falha crítica: seção não carregada');
        window.toast?.('Erro ao carregar introdução.', 'error');
        return;
      }
    }

    root.dataset.introInitialized = 'true';
    ensureSectionVisible(root);

    const { btnAvancar } = pickElements(root);

    btnAvancar?.addEventListener('click', () => {
      if (btnAvancar.disabled) return;
      console.log('[JCIntro] Botão "Iniciar" clicado');
      speechSynthesis.cancel();
      playTransitionVideo(TRANSITION_SRC, NEXT_SECTION_ID);
    });

    armObserver(root);
    runTypingSequence(root);

    window.JCIntro.state.ready = true;
    console.log('[JCIntro] Introdução inicializada com sucesso!');
  };

  // ---------- LIMPEZA ----------
  window.JCIntro.destroy = () => {
    console.log('[JCIntro] Destruindo seção intro');
    document.removeEventListener('sectionLoaded', handler);
    if (window.JCIntro.state.observer) window.JCIntro.state.observer.disconnect();
    const root = document.getElementById(SECTION_ID);
    if (root) {
      root.dataset.introInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCIntro.state = { ready: false, listenerAdded: false, typingInProgress: false, observer: null, initialized: false };
    if (typeof window.EffectCoordinator?.stopAll === 'function') window.EffectCoordinator.stopAll();
  };

  // ---------- REGISTRO ----------
  if (!window.JCIntro.state.listenerAdded) {
    console.log('[JCIntro] Registrando listener para section:shown'); // Corrigido para section:shown
    document.addEventListener('section:shown', handler, { once: true });
    window.JCIntro.state.listenerAdded = true;
  }

  // Inicialização manual com fallback
  const bind = () => {
    console.log('[JCIntro] Executando bind');
    document.removeEventListener('section:shown', handler);
    document.addEventListener('section:shown', handler, { passive: true, once: true });

    const tryInit = (attempt = 1, max = 10) => {
      setTimeout(() => {
        const visible = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visible && !visible.dataset.introInitialized) {
          handler({ detail: { sectionId: SECTION_ID, node: visible } });
        } else if (document.getElementById(SECTION_ID) && !document.getElementById(SECTION_ID).dataset.introInitialized) {
          handler({ detail: { sectionId: SECTION_ID, node: document.getElementById(SECTION_ID) } });
        } else if (attempt < max) {
          tryInit(attempt + 1, max);
        }
      }, 100); // Delay fixo de 100ms
    };
    tryInit();
  };

  if (document.readyState === 'loading') {
    console.log('[JCIntro] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCIntro] DOM já carregado, chamando bind');
    bind();
  }
})();
