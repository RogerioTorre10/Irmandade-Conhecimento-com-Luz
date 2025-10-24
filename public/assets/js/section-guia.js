(function () {
  'use strict';

  const MOD = 'section-guia.js';
  const SECTION_ID = 'section-guia';
  const PREV_SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-selfie';
  const TRANSITION_SRC = '/assets/img/filme-senha-confirmada.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

  // Evitar múltiplas inicializações
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
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
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
        speechSynthesis.cancel();
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
    console.warn('[JCGuia] window.runTyping não encontrado após', maxMs, 'ms');
    return true;
  }

  async function waitForVideoEnd(videoElementId = 'videoTransicao') {
    const video = document.getElementById(videoElementId);
    if (!video) {
      console.log('[JCGuia] Vídeo de transição não encontrado, usando timeout padrão');
      return sleep(TRANSITION_TIMEOUT_MS);
    }

    return new Promise((resolve) => {
      video.addEventListener('ended', () => {
        console.log('[JCGuia] Vídeo terminou');
        resolve();
      }, { once: true });
      setTimeout(resolve, TRANSITION_TIMEOUT_MS);
    });
  }

  function playTransitionVideo(nextSectionId) {
    console.log('[JCGuia] Iniciando transição de vídeo:', TRANSITION_SRC);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(TRANSITION_SRC, nextSectionId);
    } else {
      console.warn('[JCGuia] window.playTransitionVideo não encontrado, usando fallback');
      setTimeout(() => {
        console.log('[JCGuia] Fallback: navegando para:', nextSectionId);
        if (typeof window.JC?.show === 'function') {
          window.JC.show(nextSectionId);
        } else {
          console.warn('[JCGuia] Fallback navigation to:', nextSectionId);
          window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
        }
      }, 2000);
    }
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

  async function runTypingSequence(root) {
    const { title, nameInput, confirmBtn, guiaTexto, guiaOptions, errorMsg } = pickElements(root);
    window.JCGuia.state.typingInProgress = true;

    await waitForVideoEnd(); // Aguardar vídeo de transição
    await sleep(1000); // Delay adicional para visibilidade

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
    if (sectionId !== SECTION_ID) {
      console.log('[JCGuia] Ignorando, sectionId não é section-guia:', sectionId);
      return;
    }

    if (window.JCGuia.state.ready || node?.dataset.guiaInitialized === 'true') {
      console.log('[JCGuia] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.log('[JCGuia] Tentando localizar #section-guia...');
      try {
        root = await new Promise((resolve, reject) => {
          const start = Date.now();
          const tick = () => {
            const el = document.querySelector(`#jornada-content-wrapper #${SECTION_ID}`);
            if (el) return resolve(el);
            if (Date.now() - start >= 10000) return reject(new Error('timeout waiting #section-guia'));
            setTimeout(tick, 50);
          };
          tick();
        });
      } catch (e) {
        console.error('[JCGuia] Section not found:', e);
        window.toast?.('Erro: Seção section-guia não carregada.', 'error');
        return;
      }
    }

    console.log('[JCGuia] Root encontrado:', root);
    root.dataset.guiaInitialized = 'true';
    root.classList.add('section-guia');
    ensureSectionVisible(root, SECTION_ID);

    const { title, nameInput, confirmBtn, guiaTexto, guiaOptions, errorMsg } = pickElements(root);

    [title, nameInput, confirmBtn].forEach(el => {
      if (el) {
        el.classList.remove('hidden');
        el.style.display = 'block';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    });

    guiaOptions.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0';
      btn.style.cursor = 'default';
    });

    confirmBtn?.addEventListener('click', () => {
      if (!confirmBtn.disabled) {
        const name = (nameInput?.value || '').trim();
        if (name.length < 2) {
          window.toast?.('Por favor, insira um nome válido.', 'warning');
          nameInput?.focus();
          return;
        }

        console.log('[JCGuia] Nome confirmado:', name);
        guiaTexto.innerHTML = `<p>Olá, ${name}! Escolha seu guia para a Jornada:</p>`;
        guiaOptions.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        });
      }
    });

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
    await runTypingSequence(root);

    window.JCGuia.state.ready = true;
    console.log('[JCGuia] Seção guia inicializada.');
  };

  // Método para limpar a seção
  window.JCGuia.destroy = () => {
    console.log('[JCGuia] Destruindo seção guia');
    document.removeEventListener('section:shown', handler);
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

  // Registrar handler para section:shown
  if (!window.JCGuia.state.listenerAdded) {
    console.log('[JCGuia] Registrando listener para section:shown');
    document.addEventListener('section:shown', handler, { once: true });
    window.JCGuia.state.listenerAdded = true;
  }

  // Inicialização manual com fallback
  const bind = () => {
    console.log('[JCGuia] Executando bind');
    document.removeEventListener('section:shown', handler);
    document.addEventListener('section:shown', handler, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 10) => {
      setTimeout(() => {
        const visibleGuia = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visibleGuia && !window.JCGuia.state.ready && !visibleGuia.dataset.guiaInitialized) {
          console.log('[JCGuia] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: SECTION_ID, node: visibleGuia } });
        } else if (document.getElementById(SECTION_ID) && !window.JCGuia.state.ready && !document.getElementById(SECTION_ID).dataset.guiaInitialized) {
          console.log('[JCGuia] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: SECTION_ID, node: document.getElementById(SECTION_ID) } });
        } else if (attempt < maxAttempts) {
          console.log('[JCGuia] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCGuia] Falha ao inicializar após', maxAttempts, 'tentativas');
        }
      }, 100); // Delay fixo de 100ms
    };

    if (!window.JCGuia.state.ready && !document.getElementById(SECTION_ID)?.dataset.guiaInitialized) {
      tryInitialize();
    } else {
      console.log('[JCGuia] Já inicializado ou seção não presente, pulando tryInitialize');
    }
  };

  if (document.readyState === 'loading') {
    console.log('[JCGuia] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCGuia] DOM já carregado, chamando bind');
    bind();
  }
})();
