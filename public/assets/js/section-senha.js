// /assets/js/section-senha.js  · seguro, idempotente, sem loops
(function () {
  'use strict';

  const MOD = 'section-senha.js';
  const SECTION_ID = 'section-senha';
  const NEXT_SECTION_ID = 'section-guia';      // Próxima seção (navegação interna)
  const HOME_PAGE = '/';                       // Voltar para Home
  const HIDE = 'hidden';

  // Vídeo de transição (ajuste se o teu caminho for diferente)
  const TRANSITION_SRC = '/assets/img/filme-senha.mp4';
  const TRANSITION_TIMEOUT_MS = 8000;          // timeout de segurança

  // Evita reinicialização
  if (window.JCSenha && window.JCSenha.__bound) {
    console.log(`[${MOD}] Já inicializado, ignorando`);
    return;
  }

  window.JCSenha = {
    __bound: true,
    state: {
      prepared: false,
      validated: false,
      transitioning: false,
      navigated: false
    }
  };

  // ------------------------------
  // Utils
  // ------------------------------
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureTyping(node) {
    try {
      if (node && node.dataset && node.dataset.text && typeof window.applyTyping === 'function') {
        window.applyTyping(node);
      }
    } catch (e) {
      console.warn(`[${MOD}] TypingBridge indisponível`, e);
    }
  }

  // Aceita #input-senha ou #senha-input (compatibilidade)
  function getPasswordInput(root) {
    return $('#input-senha', root) || $('#senha-input', root);
  }

  // ------------------------------
  // Validação (troque pela tua regra/API quando quiser)
  // ------------------------------
  function validatePassword(value) {
    const v = (value || '').trim();
    // regra mínima para UI: 3+ chars
    return v.length >= 3;
  }

  // ------------------------------
  // Navegação interna segura
  // ------------------------------
  function goNextSectionInternal() {
    if (window.JCSenha.state.navigated) {
      console.log(`[${MOD}] Navegação já feita — ignorando`);
      return;
    }
    window.JCSenha.state.navigated = true;

    try {
      document.dispatchEvent(new CustomEvent('sectionCompleted', { detail: { sectionId: SECTION_ID } }));
    } catch (e) {
      console.warn(`[${MOD}] Falha ao despachar sectionCompleted`, e);
    }

    if (window.JC && typeof window.JC.goNext === 'function') {
      try {
        console.log(`[${MOD}] Navegando via JC.goNext()`);
        window.JC.goNext();
        return;
      } catch (e) {
        console.warn(`[${MOD}] Erro em JC.goNext`, e);
      }
    }

    if (typeof window.showSection === 'function') {
      try {
        console.log(`[${MOD}] Fallback interno: showSection('${NEXT_SECTION_ID}')`);
        window.showSection(NEXT_SECTION_ID);
      } catch (e) {
        console.error(`[${MOD}] showSection falhou`, e);
      }
    } else {
      console.warn(`[${MOD}] Sem JC.goNext/showSection disponíveis no momento`);
    }
  }

  function whenJCReady(timeoutMs = 2000) {
    return new Promise((resolve) => {
      if (window.JC && typeof window.JC.init === 'function') return resolve(true);
      let elapsed = 0;
      const step = 100;
      const t = setInterval(() => {
        elapsed += step;
        if (window.JC && typeof window.JC.init === 'function') {
          clearInterval(t);
          resolve(true);
        } else if (elapsed >= timeoutMs) {
          clearInterval(t);
          resolve(false);
        }
      }, step);
    });
  }

  // ------------------------------
  // Transição com vídeo (overlay, sem recarregar página)
  // ------------------------------
  function playTransitionThen(cb) {
    if (window.JCSenha.state.transitioning) {
      console.log(`[${MOD}] Já em transição — ignorando novo pedido`);
      return;
    }
    window.JCSenha.state.transitioning = true;

    const overlay = document.createElement('div');
    overlay.setAttribute('data-senha-overlay', 'true');
    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      background: 'black',
      display: 'grid',
      placeItems: 'center',
      zIndex: '999999'
    });

    const video = document.createElement('video');
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true; // se precisar som, mude para false (atenção ao autoplay)
    video.src = TRANSITION_SRC;
    video.style.maxWidth = '100%';
    video.style.maxHeight = '100%';

    const loader = document.createElement('div');
    loader.textContent = 'Carregando…';
    Object.assign(loader.style, {
      position: 'absolute',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      color: 'white',
      fontFamily: 'Cardo, serif',
      fontSize: '18px',
      opacity: '0.8'
    });

    // NÃO limpar body — evita reset e loops; apenas sobrepõe
    document.body.appendChild(overlay);
    overlay.appendChild(video);
    overlay.appendChild(loader);
    console.log(`[${MOD}] Overlay e vídeo adicionados ao DOM`);

    let done = false;
    function cleanup() {
      if (done) return;
      done = true;
      try { overlay.remove(); } catch {}
      window.JCSenha.state.transitioning = false;
    }

    function finish() {
      cleanup();
      try { cb && cb(); } catch (e) { console.error(`[${MOD}] Erro no callback pós-transição`, e); }
    }

    const timeout = setTimeout(() => {
      console.warn(`[${MOD}] Timeout da transição (${TRANSITION_TIMEOUT_MS}ms) — navegando internamente`);
      finish();
    }, TRANSITION_TIMEOUT_MS);

    video.addEventListener('ended', () => {
      console.log(`[${MOD}] Vídeo terminou — navegando internamente`);
      clearTimeout(timeout);
      finish();
    }, { once: true });

    video.addEventListener('error', () => {
      console.error(`[${MOD}] Erro ao reproduzir vídeo: ${TRANSITION_SRC} — navegando internamente`);
      clearTimeout(timeout);
      finish();
    }, { once: true });

    Promise.resolve().then(() => video.play?.()).catch(() => {
      console.warn(`[${MOD}] Falha ao iniciar play() — navegando internamente`);
      clearTimeout(timeout);
      finish();
    });
  }

  // ------------------------------
  // Preparação da seção (bindings idempotentes)
  // ------------------------------
  function prepare(root) {
    if (!root || window.JCSenha.state.prepared) return;
    window.JCSenha.state.prepared = true;

    console.log(`[${MOD}] Preparando seção…`);

    // reset typing dentro da seção
    $$('[data-typing="true"]', root).forEach(el => {
    el.classList.remove('typing-done');  // 🔁 permite rodar de novo
    if (!el.dataset.text && el.textContent) el.dataset.text = el.textContent.trim();
    el.textContent = '';                 // começa do zero
  });
    // Título/sub com TypingBridge (se marcado)
    ensureTyping($('#senha-title', root));
    ensureTyping($('#senha-sub', root));

    const input = getPasswordInput(root);
    const btnValidar = $('#btn-validar-senha', root);
    const btnPular   = $('#btn-skip-senha', root);
    const btnVoltar  = $('#btn-voltar-senha', root);
    const btnEye     = $('#btn-eye-senha', root);
    const msgErro    = $('#senha-error', root);

    function showError(text) {
      if (!msgErro) return;
      msgErro.textContent = text || 'Senha inválida.';
      msgErro.classList.remove(HIDE);
      setTimeout(() => msgErro.classList.add(HIDE), 2500);
    }

    // Voltar → Home
      if (btnVoltar) {
      btnVoltar.addEventListener('click', () => {
      if (window.JCSenha.state.transitioning) return;
      window.location.assign('/');
  });
}

    // Rebind seguro (evita listeners duplicados)
    [btnValidar, btnPular, btnVoltar, btnEye].forEach((btn) => {
      if (!btn) return;
      if (btn.__senhaBound) return;
      btn.__senhaBound = true;
    });

    // 👁️ Alternar visibilidade da senha (olho fora do input)
    if (btnEye && input) {
      btnEye.addEventListener('click', () => {
        const isPwd = input.type === 'password';
        input.type = isPwd ? 'text' : 'password';
        btnEye.setAttribute('aria-pressed', String(isPwd));
      });
    }

    // Validar / Avançar (tocar vídeo e navegar internamente ao final)
    if (btnValidar) {
      btnValidar.addEventListener('click', async () => {
        if (window.JCSenha.state.transitioning || window.JCSenha.state.navigated) return;
        const value = (input?.value || '').trim();
        if (!validatePassword(value)) {
          showError('Senha incorreta. Tente novamente.');
          try { input?.focus(); } catch {}
          return;
        }
        window.JCSenha.state.validated = true;
        await whenJCReady(2000);

        playTransitionThen(() => {
  console.log('[section-senha] Transição concluída — próxima seção');
  goNextSectionInternal();  // usa JC.goNext() ou showSection('section-guia')
});
});
}

    // Pular (sem validação; opcional do teu fluxo)
    if (btnPular) {
      btnPular.addEventListener('click', async () => {
        if (window.JCSenha.state.transitioning || window.JCSenha.state.navigated) return;
        await whenJCReady(1500);
        playTransitionThen(() => {
          console.log(`[${MOD}] Pulo com transição — seguindo para próxima seção`);
          goNextSectionInternal();
        });
      });
    }

    // Voltar (com textura de pedra; leva para HOME)
    if (btnVoltar) {
      btnVoltar.addEventListener('click', () => {
        if (window.JCSenha.state.transitioning) return;
        console.log(`[${MOD}] Voltar acionado — indo para Home`);
        try { window.location.assign(HOME_PAGE); } catch (e) {
          console.warn(`[${MOD}] Falha ao voltar para Home`, e);
        }
      });
    }
  }

  // ------------------------------
  // Eventos de ciclo de vida
  // ------------------------------
  document.addEventListener('sectionLoaded', (e) => {
    const detail = e.detail || {};
    if (detail.sectionId !== SECTION_ID || !detail.hasNode) return;
    const node = document.getElementById(SECTION_ID);
    console.log(`[${MOD}] sectionLoaded:`, detail);
    node && node.classList.remove(HIDE);
    prepare(node);
  });

  window.addEventListener('DOMContentLoaded', () => {
    const node = document.getElementById(SECTION_ID);
    if (node && !node.classList.contains(HIDE)) {
      console.log(`[${MOD}] DOMContentLoaded: preparando seção já visível`);
      prepare(node);
    }
  });
})();
