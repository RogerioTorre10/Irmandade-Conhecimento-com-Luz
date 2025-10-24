(function () {
  'use strict';

  const MOD = 'section-guia.js';
  const SECTION_ID = 'section-guia';
  const PREV_SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-selfie';
  const TRANSITION_SRC = '/assets/img/filme-senha-confirmada.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

  if (window.JCGuia?.__bound) {
    console.log('[JCGuia] Já inicializado, ignorando...');
    return;
  }

  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;
  window.JCGuia.state = {
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

  async function localType(el, text, speed = 50) {
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

  async function typeOnce(el, { speed = 50, speak = true } = {}) {
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
          console.warn('[JCGuia] runTyping falhou, usando fallback local', e);
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
        console.log('[JCGuia] Iniciando TTS para:', text);
        await sleep(TTS_FALLBACK_DELAY_MS);
        console.log('[JCGuia] TTS assumido como concluído:', text);
        el.dataset.spoken = 'true';
      } catch (e) {
        console.error('[JCGuia] Erro no TTS:', e);
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
  if (document.getElementById('guia-transition-overlay')) {
    console.log('[JCGuia] Overlay de transição já presente, ignorando');
    return;
  }
  console.log('[JCGuia] Iniciando transição de vídeo:', TRANSITION_SRC);
  const overlay = document.createElement('div');
  overlay.id = 'guia-transition-overlay';
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
    console.log('[JCGuia] Transição concluída, navegando para:', nextSectionId);
    if (typeof window.JC?.show === 'function') {
      window.JC.show(nextSectionId);
    } else {
      console.warn('[JCGuia] Fallback navigation to:', nextSectionId);
      window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
    }
  };

  video.addEventListener('loadeddata', () => {
    console.log('[JCGuia] Vídeo carregado, iniciando reprodução');
    video.play().catch(e => {
      console.warn('[JCGuia] Erro ao iniciar vídeo:', e);
      cleanup();
    });
  }, { once: true });
  video.addEventListener('ended', () => {
    console.log('[JCGuia] Vídeo terminou, limpando e prosseguindo.');
    cleanup();
  }, { once: true });
  video.addEventListener('error', (e) => {
    console.error('[JCGuia] Erro ao carregar vídeo:', TRANSITION_SRC, e);
    cleanup();
  }, { once: true });
  setTimeout(() => { if (!done) cleanup(); }, TRANSITION_TIMEOUT_MS);
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
    console.log(`[JCGuia] Visibilidade forçada para ${sectionId}`);
  }

  function pickElements(root) {
    return {
      title: root.querySelector('.titulo-pergaminho'),
      nameInput: root.querySelector('#guiaNameInput'),
      confirmBtn: root.querySelector('#btn-confirmar-nome'),
      guiaTexto: root.querySelector('#guiaTexto'),
      guiaOptions: root.querySelectorAll('.guia-options .btn-stone-espinhos'),
      errorMsg: root.querySelector('#guia-error')
    };
  }
  async function startTypingSequence() {
  const elements = {
    instr1: document.querySelector('#senha-instr1'),
    instr2: document.querySelector('#senha-instr2'),
    instr3: document.querySelector('#senha-instr3'),
    instr4: document.querySelector('#senha-instr4'),
    input: document.querySelector('#senha-input')
  };
  const verified = {};
  for (const [key, el] of Object.entries(elements)) {
    verified[key] = !!el && !el.classList.contains('typing-done') && !el.dataset.spoken;
  }
  console.log('[JCSenha] Elementos verificados:', verified);
  if (!Object.values(verified).some(v => v)) {
    console.log('[JCSenha] Todos os elementos já processados, ignorando sequência');
    return;
  }
  for (const [key, el] of Object.entries(elements)) {
    if (verified[key]) {
      await window.runTyping?.(el, el.dataset.text, () => {}, { speed: 50, cursor: true });
      if (window.EffectCoordinator?.speak && !el.dataset.spoken) {
        window.EffectCoordinator.speak(el.dataset.text, { lang: 'pt-BR', rate: 1.1 });
        el.dataset.spoken = 'true';
      }
    }
  }
  if (elements.input) {
    elements.input.focus();
    console.log('[JCSenha] Foco aplicado ao input');
  }
}

  async function runTypingSequence(root) {
    const { title, nameInput, confirmBtn, guiaTexto, guiaOptions, errorMsg } = pickElements(root);
    window.JCGuia.state.typingInProgress = true;

    [title].filter(Boolean).forEach(normalizeParagraph);
    await waitForTypingBridge();

    if (title && !title.classList.contains('typing-done')) {
      await typeOnce(title, { speed: 50, speak: true });
    }

    [nameInput, confirmBtn].forEach(el => {
      if (el) {
        el.disabled = false;
        el.style.opacity = '1';
        el.style.cursor = el.tagName === 'INPUT' ? 'text' : 'pointer';
      }
    });

    guiaOptions.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0';
      btn.style.cursor = 'default';
    });

    window.JCGuia.state.typingInProgress = false;
    window.JCGuia.state.initialized = true;
  }

  function armObserver(root) {
    if (window.JCGuia.state.observer) {
      window.JCGuia.state.observer.disconnect();
    }
    const obs = new MutationObserver((mutations) => {
      let needRetype = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'subtree' || m.addedNodes?.length) {
          needRetype = true;
          break;
        }
      }
      if (needRetype && !window.JCGuia.state.typingInProgress && !window.JCGuia.state.initialized) {
        console.log('[JCGuia] Observer detectou mudanças, reiniciando datilografia');
        runTypingSequence(root);
      }
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    window.JCGuia.state.observer = obs;
    console.log('[JCGuia] Observer configurado');
  }

const handler = async (evt) => {
  const { sectionId, node } = evt?.detail || {};
  if (sectionId !== 'section-senha') {
    console.log('[JCSenha] Ignorando, sectionId não é section-senha:', sectionId);
    return;
  }
  if (window.JCSenha?.state?.ready || node?.dataset.senhaInitialized) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }
  let root = node || document.getElementById('section-senha');
  if (!root) {
    console.error('[JCSenha] Seção section-senha não encontrada');
    return;
  }
  console.log('[JCSenha] Root encontrado:', root);
  root.dataset.senhaInitialized = 'true';
  window.JCSenha.state.ready = true;

  // Lógica de inicialização do wrapper
  const wrapper = document.getElementById('jornada-content-wrapper');
  if (wrapper) {
    wrapper.querySelectorAll('[data-typing="true"]').forEach(el => {
      el.textContent = textOf(el);
      el.classList.add('typing-done');
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.display = 'block';
    });
    wrapper.querySelectorAll('.btn').forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
    });
  }

  // Resto da lógica de inicialização (ex.: configurar typing, TTS, etc.)
  // ...
};

    guiaOptions.forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          const guia = btn.dataset.guia;
          console.log('[JCGuia] Guia selecionado:', guia);
          playTransitionVideo(NEXT_SECTION_ID);
        }
      });
    });

    nameInput?.addEventListener('input', () => {
      console.log('[JCGuia] Nome alterado:', nameInput.value);
    });

    errorMsg?.classList.add('hidden');
    errorMsg?.setAttribute('aria-hidden', 'true');

    armObserver(root);
    runTypingSequence(root);

    window.JCGuia.state.ready = true;
    console.log('[JCGuia] Seção guia inicializada.');
  };

  // Método para limpar a seção
  window.JCGuia.destroy = () => {
    console.log('[JCGuia] Destruindo seção guia');
    document.removeEventListener('sectionLoaded', handler);
    if (window.JCGuia.state.observer) {
      window.JCGuia.state.observer.disconnect();
    }
    const root = document.getElementById(SECTION_ID);
    if (root) {
      root.dataset.guiaInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCGuia.state.ready = false;
    window.JCGuia.state.listenerAdded = false;
    window.JCGuia.state.typingInProgress = false;
    window.JCGuia.state.initialized = false;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  if (!window.JCGuia.state.listenerAdded) {
    console.log('[JCGuia] Registrando listener para sectionLoaded');
    document.addEventListener('sectionLoaded', handler, { once: true });
    window.JCGuia.state.listenerAdded = true;
  }

const bind = () => {
  console.log('[JCSenha] Executando bind');
  // Evitar múltiplos listeners
  if (window.JCSenha?.state?.listenerAdded) {
    document.removeEventListener('section:shown', handler); // Usar handler em vez de onShown
  }
  document.addEventListener('section:shown', handler, { passive: true, once: true });
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.state = window.JCSenha.state || {};
  window.JCSenha.state.listenerAdded = true;

  const tryInitialize = (attempt = 1, maxAttempts = 10, options = {}) => {
    // Evitar reinicialização se já concluído
    if (window.JCSenha?.state?.ready || document.getElementById('section-senha')?.dataset.senhaInitialized === 'true') {
      console.log('[JCSenha] Seção já inicializada, ignorando tentativa', attempt);
      return;
    }
    const visibleSenha = document.querySelector('#section-senha:not(.hidden)');
    const section = document.getElementById('section-senha');
    if (visibleSenha && !visibleSenha.dataset.senhaInitialized) {
      console.log('[JCSenha] Seção visível encontrada, disparando handler');
      handler({ detail: { sectionId: 'section-senha', node: visibleSenha } });
    } else if (section && !section.dataset.senhaInitialized) {
      console.log('[JCSenha] Forçando inicialização manual (tentativa ' + attempt + ')');
      handler({ detail: { sectionId: 'section-senha', node: section } });
    } else if (attempt < maxAttempts) {
      console.log('[JCSenha] Nenhuma seção visível ou já inicializada, tentando novamente...');
      setTimeout(() => tryInitialize(attempt + 1, maxAttempts, options), 100); // Delay fixo de 100ms
    } else {
      console.error('[JCSenha] Falha ao inicializar após', maxAttempts, 'tentativas');
    }
  };

  // Iniciar tentativa de inicialização apenas se não inicializado
  if (!window.JCSenha?.state?.ready && !document.getElementById('section-senha')?.dataset.senhaInitialized) {
    tryInitialize();
  } else {
    console.log('[JCSenha] Já inicializado ou seção não presente, pulando tryInitialize');
  }
};

// Garantir que o bind só seja chamado uma vez
if (document.readyState === 'loading') {
  console.log('[JCSenha] Aguardando DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', bind, { once: true });
} else {
  console.log('[JCSenha] DOM já carregado, chamando bind');
  bind();
}
