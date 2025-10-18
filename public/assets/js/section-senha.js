// section-senha.js — 18/out (patch Lumen v3)
// - Bloqueia TTS antes da digitação (G.__typingLock)
// - Normaliza parágrafos (usa data-text; se vier inteiro, converte p/ datilografar)
// - Datilografia sequencial p1→p2→p3→p4 com speak 1x no fim de cada parágrafo
// - Observa reinjeções (MutationObserver) e retoma com segurança
// - Botões só liberam ao final; olho mágico estável; idempotente

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
    typingInProgress: false,
    observer: null
  };

  // ---------- Utils ----------
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const textOf = (el) => {
    if (!el) return '';
    const ds = el.dataset?.text;
    const tc = el.textContent || '';
    // Preferimos data-text; se não existir, usa textContent
    return (ds && ds.trim().length ? ds : tc).trim();
  };

  // Prepara o elemento para datilografia:
  // - garante data-text como fonte
  // - apaga conteúdo visual (para digitar)
  function normalizeParagraph(el) {
    if (!el) return false;
    const current = el.textContent?.trim() || '';
    const ds = el.dataset?.text?.trim() || '';
    const source = ds || current;

    if (!source) return false;

    // Sempre manter a fonte no data-text
    el.dataset.text = source;

    // Se ainda não foi digitado, limpar visual para datilografar
    if (!el.classList.contains('typing-done')) {
      el.textContent = '';
      el.classList.remove('typing-active', 'typing-done');
      delete el.dataset.spoken;
    }
    return true;
  }

  // Fallback local de digitação se runTyping não existir
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
    // Fonte SEMPRE vem do data-text
    const text = (el.dataset?.text || '').trim();
    if (!text) return;

    // trava TTS global de terceiros
    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    // Não zerar data-text! (é a nossa fonte garantida)
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

    // libera TTS global ANTES de falar este parágrafo
    window.G.__typingLock = prevLock;

    // Fala 1x por parágrafo, somente após concluir
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
    return true; // seguimos com fallback
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

    // Desabilita navegação durante a digitação
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    // Normaliza todos antes (evita TTS prematuro)
    seq.forEach(normalizeParagraph);

    await waitForTypingBridge();

    for (const el of seq) {
      // Só digita se ainda não concluído
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 36, speak: true });
      }
    }

    // Libera navegação e foca input
    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');
    try { input?.focus(); } catch {}

    window.JCSenha.state.typingInProgress = false;
  }

  function armObserver(root) {
    // Observa reinjeções no section (oscilação)
    try {
      if (window.JCSenha.state.observer) {
        window.JCSenha.state.observer.disconnect();
      }
      const obs = new MutationObserver((mutations) => {
        // Se algo relevante mudou, retomamos a sequência (sem duplicar fala porque marcamos spoken)
        let needRetype = false;
        for (const m of mutations) {
          if (m.type === 'childList' || m.type === 'subtree' || m.addedNodes?.length) {
            needRetype = true; break;
          }
        }
        if (needRetype && !window.JCSenha.state.typingInProgress) {
          // Re-normaliza e roda novamente
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

    // Blindagem visual leve (sem brigar com showSection)
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    if (root.dataset.senhaInitialized === 'true') {
      // Reabertura: apenas roda (pega reinjeções)
      runTypingSequence(root);
      return;
    }

    const { input, toggle, btnNext, btnPrev, instr1, instr2, instr3, instr4 } = pickElements(root);

    // Estado inicial dos botões: travados
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    // Olho mágico
    toggle?.addEventListener('click', () => {
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    });

    // Navegação
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

    // Normaliza imediatamente todos os parágrafos (evita TTS precoce)
    [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);

    // Observa reinjeções/oscilações
    armObserver(root);

    // Marca e executa
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
