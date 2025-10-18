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
    listenerAdded: false
  };

  // ✅ Efeito datilografia restaurado
  window.typeText = function (el, text, speed = 36, cursor = true) {
    return new Promise((resolve) => {
      let i = 0;
      el.textContent = '';
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i);
          i++;
          setTimeout(tick, speed);
        } else {
          el.classList.add('typing-done');
          resolve();
        }
      };
      tick();
    });
  };

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  async function applyTyping(el) {
    if (!el || el.dataset.typing !== 'true') return;
    const text = getText(el);
    el.removeAttribute('data-text'); // impede reescrita automática
    el.textContent = '';
    el.classList.remove('typing-done');
    el.classList.remove('typing-active');
    await new Promise(r => setTimeout(r, 300));
    if (typeof window.runTyping === 'function') {
      window.runTyping(el, text, () => {
        window.EffectCoordinator?.speak(text);
      }, { speed: 36, cursor: true });
    } else {
      el.textContent = text;
    }
  }

  const handler = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    const root = document.getElementById('section-senha');
    if (!root || root.dataset.senhaInitialized === 'true') return;

    console.log('[JCSenha] Root encontrado:', root);
    root.dataset.senhaInitialized = 'true';
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'flex';
    root.style.opacity = '1';
    root.style.visibility = 'visible';
    root.style.zIndex = '9999';

    // Localizar elementos
    let instr1 = root.querySelector('#senha-instr1');
    let instr2 = root.querySelector('#senha-instr2');
    let instr3 = root.querySelector('#senha-instr3');
    let instr4 = root.querySelector('#senha-instr4');
    let senhaInput = root.querySelector('#senha-input');
    let toggleBtn = root.querySelector('.btn-toggle-senha');
    let avancarBtn = root.querySelector('#btn-senha-avancar');
    let prevBtn = root.querySelector('#btn-senha-prev');

    // Aplicar datilografia com segurança
    const instrs = [instr1, instr2, instr3, instr4];
    for (const el of instrs) {
      applyTyping(el);
    }

    // Mostrar/ocultar senha
    toggleBtn?.addEventListener('click', () => {
      senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
    });

    // Navegação
    prevBtn?.addEventListener('click', () => {
      window.JC?.show('section-termos');
    });

    avancarBtn?.addEventListener('click', () => {
      const senha = senhaInput.value.trim();
      if (senha.length >= 3) {
        window.JC?.show('section-filme');
      } else {
        window.toast?.('Digite uma Palavra-Chave válida.', 'warning');
      }
    });

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] Seção senha inicializada com sucesso');
  };

  if (!window.JCSenha.state.listenerAdded) {
    document.addEventListener('section:shown', handler);
    window.JCSenha.state.listenerAdded = true;
  }
})();
