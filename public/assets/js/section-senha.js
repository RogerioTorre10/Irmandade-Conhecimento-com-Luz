<script>
/**
 * section-senha.js — 18/out (versão Lumen)
 * - Datilografia sequencial (p1→p2→p3→p4)
 * - Leitura por parágrafo (sem duplicar)
 * - Olho mágico (mostrar/ocultar senha)
 * - Botões “Voltar” e “Avançar” estáveis
 * - Idempotente e resiliente a recarregamentos
 */
(function () {
  'use strict';

  // Evita rebind global
  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando…');
    return;
  }

  // Namespace
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    typingInProgress: false
  };

  // --- Utilidades ---
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // Fallback local de datilografia (caso runTyping não exista)
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

  async function typeOnce(el, opts = { speed: 36, speak: true }) {
    if (!el) return;
    const text = getText(el);
    // Reset visual
    el.removeAttribute('data-text');
    el.textContent = '';
    el.classList.remove('typing-done', 'typing-active');

    await sleep(150);

    // Preferir runTyping se existir (mantém padrão do seu TypingBridge)
    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(
            el,
            text,
            () => {
              // callback onComplete
              resolve();
            },
            { speed: opts.speed ?? 36, cursor: true }
          );
        } catch (e) {
          console.warn('[JCSenha] runTyping falhou, usando fallback local', e);
          resolve();
        }
      });
    }

    // Se runTyping não existir ou falhar, garantir texto via fallback
    if (!el.textContent || el.textContent.length === 0) {
      await localType(el, text, opts.speed ?? 36);
    }

    // Disparar fala uma vez (se disponível)
    if (opts.speak && window.EffectCoordinator?.speak && text) {
      try { window.EffectCoordinator.speak(text); } catch {}
    }

    el.classList.add('typing-done');
    await sleep(100);
  }

  async function waitForDependencies() {
    // Damos um tempo para o TypingBridge registrar runTyping/EffectCoordinator
    const max = 25; // ~5s
    let tries = 0;
    while (
      (!window.runTyping || typeof window.runTyping !== 'function') &&
      tries < max
    ) {
      await sleep(200);
      tries++;
    }
    // Mesmo se runTyping não chegar, seguimos: temos fallback.
    return true;
  }

  // Garante que elementos necessários existam
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

  // Sequência de datilografia (um por vez)
  async function runTypingSequence(root) {
    if (window.JCSenha.state.typingInProgress) return;
    window.JCSenha.state.typingInProgress = true;

    const { instr1, instr2, instr3, instr4, input, btnNext, btnPrev } = pickElements(root);

    // Ordem e fala por parágrafo
    const seq = [instr1, instr2, instr3, instr4];
    for (const el of seq) {
      if (!el) continue;
      // Se já foi digitado anteriormente, não repete
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: 36, speak: true });
      }
      await sleep(150);
    }

    // Ao final da sequência, foca o campo e libera botões
    if (input) {
      try { input.focus(); } catch {}
    }
    if (btnPrev) btnPrev.removeAttribute('disabled');
    if (btnNext) btnNext.removeAttribute('disabled');

    window.JCSenha.state.typingInProgress = false;
  }

  // Handler principal quando a seção aparece
  const onShown = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root) return;

    // Evitar reprocessar se já inicializada (mas permitir reabrir sem duplicar listeners)
    if (root.dataset.senhaInitialized === 'true') {
      console.log('[JCSenha] Reaberta — mantendo estado e evitando duplicidades.');
      // Mesmo reaberta, se não tiver concluído a digitação, retomamos a sequência
      runTypingSequence(root);
      return;
    }

    // Marca inicialização
    root.dataset.senhaInitialized = 'true';

    // Espera dependências (runTyping/EffectCoordinator) — com fallback
    await waitForDependencies();

    // Tornar visível com segurança (sem brigar com seu showSection)
    root.classList.remove('hidden');
    root.removeAttribute('aria-hidden');
    root.style.removeProperty('display');
    root.style.removeProperty('opacity');
    root.style.removeProperty('visibility');
    root.style.zIndex = 'auto';

    const { input, toggle, btnNext, btnPrev } = pickElements(root);

    // Estado inicial dos botões (evita clique antes da leitura)
    if (btnPrev) btnPrev.setAttribute('disabled', 'true');
    if (btnNext) btnNext.setAttribute('disabled', 'true');

    // Olho mágico
    toggle?.addEventListener('click', () => {
      if (!input) return;
      input.type = input.type === 'password' ? 'text' : 'password';
    }, { once: false });

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

    // Roda a sequência de datilografia (com leitura)
    runTypingSequence(root);

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada com sucesso.');
  };

  // Opcional: se sua arquitetura disparar também “section:ready” ou “sectionLoaded”
  // você pode escutar aqui sem duplicar lógica.
  // document.addEventListener('sectionLoaded', onShown);

  // Instala o ouvinte de “section:shown” uma vez
  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', onShown);
    window.JCSenha.state.listenerAdded = true;
  }
})();
</script>
