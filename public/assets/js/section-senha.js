(function () {
  'use strict';
  
  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-guia';      // Próxima seção (navegação interna)
  const HOME_PAGE = '/';                       // Voltar para Home
  const HIDE = 'hidden';
  const INITIAL_TYPING_DELAY_MS = 8500;       // Atraso inicial ajustado para após o vídeo (8s + 0.5s de margem)

  // Vídeo de transição (ajuste se o teu caminho for diferente)
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;          // Timeout de segurança

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
    observer: null
  };

  // ---------- Utils ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const textOf = (el) => {
    if (!el) return '';
    const ds = el.dataset?.text;
    const tc = el.textContent || '';
    return (ds && ds.trim().length ? ds : tc).trim();
  };

  // Prepara o elemento para datilografia
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

  // Fallback local de digitação
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
        el.dataset.spoken = 'true';
      } catch {}
    }

    await sleep(80);
  }

  async function waitForTypingBridge(maxMs = 3000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      if (window.runTyping) return true;
      await sleep(100);
    }
    return true; // Segue com fallback
  }

  // Tenta detectar o término do vídeo
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
      // Timeout de segurança
      setTimeout(resolve, TRANSITION_TIMEOUT_MS);
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

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev } = pickElements(root);
    const seq = [instr1, instr2, instr3, instr4]
      .filter(Boolean)
      .sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        return aRect.left - bRect.left || aRect.top - bRect.top;
      });

    // Desabilita navegação e input durante a digitação
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');
    input?.setAttribute('disabled', 'true'); // Desabilita input temporariamente

    // Normaliza todos antes
    seq.forEach(normalizeParagraph);

    // Aguarda o término do vídeo
    await waitForVideoEnd();
    // Atraso adicional para garantir visibilidade
    await sleep(INITIAL_TYPING_DELAY_MS - TRANSITION_TIMEOUT_MS);

    await waitForTypingBridge();

    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 36, speak: true });
      }
    }

    // Libera navegação e input
    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');
    if (input) {
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      try {
        input.focus();
        console.log('[JCSenha] Foco aplicado ao input');
      } catch (e) {
        console.error('[JCSenha] Falha ao focar input:', e);
      }
    }

    window.JCSenha.state.typingInProgress = false;
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
            needRetype = true; break;
          }
        }
        if (needRetype && !window.JCSenha.state.typingInProgress) {
          const { instr1, instr2, instr3, instr4 } = pickElements(root);
          [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
          runTypingSequence(root);
        }
      });
      obs.observe(root, { childList: true, subtree: true, characterData: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  const onShown = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root) return;

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
    input?.setAttribute('disabled', 'true'); // Desabilita input inicialmente

    toggle?.addEventListener('click', () => {
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    btnPrev?.addEventListener('click', () => {
      try { window.JC?.show('section-termos'); } catch {}
    });

    btnNext?.addEventListener('click', () => {
      if (!input) return;
      const senha = (input.value || '').trim();
      if (senha.length >= 3) {
        try { window.JC?.show('section-filme'); } catch {}
      } else {
        window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
        try { input.focus(); } catch {}
      }
    });

    // Garante que o input seja editável após inicialização
    if (input) {
      input.removeAttribute('disabled');
      input.removeAttribute('readonly');
      input.addEventListener('input', () => {
        console.log('[JCSenha] Input alterado:', input.value);
      });
    }

    [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
    armObserver(root);

    root.dataset.senhaInitialized = 'true';
    runTypingSequence(root);

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada.');
  };

  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', onShown);
    window.JCSenha.state.listenerAdded = true;
  }
})();
