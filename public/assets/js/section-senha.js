(function () {
  'use strict';

  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-guia';
  const VIDEO_SRC = '/assets/video/filme-senha-confirmada.mp4';

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    initialized: false,
    observer: null
  };

  function isVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      el.offsetParent !== null
    );
  }

  const handler = async (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) {
      console.log('[JCSenha] Ignorando, sectionId não é section-senha:', sectionId);
      return;
    }

    if (window.JCSenha.state.ready || node?.dataset.senhaInitialized === 'true') {
      console.log('[JCSenha] Já inicializado, ignorando...');
      return;
    }

    const root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.warn('[JCSenha] Elemento root não encontrado.');
      return;
    }

    root.dataset.senhaInitialized = 'true';
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'block';
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.zIndex = '2';

    console.log('[JCSenha] Seção senha inicializada.');
    window.JCSenha.state.ready = true;
    window.JCSenha.state.initialized = true;
  };

  function tryInitialize(attempt = 1, maxAttempts = 10) {
    setTimeout(() => {
      const el = document.getElementById(SECTION_ID);
      if (isVisible(el) && !window.JCSenha.state.ready && !el.dataset.senhaInitialized) {
        console.log('[JCSenha] Seção visível detectada, disparando handler');
        handler({ detail: { sectionId: SECTION_ID, node: el } });
      } else if (attempt < maxAttempts) {
        console.warn(`[JCSenha] Nenhuma seção visível ou já inicializada (tentativa ${attempt}/${maxAttempts})`);
        tryInitialize(attempt + 1, maxAttempts);
      } else {
        console.error(`[JCSenha] Falha ao inicializar após ${maxAttempts} tentativas`);
      }
    }, 100);
  }

  function bind() {
    console.log('[JCSenha] Executando bind');

    document.removeEventListener('section:shown', handler);
    document.addEventListener('section:shown', handler, { passive: true, once: true });

    if (!window.JCSenha.state.ready && !document.getElementById(SECTION_ID)?.dataset.senhaInitialized) {
      tryInitialize();
    } else {
      console.log('[JCSenha] Já inicializado ou seção não presente, pulando tryInitialize');
    }
  }

  if (document.readyState === 'loading') {
    console.log('[JCSenha] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCSenha] DOM já carregado, chamando bind');
    bind();
  }
})();
