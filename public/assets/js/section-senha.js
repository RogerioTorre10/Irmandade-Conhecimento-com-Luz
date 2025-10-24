(function () {
  'use strict';

  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-guia';
  const HOME_PAGE = '/';
  const HIDE = 'hidden';
  const INITIAL_TYPING_DELAY_MS = 12000;
  const TRANSITION_SRC = '/assets/img/filme-senha-confirmada.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;
  const TTS_FALLBACK_DELAY_MS = 3000;

  // Evitar múltiplas inicializações
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

  async function waitForElement(selector, { within = document, timeout = 5000, step = 100 } = {}) {
    console.log('[JCSenha] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) {
          console.log('[JCSenha] Elemento encontrado:', selector);
          return resolve(el);
        }
        if (performance.now() - start >= timeout) {
          console.error('[JCSenha] Timeout aguardando:', selector);
          return reject(new Error(`timeout waiting ${selector}`));
        }
        setTimeout(tick, step);
      };
      tick();
    });
  }

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
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
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
        speechSynthesis.cancel(); // Cancelar TTS anterior
        window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.1, pitch: 1.0 });
        console.log('[JCSenha] Iniciando TTS para:', text);
        await sleep(TTS_FALLBACK_DELAY_MS);
        console.log('[JCSenha] TTS assumido como concluído após atraso:', text);
        el.dataset.spoken = 'true';
      } catch (e) {
        console.error('[JCSenha] Erro no TTS:', e);
      }
    }

    await sleep(80);
  }

  async function waitForTypingBridge(maxMs = 5000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    console.warn('[JCSenha] window.runTyping não encontrado após', maxMs, 'ms');
    return true;
  }

  async function waitForVideoEnd(videoElementId = 'videoTransicao') {
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

  function hideSection() {
    const section = document.querySelector('#section-senha');
    const focusedButton = document.querySelector('#btn-senha-avancar:focus, #btn-senha-prev:focus');
    if (focusedButton) {
      focusedButton.blur();
      console.log('[JCSenha] Foco removido de botão ativo');
    }
    if (section) {
      section.classList.add('hidden');
      section.setAttribute('aria-hidden', 'true');
      section.setAttribute('inert', '');
      console.log('[JCSenha] Seção senha escondida');
    }
  }

  function playTransitionVideo(nextSectionId) {
    console.log('[JCSenha] Iniciando transição de vídeo:', TRANSITION_SRC);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(TRANSITION_SRC, nextSectionId);
    } else {
      console.warn('[JCSenha] window.playTransitionVideo não encontrado, usando fallback');
      setTimeout(() => {
        console.log('[JCSenha] Fallback: navegando para:', nextSectionId);
        if (typeof window.JC?.show === 'function') {
          window.JC.show(nextSectionId);
        } else {
          console.warn('[JCSenha] Fallback navigation to:', nextSectionId);
          window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
        }
      }, 2000);
    }
  }

  function pickElements(root) {
    const elements = {
      instr1: root.querySelector('#senha-instr1'),
      instr2: root.querySelector('#senha-instr2'),
      instr3: root.querySelector('#senha-instr3'),
      instr4: root.querySelector('#senha-instr4'),
      input: root.querySelector('#senha-input'),
      toggle: root.querySelector('.btn-toggle-senha'),
      btnNext: root.querySelector('#btn-senha-avancar'),
      btnPrev: root.querySelector('#btn-senha-prev')
    };
    console.log('[JCSenha] Elementos verificados:', {
      instr1: !!elements.instr1,
      instr2: !!elements.instr2,
      instr3: !!elements.instr3,
      instr4: !!elements.instr4,
      input: !!elements.input,
      toggle: !!elements.toggle,
      btnNext: !!elements.btnNext,
      btnPrev: !!elements.btnPrev
    });
    return elements;
  }

  async function runTypingSequence(root) {
    window.JCSenha.state.typingInProgress = true;
    console.log('[JCSenha] Iniciando sequência de datilografia');

    const { instr1, instr2, instr3, instr4, input, toggle, btnPrev, btnNext } = pickElements(root);

    const seq = [instr1, instr2, instr3, instr4].filter(Boolean).sort((a, b) => {
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
    window.JCSenha.state.initialized = true;
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
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) {
      console.log('[JCSenha] Ignorando, sectionId não é section-senha:', sectionId);
      return;
    }

    if (window.JCSenha.state.ready || node?.dataset.senhaInitialized === 'true') {
      console.log('[JCSenha] Já inicializado, ignorando...');
      return;
    }

    let root;
    try {
      root = await waitForElement('#section-senha', { 
        within: document.getElementById('jornada-content-wrapper') || document, 
        timeout: 10000 
      });
    } catch (e) {
      console.error('[JCSenha] Root #section-senha não encontrado:', e);
      window.toast?.('Erro: Seção Senha não carregada.', 'error');
      return;
    }

    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    let input, toggle, btnNext, btnPrev, instr1, instr2, instr3, instr4;
    try {
      instr1 = await waitForElement('#senha-instr1', { within: root, timeout: 5000 });
      instr2 = await waitForElement('#senha-instr2', { within: root, timeout: 5000 });
      instr3 = await waitForElement('#senha-instr3', { within: root, timeout: 5000 });
      instr4 = await waitForElement('#senha-instr4', { within: root, timeout: 5000 });
      input = await waitForElement('#senha-input', { within: root, timeout: 5000 });
      toggle = await waitForElement('.btn-toggle-senha', { within: root, timeout: 5000 });
      btnNext = await waitForElement('#btn-senha-avancar', { within: root, timeout: 5000 });
      btnPrev = await waitForElement('#btn-senha-prev', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[JCSenha] Falha ao carregar elementos:', e);
      window.toast?.('Erro: Elementos da seção Senha não encontrados.', 'error');
      return;
    }

    console.log('[JCSenha] Elementos carregados:', { instr1, instr2, instr3, instr4, input, toggle, btnNext, btnPrev });

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
        hideSection();
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
    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada.');
    if (window.JCSenha.state.observer) {
      window.JCSenha.state.observer.disconnect();
      console.log('[JCSenha] Observer desconectado após inicialização');
    }

    await runTypingSequence(root);
  };

  const handler = onShown; // Alias para consistência com section-guia.js

  // Remover listeners incorretos
  document.removeEventListener('sectionLoaded', handler);

  // Registrar handler para section:shown
  if (!window.JCSenha.state.listenerAdded) {
    console.log('[JCSenha] Registrando listener para section:shown');
    document.addEventListener('section:shown', handler, { once: true });
    window.JCSenha.state.listenerAdded = true;
  }

  // Inicialização manual com fallback
  const bind = () => {
    console.log('[JCSenha] Executando bind');
    if (window.JCSenha.state.listenerAdded) {
      document.removeEventListener('section:shown', handler);
    }
    document.addEventListener('section:shown', handler, { passive: true, once: true });
    window.JCSenha.state.listenerAdded = true;

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
          console.error('[JCSenha] Falha ao inicializar após', maxAttempts, 'tentativas');
        }
      }, 100); // Delay fixo de 100ms
    };

    if (!window.JCSenha.state.ready && !document.getElementById(SECTION_ID)?.dataset.senhaInitialized) {
      tryInitialize();
    } else {
      console.log('[JCSenha] Já inicializado ou seção não presente, pulando tryInitialize');
    }
  };

  if (document.readyState === 'loading') {
    console.log('[JCSenha] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCSenha] DOM já carregado, chamando bind');
    bind();
  }
})();
