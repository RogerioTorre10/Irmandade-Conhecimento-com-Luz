(function () {
  'use strict';

  // Namespace para isolar a seção
  window.JCSenha = window.JCSenha || {};

  // Verificar inicialização
  if (window.JCSenha.__bound) {
    console.log('[JCSenha] Já inicializado, ignorando...');
    return;
  }
  window.JCSenha.__bound = true;

  // Estado da seção
  window.JCSenha.state = {
    ready: false,
    listenerAdded: false,
    navigationLocked: true,
    HANDLER_COUNT: 0,
    TYPING_COUNT: 0
  };

  // Funções utilitárias
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 5000, step = 50 } = {}) {
    console.log('[JCSenha] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(selector);
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

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  function fromDetail(detail = {}) {
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    const node = detail.node || detail.root || null;
    return { sectionId, node };
  }

  // Injetar estilos essenciais
  const styleSheet = document.createElement('style');
  styleSheet.id = 'jcsenha-styles';
  styleSheet.textContent = `
    #section-senha {
      max-height: 100vh;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
      display: none;
    }
    #section-senha.active {
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .senha-wrap, .parchment-inner-rough {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    #senha-text-container > div, #senha-instr1, #senha-instr2, #senha-instr3, #senha-instr4 {
      text-align: left;
      display: block;
      margin-bottom: 12px;
    }
    .typing-active {
      border-right: 2px solid #fff;
      white-space: pre-wrap;
      position: relative;
    }
    .typing-done {
      border-right: none;
    }
    .reading-highlight {
      background-color: #ffff99;
      transition: background-color 0.5s ease;
    }
    .senha-input-group {
      position: relative;
      width: 80%;
      max-width: 400px;
      margin: 16px auto;
    }
    #senha-input {
      width: 100%;
      padding: 8px 40px 8px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: transparent;
    }
    .btn-toggle-senha {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
    }
    .parchment-actions-rough {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 400px;
      margin-top: 16px;
    }
    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.3s;
    }
    .btn:not(:disabled) {
      opacity: 1;
      cursor: pointer;
    }
    .btn:disabled {
      cursor: default;
      pointer-events: none;
    }
  `;
  document.head.appendChild(styleSheet);

  // Handler principal
  const handler = async (evt) => {
    window.JCSenha.state.HANDLER_COUNT++;
    console.log(`[JCSenha] Handler disparado (${window.JCSenha.state.HANDLER_COUNT}x):`, evt?.detail);
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-senha') {
      console.log('[JCSenha] Ignorando, sectionId não é section-senha:', sectionId);
      return;
    }

    if (window.JCSenha.state.ready || (node && node.dataset.senhaInitialized)) {
      console.log('[JCSenha] Já inicializado (ready ou data-senha-initialized), ignorando...');
      return;
    }

    let root = node || document.getElementById('section-senha');
    if (!root) {
      console.log('[JCSenha] Criando seção como fallback');
      const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
      root = document.createElement('section');
      root.id = 'section-senha';
      root.className = 'section';
      wrapper.appendChild(root); // Adiciona sem limpar outras seções
    }

    console.log('[JCSenha] Root encontrado:', root);
    root.dataset.senhaInitialized = 'true';
    root.classList.add('section-senha');

    // Verifica se já existe conteúdo para evitar duplicatas
    if (root.querySelector('.senha-wrap')) {
      console.log('[JCSenha] Conteúdo já presente, limpando para evitar duplicatas');
      root.innerHTML = '';
    }

    // Constrói estrutura
    const senhaWrap = document.createElement('div');
    senhaWrap.className = 'senha-wrap';
    const textContainer = document.createElement('div');
    textContainer.id = 'senha-text-container';
    const inputContainer = document.createElement('div');
    inputContainer.className = 'senha-input-group';
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'parchment-actions-rough';

    // Elementos de texto com data-typing
    const instr1 = document.createElement('h2');
    instr1.id = 'senha-instr1';
    instr1.dataset.text = 'Bem-vindo à Jornada Essencial';
    const instr2 = document.createElement('p');
    instr2.id = 'senha-instr2';
    instr2.dataset.text = 'Digite a palavra-chave para acessar a jornada.';
    const instr3 = document.createElement('p');
    instr3.id = 'senha-instr3';
    instr3.dataset.text = 'Esta senha é um convite para a sua transformação.';
    const instr4 = document.createElement('p');
    instr4.id = 'senha-instr4';
    instr4.dataset.text = 'Prepare-se para uma experiência única!';

    // Input e toggle
    const senhaInput = document.createElement('input');
    senhaInput.id = 'senha-input';
    senhaInput.type = 'password';
    senhaInput.placeholder = 'Digite a Palavra-Chave';
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-toggle-senha';
    toggleBtn.textContent = '👁️';

    // Botões
    const avancarBtn = document.createElement('button');
    avancarBtn.id = 'btn-senha-avancar';
    avancarBtn.className = 'btn btn-primary';
    avancarBtn.textContent = 'Acessar Jornada';
    avancarBtn.disabled = true;
    const prevBtn = document.createElement('button');
    prevBtn.id = 'btn-senha-prev';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.textContent = 'Voltar';
    prevBtn.disabled = true;

    // Montagem
    [instr1, instr2, instr3, instr4].forEach(el => {
      el.setAttribute('data-typing', 'true');
      textContainer.appendChild(el);
    });
    inputContainer.appendChild(senhaInput);
    inputContainer.appendChild(toggleBtn);
    actionsContainer.appendChild(prevBtn);
    actionsContainer.appendChild(avancarBtn);
    senhaWrap.appendChild(textContainer);
    senhaWrap.appendChild(inputContainer);
    senhaWrap.appendChild(actionsContainer);
    root.appendChild(senhaWrap);

    // Atualiza fundo do canvas (respeitando jornada-secoes.js)
    window.JSecoes?.updateCanvasBackground('section-senha');

    // Atualiza aria-pergunta
    const aria = document.getElementById('aria-pergunta');
    if (aria) aria.textContent = 'Digite a palavra-chave para acessar a jornada.';

    // Efeitos
    const runReadingEffect = (el) => {
      if (!el) return;
      el.classList.add('reading-highlight');
      setTimeout(() => el.classList.remove('reading-highlight'), 2000);
      console.log('[JCSenha] Efeito de leitura aplicado:', el.id);
    };

    const runTypingChain = async () => {
      window.JCSenha.state.TYPING_COUNT++;
      console.log(`[JCSenha] Iniciando datilografia (${window.JCSenha.state.TYPING_COUNT}x)`);
      if (window.__typingLock) {
        await new Promise(resolve => {
          const check = () => window.__typingLock ? setTimeout(check, 100) : resolve();
          check();
        });
      }

      const typingElements = textContainer.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      if (!typingElements.length) {
        console.log('[JCSenha] Nenhum elemento para datilografia, habilitando controles');
        enableControls();
        return;
      }

      // Fallback para runTyping
      if (typeof window.runTyping !== 'function') {
        console.warn('[JCSenha] window.runTyping não encontrado, usando fallback');
        window.runTyping = (el, text, cb) => {
          el.textContent = '';
          let i = 0;
          const type = () => {
            if (i < text.length) {
              el.textContent += text[i++];
              el.classList.add('typing-active');
              setTimeout(type, 50);
            } else {
              el.classList.remove('typing-active');
              el.classList.add('typing-done');
              cb();
            }
          };
          type();
        };
      }

      for (const el of typingElements) {
        const text = getText(el);
        console.log('[JCSenha] Datilografando:', el.id, text.substring(0, 50));
        await new Promise(resolve => window.runTyping(el, text, () => {
          runReadingEffect(el);
          if (window.EffectCoordinator?.speak) {
            window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.1, pitch: 1.0 });
          }
          resolve();
        }));
      }

      console.log('[JCSenha] Datilografia concluída');
      enableControls();
    };

    const enableControls = () => {
      [avancarBtn, prevBtn, toggleBtn].forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      });
      senhaInput.disabled = false;
      window.JCSenha.state.navigationLocked = false;
      window.JCSenha.state.ready = true;
      console.log('[JCSenha] Controles habilitados');
    };

    // Eventos
    toggleBtn.addEventListener('click', () => {
      senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = senhaInput.type === 'password' ? '👁️' : '🙈';
      console.log('[JCSenha] Toggle senha:', senhaInput.type);
    });

    avancarBtn.addEventListener('click', async () => {
      if (!senhaInput.value.trim()) {
        window.toast?.('Digite a palavra-chave.', 'error');
        return;
      }
      console.log('[JCSenha] Avançando para section-guia');
      window.JC?.show('section-guia') || (window.location.href = '/guia');
    });

    prevBtn.addEventListener('click', () => {
      console.log('[JCSenha] Voltando para section-termos');
      window.JC?.show('section-termos') || (window.location.href = '/termos');
    });

    senhaInput.addEventListener('input', () => {
      avancarBtn.disabled = !senhaInput.value.trim();
      avancarBtn.style.opacity = senhaInput.value.trim() ? '1' : '0.5';
      avancarBtn.style.pointerEvents = senhaInput.value.trim() ? 'auto' : 'none';
    });

    // Inicializa
    root.classList.add('active'); // Garante visibilidade
    window.JC?.show('section-senha'); // Respeita a navegação do JC
    runTypingChain().catch(err => {
      console.error('[JCSenha] Erro na datilografia:', err);
      enableControls();
    });
  };

  // Destroy para limpeza
  window.JCSenha.destroy = () => {
    console.log('[JCSenha] Limpando estado');
    clearInterval(window.JCSenha.visibilityInterval);
    if (window.JCSenha.observer) window.JCSenha.observer.disconnect();
    const root = document.getElementById('section-senha');
    if (root) root.remove();
    document.querySelector('#jcsenha-styles')?.remove();
    window.JCSenha.state = { ready: false, listenerAdded: false, navigationLocked: true, HANDLER_COUNT: 0, TYPING_COUNT: 0 };
    window.JCSenha.__bound = false;
  };

  // Bind
  const bind = () => {
    console.log('[JCSenha] Executando bind');
    document.addEventListener('sectionLoaded', handler, { once: true });
    document.addEventListener('section:shown', handler, { once: true });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
