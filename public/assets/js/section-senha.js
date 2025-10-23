(function () {
  'use strict';
  
  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-guia';
  const HOME_PAGE = '/';
  const HIDE = 'hidden';
  const INITIAL_TYPING_DELAY_MS = 8500;
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 2000; // Atraso fixo como fallback para TTS

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

  // ---------- Utils ----------
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

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

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
        window.EffectCoordinator.speak(text);
        console.log('[JCSenha] Iniciando TTS para:', text);
        await sleep(TTS_FALLBACK_DELAY_MS); // Fallback para esperar o TTS
        console.log('[JCSenha] TTS assumido como concluído após atraso:', text);
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

  async function waitForVideoEnd(videoElementId = 'transition-video') {
    const video = document.getElementById(videoElementId);
    if (!video) {
      console.log('[JCSenha] Vídeo de transição não encontrado, usando timeout padrão');
      return sleep(TRANSITION_TIMEOUT_MS);
    }

    return new Promise((resolve) => {
      video.addEventListener('ended', () => {
        console.log('[JCSenha] Vídeo terminou');
        resolve();
      }, { once: true });
      setTimeout(resolve, TRANSITION_TIMEOUT_MS);
    });
  }

  function playTransitionVideo(nextSectionId) {
    console.log('[JCSenha] Iniciando transição de vídeo:', TRANSITION_SRC);
    const video = document.createElement('video');
    video.id = 'transition-video';
    video.src = TRANSITION_SRC;
    video.autoplay = true;
    video.muted = true;
    video.controls = false;
    video.style.width = '100%';
    video.style.height = '100vh';
    video.style.position = 'fixed';
    video.style.top = '0';
    video.style.left = '0';
    video.style.zIndex = '9999';
    video.style.backgroundColor = '#000';

    // Esconder a seção senha antes de exibir o vídeo
    const senhaSection = document.getElementById('section-senha');
    if (senhaSection) {
      senhaSection.classList.add('hidden');
      senhaSection.style.display = 'none';
      senhaSection.setAttribute('aria-hidden', 'true');
      console.log('[JCSenha] Seção senha escondida');
    }

    // Definir currentSection para evitar reinicialização
    if (window.JC) {
      window.JC.currentSection = SECTION_ID;
      console.log('[JCSenha] Definido window.JC.currentSection como', SECTION_ID);
    }

    document.body.appendChild(video);
    console.log('[JCSenha] Vídeo adicionado ao DOM.');

    video.addEventListener('ended', () => {
      console.log('[JCSenha] Vídeo terminado, carregando:', nextSectionId);
      video.remove();
      try {
        window.JC?.show(nextSectionId);
        console.log('[JCSenha] Navegação para', nextSectionId, 'iniciada');
      } catch (e) {
        console.error('[JCSenha] Erro ao carregar próxima seção:', e);
      }
    }, { once: true });

    video.addEventListener('error', (e) => {
      console.error('[JCSenha] Erro ao reproduzir vídeo:', e);
      video.remove();
      console.log('[JCSenha] Redirecionando para:', nextSectionId, '(fallback devido a erro no vídeo)');
      try {
        window.JC?.show(nextSectionId);
        console.log('[JCSenha] Navegação para', nextSectionId, 'iniciada (fallback)');
      } catch (e) {
        console.error('[JCSenha] Erro ao carregar próxima seção:', e);
      }
    });
  }

  function pickElements(root) {
    return {
      instr1: root.querySelector('#senha-instr1'),
      instr2: root.querySelector('#senha-instr2'),
      instr3: root.querySelector('#senha-instr3'),
      instr4: root.querySelector('#senha-instr4'),
      input: root.querySelector('#senha-input'),
      toggle: root.querySelector('.btn-toggle-senha'),
      btnNext: root.querySelector('#btn-senha-avancar'),
      btnPrev: root.querySelector('#btn-senha-prev')
    };
  }

  async function runTypingSequence(root) {
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev, toggle } = pickElements(root);
    const seq = [instr1, instr2, instr3, instr4]
      .filter(Boolean)
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return aRect.left - bRect.left || aRect.top - bRect.top;
      });

    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');
    input?.setAttribute('disabled', 'true');
    toggle?.setAttribute('disabled', 'true');

    seq.forEach(normalizeParagraph);

    await waitForVideoEnd();
    await sleep(INITIAL_TYPING_DELAY_MS - TRANSITION_TIMEOUT_MS);

    await waitForTypingBridge();

    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 36, speak: true });
      }
    }

    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');
    input?.removeAttribute('disabled');
    toggle?.removeAttribute('disabled');

    if (input) {
      input.removeAttribute('readonly');
      try {
        input.focus();
        console.log('[JCSenha] Foco aplicado ao input');
      } catch (e) {
        console.error('[JCSenha] Falha ao focar input:', e);
      }
    }

    window.JCSenha.state.typingInProgress = false;
    window.JCSenha.state.initialized = true; // Marca como inicializado
  }

  function armObserver(root) {
    try {
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
          const { instr1, instr2, instr3, instr4 } = pickElements(root);
          [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
          runTypingSequence(root);
        } else {
          console.log('[JCSenha] Observer ignorado: seção já inicializada ou datilografia em progresso');
        }
      });
      obs.observe(root, { childList: true, subtree: true, characterData: true });
      window.JCSenha.state.observer = obs;
      console.log('[JCSenha] Observer configurado');
    } catch (e) {
      console.error('[JCSenha] Erro no observer:', e);
    }
  }

  const onShown = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root) {
      console.error('[JCSenha] Root #section-senha não encontrado');
      return;
    }

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    if (root.dataset.senhaInitialized === 'true') {
      runTypingSequence(root);
      return;
    }

    const { input, toggle, btnNext, btnPrev, instr1, instr2, instr3, instr4 } = pickElements(root);

    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');
    input?.setAttribute('disabled', 'true');
    toggle?.setAttribute('disabled', 'true');

    if (toggle && input) {
      toggle.addEventListener('click', () => {
        console.log('[JCSenha] Clique no Olho Mágico, tipo atual:', input.type);
        input.type = input.type === 'password' ? 'text' : 'password';
        console.log('[JCSenha] Novo tipo do input:', input.type);
      });
    } else {
      console.error('[JCSenha] Erro: toggle ou input não encontrados', { toggle, input });
    }

    btnPrev?.addEventListener('click', () => {
      console.log('[JCSenha] Botão Voltar clicado');
      try {
        window.JC?.show('section-termos');
      } catch (e) {
        console.error('[JCSenha] Erro ao navegar para section-termos:', e);
      }
    });

    btnNext?.addEventListener('click', () => {
      console.log('[JCSenha] Botão Avançar clicado, valor do input:', input?.value);
      if (!input) {
        console.error('[JCSenha] Input #senha-input não encontrado');
        window.toast?.('Erro: campo de senha não encontrado.', 'error');
        return;
      }
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
    });

    if (input) {
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      input.addEventListener('input', () => {
        console.log('[JCSenha] Input alterado:', input.value);
      });
    } else {
      console.error('[JCSenha] Input #senha-input não encontrado na inicialização');
    }

    if (toggle) {
      toggle.removeAttribute('disabled');
    } else {
      console.error('[JCSenha] Botão .btn-toggle-senha não encontrado na inicialização');
    }

    [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
    armObserver(root);

    root.dataset.senhaInitialized = 'true';
    runTypingSequence(root);

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada.');
    // Desconectar o observer após a inicialização
    if (window.JCSenha.state.observer) {
      window.JCSenha.state.observer.disconnect();
      console.log('[JCSenha] Observer desconectado após inicialização');
    }
  };

  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', onShown);
    window.JCSenha.state.listenerAdded = true;
  }
})();
