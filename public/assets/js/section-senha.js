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

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
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

    // Criar elementos se não existirem
    if (!senhaInput || !toggleBtn || !avancarBtn || !prevBtn) {
      const inputContainer = document.createElement('div');
      inputContainer.className = 'senha-input-group';
      inputContainer.id = 'senha-input-container';

      senhaInput = document.createElement('input');
      senhaInput.id = 'senha-input';
      senhaInput.type = 'password';
      senhaInput.placeholder = 'Digite a Palavra-Chave';

      toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn-toggle-senha';
      toggleBtn.textContent = '👁️';

      avancarBtn = document.createElement('button');
      avancarBtn.id = 'btn-senha-avancar';
      avancarBtn.className = 'btn btn-primary btn-stone';
      avancarBtn.textContent = 'Acessar Jornada';

      prevBtn = document.createElement('button');
      prevBtn.id = 'btn-senha-prev';
      prevBtn.className = 'btn btn-primary btn-stone';
      prevBtn.textContent = 'Voltar';

      inputContainer.appendChild(senhaInput);
      inputContainer.appendChild(toggleBtn);

      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'parchment-actions-rough';
      actionsContainer.appendChild(prevBtn);
      actionsContainer.appendChild(avancarBtn);

      const senhaWrap = root.querySelector('.senha-wrap') || root;
      senhaWrap.appendChild(inputContainer);
      senhaWrap.appendChild(actionsContainer);
    }

    // ✅ Forçar datilografia e leitura com delay
    const instrs = [instr1, instr2, instr3, instr4];
    for (const el of instrs) {
      if (el && el.dataset.typing === 'true') {
        const text = getText(el);
        el.classList.remove('typing-done');
        el.classList.remove('typing-active');
        el.textContent = '';
        setTimeout(() => {
          if (typeof window.runTyping === 'function') {
            window.runTyping(el, text, () => {
              window.EffectCoordinator?.speak(text);
            }, { speed: 36, cursor: true });
          } else {
            console.warn('[JCSenha] runTyping não disponível, fallback aplicado');
            el.textContent = text;
          }
        }, 100);
      }
    }

    // Mostrar/ocultar senha
    toggleBtn.addEventListener('click', () => {
      senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
    });

    // Navegação
    prevBtn.addEventListener('click', () => {
      window.JC?.show('section-termos');
    });

    avancarBtn.addEventListener('click', () => {
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
