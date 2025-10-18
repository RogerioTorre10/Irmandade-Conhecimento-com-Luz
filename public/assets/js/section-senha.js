// section-senha.js — 18/out (patch Lumen v3, atualizado para efeito leitura inicial)

(function () {
  'use strict';

  // ... (código anterior até window.JCSenha.state) ...

  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    typingInProgress: false,
    observer: null,
    isFirstLoad: true // Nova flag para rastrear primeiro carregamento
  };

  // ... (funções utilitárias como sleep, textOf, normalizeParagraph, localType, typeOnce, waitForTypingBridge, pickElements mantidas) ...

  // Função para executar apenas o efeito de leitura (TTS) em sequência
  async function runReadingSequence(root) {
    const { instr1, instr2, instr3, instr4 } = pickElements(root);
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);

    // Normaliza parágrafos e exibe texto completo (sem datilografia)
    seq.forEach((el) => {
      normalizeParagraph(el);
      const text = el.dataset.text || '';
      el.textContent = text; // Exibe texto completo
      el.classList.add('typing-done'); // Marca como concluído para evitar datilografia
    });

    // Executa TTS sequencialmente
    for (const el of seq) {
      const text = el.dataset.text || '';
      if (text && !el.dataset.spoken && window.EffectCoordinator?.speak) {
        try {
          window.G.__typingLock = true; // Bloqueia TTS externo
          await window.EffectCoordinator.speak(text);
          el.dataset.spoken = 'true';
          window.G.__typingLock = false; // Libera após cada fala
          await sleep(80); // Pequena pausa entre parágrafos
        } catch (e) {
          console.warn('[JCSenha] Falha no TTS', e);
        }
      }
    }

    // Após leitura, reinicia para datilografia + leitura
    window.JCSenha.state.isFirstLoad = false;
    resetForTyping(root); // Função para reiniciar
  }

  // Função para reiniciar parágrafos e iniciar datilografia
  function resetForTyping(root) {
    const { instr1, instr2, instr3, instr4 } = pickElements(root);
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);

    // Reseta parágrafos para datilografia
    seq.forEach((el) => {
      el.textContent = ''; // Limpa texto
      el.classList.remove('typing-done', 'typing-active');
      delete el.dataset.spoken; // Permite TTS novamente
    });

    // Inicia sequência completa (datilografia + leitura)
    runTypingSequence(root);
  }

  // Função ajustada para suportar modo leitura + datilografia
  async function runTypingSequence(root) {
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev } = pickElements(root);
    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);

    // Desabilita navegação durante a sequência
    btnPrev?.setAttribute('disabled', 'true');
    btnNext?.setAttribute('disabled', 'true');

    // Normaliza todos antes
    seq.forEach(normalizeParagraph);

    await waitForTypingBridge();

    for (const el of seq) {
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

  // Ajuste no MutationObserver para respeitar isFirstLoad
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
        if (needRetype && !window.JCSenha.state.typingInProgress) {
          const { instr1, instr2, instr3, instr4 } = pickElements(root);
          [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);
          if (window.JCSenha.state.isFirstLoad) {
            runReadingSequence(root); // Respeita primeiro carregamento
          } else {
            runTypingSequence(root); // Sequência normal
          }
        }
      });
      obs.observe(root, { childList: true, subtree: true, characterData: true });
      window.JCSenha.state.observer = obs;
    } catch {}
  }

  // Função onShown ajustada
  const onShown = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root) return;

    // Blindagem visual
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    if (root.dataset.senhaInitialized === 'true') {
      // Reabertura: respeita isFirstLoad
      if (window.JCSenha.state.isFirstLoad) {
        runReadingSequence(root);
      } else {
        runTypingSequence(root);
      }
      return;
    }

    const { input, toggle, btnNext, btnPrev, instr1, instr2, instr3, instr4 } = pickElements(root);

    // Estado inicial dos botões
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

    // Normaliza parágrafos
    [instr1, instr2, instr3, instr4].filter(Boolean).forEach(normalizeParagraph);

    // Observa reinjeções
    armObserver(root);

    // Marca e executa
    root.dataset.senhaInitialized = 'true';
    if (window.JCSenha.state.isFirstLoad) {
      runReadingSequence(root); // Primeiro: apenas leitura
    } else {
      runTypingSequence(root); // Após reinício: leitura + datilografia
    }

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada.');
  };

  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', onShown);
    window.JCSenha.state.listenerAdded = true;
  }
})();
