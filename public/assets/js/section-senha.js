// section-senha.js — 18/out (patch Lumen v2)
// - Datilografia sequencial (p1→p2→p3→p4), sem depender de data-typing
// - Leitura (speak) 1x por parágrafo
// - Olho mágico + botões estáveis
// - Idempotente entre reaberturas

(function () {
  'use strict';

  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }

  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    typingInProgress: false
  };

  // Utils
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const getText = (el) => (el?.dataset?.text ?? el?.textContent ?? '').trim();

  // Fallback local de digitação (se runTyping não existir)
  async function localType(el, text, speed = 36) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          el.classList.add('typing-done');
          resolve();
        }
      };
      tick();
    });
  }

  async function typeOnce(el, { speed = 36, speak = true } = {}) {
    if (!el) return;
    const text = getText(el);
    // Sempre normaliza o estado visual
    el.removeAttribute('data-text');
    el.classList.remove('typing-done', 'typing-active');
    el.textContent = '';

    await sleep(120);

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      // Usa seu TypingBridge quando disponível
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

    // Fala 1x por parágrafo (com pequena proteção contra duplicidade)
    if (speak && text && window.EffectCoordinator?.speak && !el.dataset.spoken) {
      try {
        window.EffectCoordinator.speak(text);
        el.dataset.spoken = 'true';
      } catch {}
    }
  }

  async function waitForDependencies(maxMs = 4000) {
    const t0 = Date.now();
    while (Date.now() - t0 < maxMs) {
      // Mesmo que runTyping não chegue, seguimos (temos fallback).
      if (window.runTyping || Date.now() - t0 > 800) return true;
      await sleep(100);
    }
    return true;
  }

  function pickElements(root) {
    return {
      instr1: root.querySelector('#senha-instr1'),
      instr2: root.querySelector('#senha-instr2'),
      instr3: root.querySelector('#senha-instr3'),
      instr4: root.querySelector('#senha-instr4'),
      input:  root.querySelector('#senha-input'),
      toggle: root.querySelector('.btn-toggle-senha'),
      btnNext: root.querySelector('#btn-senha-avancar'),
      btnPrev: root.querySelector('#btn-senha-prev')
    };
  }

  async function runTypingSequence(root) {
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev } = pickElements(root);
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);

    // Se não houver textos, não bloqueia a navegação
    if (seq.length === 0) {
      btnPrev?.removeAttribute('disabled');
      btnNext?.removeAttribute('disabled');
      window.JCSenha.state.typingInProgress = false;
      return;
    }

    for (const el of seq) {
      // Só digita se ainda não foi concluído anteriormente
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 36, speak: true });
      }
      await sleep(120);
    }

    // Libera navegação ao final
    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');

    // Foco no input
    try { input?.focus(); } catch {}

    window.JCSenha.state.typingInProgress = false;
  }

  const onShown = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root) return;

    // Em reaberturas, apenas relança a sequência se necessário
    if (root.dataset.senhaInitialized === 'true') {
      runTypingSequence(root);
      return;
    }

    await waitForDependencies();

    // Blindagem visual (sem brigar com showSection)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    const { input, toggle, btnNext, btnPrev } = pickElements(root);

    // Estado inicial dos botões — travados até concluir a sequência
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    // Olho mágico
    if (toggle) {
      toggle.addEventListener('click', () => {
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    }

    // Navegação
    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        try { window.JC?.show('section-termos'); } catch {}
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (!input) return;
        const senha = (input.value || '').trim();
        if (senha.length >= 3) {
          try { window.JC?.show('section-filme'); } catch {}
        } else {
          window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
          try { input.focus(); } catch {}
        }
      });
    }

    // Marca como inicializada e inicia sequência
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
