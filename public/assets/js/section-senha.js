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
    HANDLER_COUNT: 0,
    TYPING_COUNT: 0
  };

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  async function waitForElement(selector, { within = document, timeout = 10000, step = 50 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector) || document.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) return reject(new Error(`Timeout waiting for ${selector}`));
        setTimeout(tick, step);
      };
      tick();
    });
  }

  const handler = async (evt) => {
    const { sectionId } = evt?.detail || {};
    if (sectionId !== 'section-senha') return;

    window.JCSenha.state.HANDLER_COUNT++;
    if (window.JCSenha.state.ready) return;

    let root;
    try {
      root = await waitForElement('#section-senha', {
        within: document.getElementById('jornada-content-wrapper') || document
      });
    } catch (e) {
      console.error('[JCSenha] Seção não encontrada, criando fallback');
      root = document.createElement('section');
      root.id = 'section-senha';
      root.className = 'section parchment-wrap-rough';
      root.setAttribute('data-section', 'senha');
      document.getElementById('jornada-content-wrapper')?.appendChild(root);
    }

    root.dataset.senhaInitialized = 'true';
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');
    root.style.display = 'flex';
    root.style.opacity = '1';
    root.style.visibility = 'visible';

    const instrs = ['senha-instr1', 'senha-instr2', 'senha-instr3', 'senha-instr4']
      .map(id => root.querySelector(`#${id}`))
      .filter(el => el && el.dataset.typing === 'true');

    for (const el of instrs) {
      const text = getText(el);
      window.runTyping(el, text, () => {
        window.EffectCoordinator?.speak(text);
      }, { speed: 36, cursor: true });
    }

    let senhaInput = root.querySelector('#senha-input');
    let toggleBtn = root.querySelector('.btn-toggle-senha');
    let avancarBtn = root.querySelector('#btn-senha-avancar');
    let prevBtn = root.querySelector('#btn-senha-prev');

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

    toggleBtn.addEventListener('click', () => {
      senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
    });

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
