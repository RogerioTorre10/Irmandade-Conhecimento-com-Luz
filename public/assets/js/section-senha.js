(function () {
  'use strict';

  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const PREV_SECTION_ID = 'section-termos';
  const NEXT_SECTION_ID = 'section-guia';
  const TRANSITION_SRC = '/assets/img/filme-senha-confirmada.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000;

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
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

  async function localType(el, text, speed = 36) {
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

  async function typeOnce(el, { speed = 36, speak = true } = {}) {
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
          console.warn('[JCSenha] runTyping falhou, usando fallback local', e);
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
        console.log('[JCSenha] Iniciando TTS para:', text);
        await sleep(TTS_FALLBACK_DELAY_MS);
        console.log('[JCSenha] TTS assumido como concluído:', text);
        el.dataset.spoken = 'true';
      } catch (e) {
        console.error('[JCSenha] Erro no TTS:', e);
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
    if (document.getElementById('senha-transition-overlay')) return;
    console.log('[JCSenha] Iniciando transição de vídeo:', TRANSITION_SRC);
    const overlay = document.createElement('div');
    overlay.id = 'senha-transition-overlay';
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
      console.log('[JCSenha] Transição concluída, navegando para:', nextSectionId);
      if (typeof window.JC?.show === 'function') {
        window.JC.show(nextSectionId);
      } else {
        window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
        console.warn('[JCSenha] Fallback navigation to:', nextSectionId);
      }
    };

    video.addEventListener('ended', () => {
      console.log('[JCSenha] Vídeo terminou, limpando e prosseguindo.');
      cleanup();
    }, { once: true });
    video.addEventListener('error', () => {
      console.error('[JCSenha] Erro ao reproduzir vídeo:', TRANSITION_SRC);
      setTimeout(cleanup, 1200);
    }, { once: true });
    setTimeout(() => { if (!done) cleanup(); }, TRANSITION_TIMEOUT_MS);

    Promise.resolve().then(() => video.play?.()).catch(() => {
      console.warn('[JCSenha] Erro ao iniciar vídeo, usando fallback.');
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
    console.log(`[JCSenha] Visibilidade forçada para ${sectionId}`);
  }

  function pickElements(root) {
    return {
      title: root.querySelector('.parchment-title-rough'),
      instr1: root.querySelector('#senha-instr1'),
      instr2: root.querySelector('#senha-instr2'),
      instr3: root.querySelector('#senha-instr3'),
      instr4: root.querySelector('#senha-instr4'),
      input: root.querySelector('#senha-input'),
      toggle: root.querySelector('.btn-toggle-senha'),
      btnPrev: root.querySelector('#btn-senha-prev'),
      btnNext: root.querySelector('#btn-senha-avancar')
    };
  }

  async function runTypingSequence(root) {
    const { title, instr1, instr2, instr3, instr4, input, toggle, btnPrev, btnNext } = pickElements(root);
    window.JCSenha.state.typingInProgress = true;

    const seq = [title, instr1, instr2, instr3, instr4].filter(Boolean).sort((a, b) => {
      const aRect = a.getBoundingClientRect();
      const bRect = b.getBoundingClientRect();
      return aRect.left - bRect.left || aRect.top - bRect.top;
    });

    [btnPrev, btnNext, input, toggle].forEach(el => {
      if (el) {
        el.disabled = true;
        el.style.opacity = '0';
        el.style.cursor = 'default';
      }
    });

    seq.forEach(normalizeParagraph);
    await waitForTypingBridge();

    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 36, speak: true });
      }
    }

    [btnPrev, btnNext, input, toggle].forEach(el => {
      if (el) {
        el.disabled = false;
        el.style.opacity = '1';
        el.style.cursor = el.tagName === 'INPUT' ? 'text' : 'pointer';
      }
    });

    if (input) {
      try {
        input.focus();
        console.log('[JCSenha] Foco aplicado ao input');
      } catch (e) {
        console.error('[JCSenha] Falha ao focar input:', e);
      }
    }

    window.JCSenha.state.typingInProgress = false;
    window.JCSenha.state.initialized = true;
  }

  function armObserver(root) {
    if (window.JCSenha.state.observer) {
      window.JCSenha.state.observer.disconnect();
    }
    const obs = new MutationObserver((mutations) => {
      let needRetype = false;
      for (const m of mutations) {
        if (m.type === 'childList' || m.type === 'subtree' || m.addedNodes?.length) {
          needRetype = true;
          break;
        }
      }
      if (needRetype && !window.JCSenha.state.typingInProgress && !window.JCSenha.state.initialized) {
        console.log('[JCSenha] Observer detectou mudanças, reiniciando datilografia');
        runTypingSequence(root);
      }
    });
    obs.observe(root, { childList: true, subtree: true, characterData: true });
    window.JCSenha.state.observer = obs;
    console.log('[JCSenha] Observer configurado');
  }

  const handler = async (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) {
      console.log('[JCSenha] Ignorando, sectionId não é section-senha:', sectionId);
      return;
    }

    if (window.JCSenha.state.ready || (node && node.dataset.senhaInitialized)) {
      console.log('[JCSenha] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById(SECTION_ID);
    if (!root) {
      console.log('[JCSenha] Tentando localizar #section-senha...');
      try {
        root = await new Promise((resolve, reject) => {
          const start = Date.now();
          const tick = () => {
            const el = document.querySelector(`#jornada-content-wrapper #${SECTION_ID}`);
            if (el) return resolve(el);
            if (Date.now() - start >= 10000) return reject(new Error('timeout waiting #section-senha'));
            setTimeout(tick, 50);
          };
          tick();
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-senha não carregada.', 'error');
        console.error('[JCSenha] Section not found:', e);
        return;
      }
    }

    console.log('[JCSenha] Root encontrado:', root);
    root.dataset.senhaInitialized = 'true';
    root.classList.add('section-senha');

    ensureSectionVisible(root, SECTION_ID);

    const { input, toggle, btnPrev, btnNext } = pickElements(root);

    [btnPrev, btnNext, input, toggle].forEach(el => {
      if (el) {
        el.disabled = true;
        el.style.opacity = '0';
        el.style.cursor = 'default';
      }
    });

    if (toggle && input) {
      toggle.addEventListener('click', () => {
        console.log('[JCSenha] Clique no Olho Mágico, tipo atual:', input.type);
        input.type = input.type === 'password' ? 'text' : 'password';
        toggle.textContent = input.type === 'password' ? '👁️' : '🙈';
      });
    }

    btnPrev?.addEventListener('click', () => {
      if (!btnPrev.disabled) {
        speechSynthesis.cancel();
        console.log('[JCSenha] Botão Voltar clicado');
        playTransitionVideo(PREV_SECTION_ID);
      }
    });

    btnNext?.addEventListener('click', () => {
      if (!btnNext.disabled) {
        console.log('[JCSenha] Botão Avançar clicado, valor do input:', input?.value);
        const senha = (input.value || '').trim();
        if (senha.length >= 3) {
          console.log('[JCSenha] Senha válida, iniciando transição');
          playTransitionVideo(NEXT_SECTION_ID);
        } else {
          console.log('[JCSenha] Senha inválida, length:', senha.length);
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try {
            input.focus();
            console.log('[JCSenha] Foco reaplicado ao input');
          } catch (e) {
            console.error('[JCSenha] Falha ao focar input:', e);
          }
        }
      }
    });

    if (input) {
      input.addEventListener('input', () => {
        console.log('[JCSenha] Input alterado:', input.value);
      });
    }

    armObserver(root);
    runTypingSequence(root);

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada.');
  };

  // Método para limpar a seção
  window.JCSenha.destroy = () => {
    console.log('[JCSenha] Destruindo seção senha');
    document.removeEventListener('sectionLoaded', handler);
    if (window.JCSenha.state.observer) {
      window.JCSenha.state.observer.disconnect();
    }
    const root = document.getElementById(SECTION_ID);
    if (root) {
      root.dataset.senhaInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
    }
    window.JCSenha.state.ready = false;
    window.JCSenha.state.listenerAdded = false;
    window.JCSenha.state.typingInProgress = false;
    window.JCSenha.state.initialized = false;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
  };

  if (!window.JCSenha.state.listenerAdded) {
    console.log('[JCSenha] Registrando listener para sectionLoaded');
    document.addEventListener('sectionLoaded', handler, { once: true });
    window.JCSenha.state.listenerAdded = true;
  }

  const bind = () => {
    console.log('[JCSenha] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });

    const tryInitialize = (attempt = 1, maxAttempts = 10) => {
      setTimeout(() => {
        const visibleSenha = document.querySelector(`#${SECTION_ID}:not(.hidden)`);
        if (visibleSenha && !window.JCSenha.state.ready && !visibleSenha.dataset.senhaInitialized) {
          console.log('[JCSenha] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: SECTION_ID, node: visibleSenha } });
        } else if (document.getElementById(SECTION_ID) && !window.JCSenha.state.ready && !document.getElementById(SECTION_ID).dataset.senhaInitialized) {
          console.log('[JCSenha] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: SECTION_ID, node: document.getElementById(SECTION_ID) } });
        } else if (attempt < maxAttempts) {
          console.log('[JCSenha] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCSenha] Falha ao inicializar após ' + maxAttempts + ' tentativas');
        }
      }, 1000 * attempt);
    };

    tryInitialize();
  };

  if (document.readyState === 'loading') {
    console.log('[JCSenha] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCSenha] DOM já carregado, chamando bind');
    bind();
  }
})();
