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

  // Injetar estilos isolados
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
      flex-direction: column;
      align-items: center;
      text-align: left;
      direction: ltr;
    }
    #section-senha.active {
      display: flex;
    }
    #section-senha .senha-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    #section-senha .parchment-rough,
    #section-senha .parchment-inner-rough {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    #section-senha #senha-text-container > div,
    #section-senha #senha-instr1,
    #section-senha #senha-instr2,
    #section-senha #senha-instr3,
    #section-senha #senha-instr4 {
      text-align: left;
      direction: ltr;
      display: block;
      margin-bottom: 12px;
      color: #fff;
    }
    #section-senha .typing-active {
      border-right: 2px solid #fff;
      white-space: pre-wrap;
      position: relative;
    }
    #section-senha .typing-done {
      border-right: none;
    }
    #section-senha .senha-input-group {
      position: relative;
      width: 80%;
      max-width: 400px;
      margin: 16px auto;
    }
    #section-senha #senha-input {
      width: 100%;
      padding: 8px 40px 8px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: transparent;
    }
    #section-senha .btn-toggle-senha {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
    }
    #section-senha .parchment-actions-rough {
      display: flex;
      justify-content: space-between;
      width: 100%;
      max-width: 400px;
      margin-top: 16px;
    }
    #section-senha .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      opacity: 0.5;
      transition: opacity 0.3s;
    }
    #section-senha .btn:not(:disabled) {
      opacity: 1;
    }
    #section-senha .btn:disabled {
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

    let root;
    try {
      root = node || await waitForElement('#section-senha', {
        within: document.getElementById('jornada-content-wrapper') || document,
        timeout: 10000
      });
    } catch (e) {
      console.log('[JCSenha] Criando #section-senha como fallback');
      const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
      root = document.createElement('section');
      root.id = 'section-senha';
      root.className = 'section parchment-wrap-rough';
      root.setAttribute('data-section', 'senha');
      wrapper.appendChild(root);
    }

    console.log('[JCSenha] Root encontrado:', root, 'parent:', root.parentElement?.id || root.parentElement?.tagName);
    root.dataset.senhaInitialized = 'true';
    root.classList.add('section-senha', 'parchment-wrap-rough');
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');

    // Verificar se já existe conteúdo para evitar duplicatas
    if (root.querySelector('.senha-wrap')) {
      console.log('[JCSenha] Conteúdo já presente, limpando para evitar duplicatas');
      root.innerHTML = '';
    }

    // Criar estrutura HTML
    const parchmentRough = document.createElement('div');
    parchmentRough.className = 'parchment-rough pergaminho pergaminho-v';
    const parchmentInnerRough = document.createElement('div');
    parchmentInnerRough.className = 'parchment-inner-rough';
    const senhaWrap = document.createElement('div');
    senhaWrap.className = 'senha-wrap';
    const textContainer = document.createElement('div');
    textContainer.id = 'senha-text-container';

    const instr1 = document.createElement('h2');
    instr1.id = 'senha-instr1';
    instr1.className = 'parchment-title-rough';
    instr1.dataset.text = 'Bem-vindo à Jornada Essencial';
    const instr2 = document.createElement('p');
    instr2.id = 'senha-instr2';
    instr2.className = 'parchment-text-rough';
    instr2.dataset.text = 'Digite a palavra-chave para acessar a jornada.';
    const instr3 = document.createElement('p');
    instr3.id = 'senha-instr3';
    instr3.className = 'parchment-text-rough';
    instr3.dataset.text = 'Esta senha é um convite para a sua transformação.';
    const instr4 = document.createElement('p');
    instr4.id = 'senha-instr4';
    instr4.className = 'parchment-text-rough';
    instr4.dataset.text = 'Prepare-se para uma experiência única!';

    const inputContainer = document.createElement('div');
    inputContainer.className = 'senha-input-group';
    inputContainer.id = 'senha-input-container';
    const senhaInput = document.createElement('input');
    senhaInput.id = 'senha-input';
    senhaInput.type = 'password';
    senhaInput.placeholder = 'Digite a Palavra-Chave';
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'btn-toggle-senha';
    toggleBtn.textContent = '👁️';
    const avancarBtn = document.createElement('button');
    avancarBtn.id = 'btn-senha-avancar';
    avancarBtn.className = 'btn btn-primary btn-stone';
    avancarBtn.textContent = 'Acessar Jornada';
    avancarBtn.disabled = true;
    const prevBtn = document.createElement('button');
    prevBtn.id = 'btn-senha-prev';
    prevBtn.className = 'btn btn-primary btn-stone';
    prevBtn.textContent = 'Voltar';
    prevBtn.disabled = true;
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'parchment-actions-rough';

    root.appendChild(parchmentRough);
    parchmentRough.appendChild(parchmentInnerRough);
    parchmentInnerRough.appendChild(senhaWrap);
    senhaWrap.appendChild(textContainer);
    textContainer.appendChild(instr1);
    textContainer.appendChild(instr2);
    textContainer.appendChild(instr3);
    textContainer.appendChild(instr4);
    senhaWrap.appendChild(inputContainer);
    inputContainer.appendChild(senhaInput);
    inputContainer.appendChild(toggleBtn);
    actionsContainer.appendChild(prevBtn);
    actionsContainer.appendChild(avancarBtn);
    senhaWrap.appendChild(actionsContainer);

    // Atualiza fundo do canvas
    window.JSecoes?.updateCanvasBackground('section-senha');

    // Atualiza aria-pergunta
    const aria = document.getElementById('aria-pergunta');
    if (aria) aria.textContent = 'Digite a palavra-chave para acessar a jornada.';

    // Função de datilografia local
    const runTyping = (el, text, resolve, options) => {
      let i = 0;
      const speed = options.speed || 100;
      const cursor = options.cursor !== 'false';
      el.style.position = 'relative';
      el.style.whiteSpace = 'pre-wrap';
      el.style.textAlign = 'left';
      el.style.direction = 'ltr';
      el.textContent = '';
      const type = () => {
        if (i < text.length) {
          el.textContent = text.substring(0, i + 1);
          if (cursor) {
            el.style.borderRight = '2px solid #fff';
          }
          el.classList.add('typing-active');
          i++;
          setTimeout(type, speed);
        } else {
          el.textContent = text;
          el.style.borderRight = 'none';
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
          resolve();
        }
      };
      type();
    };

    // Função de datilografia
    const runTypingChain = async () => {
      window.JCSenha.state.TYPING_COUNT++;
      console.log(`[JCSenha] runTypingChain chamado (${window.JCSenha.state.TYPING_COUNT}x)`);
      if (window.__typingLock) {
        console.log('[JCSenha] Typing lock ativo, aguardando...');
        await new Promise(resolve => {
          const checkLock = () => {
            if (!window.__typingLock) {
              console.log('[JCSenha] Lock liberado, prosseguindo...');
              resolve();
            } else {
              setTimeout(checkLock, 100);
            }
          };
          checkLock();
        });
      }

      console.log('[JCSenha] Iniciando datilografia...');
      const typingElements = textContainer.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      if (!typingElements.length) {
        console.warn('[JCSenha] Nenhum elemento com data-typing="true" encontrado');
        enableControls();
        return;
      }

      console.log('[JCSenha] Elementos encontrados:', Array.from(typingElements).map(el => el.id));

      for (const el of typingElements) {
        const text = getText(el);
        console.log('[JCSenha] Datilografando:', el.id, text.substring(0, 50));
        try {
          await new Promise(resolve => runTyping(el, text, resolve, {
            speed: 100,
            cursor: true
          }));
        } catch (err) {
          console.error('[JCSenha] Erro na datilografia para', el.id, err);
          el.textContent = text;
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
        }
      }

      console.log('[JCSenha] Datilografia concluída');
      enableControls();
    };

    // Habilitar controles após datilografia
    const enableControls = () => {
      [avancarBtn, prevBtn, toggleBtn].forEach(btn => {
        btn.disabled = false;
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
        btn.style.opacity = '1';
        btn.style.visibility = 'visible';
        btn.style.display = 'inline-block';
      });
      senhaInput.disabled = false;
      senhaInput.style.pointerEvents = 'auto';
      senhaInput.style.cursor = 'text';
      senhaInput.style.opacity = '1';
      senhaInput.style.visibility = 'visible';
      senhaInput.style.display = 'block';
      window.JCSenha.state.navigationLocked = false;
      window.JCSenha.state.ready = true;
      console.log('[JCSenha] Controles habilitados');
    };

    const blockAutoNavigation = (e) => {
      if (!e.isTrusted) {
        console.log('[JCSenha] Navegação automática bloqueada (não confiável):', e.type, e.target, e);
        e.preventDefault();
        e.stopPropagation();
      }
      if (typeof window.JC?.show === 'function') {
        const originalShow = window.JC.show;
        window.JC.show = (...args) => {
          if (window.JCSenha.state.navigationLocked) {
            console.log('[JCSenha] window.JC.show bloqueado:', args);
            return;
          }
          originalShow(...args);
        };
      }
      if (typeof window.carregarEtapa === 'function') {
        const originalCarregarEtapa = window.carregarEtapa;
        window.carregarEtapa = (...args) => {
          if (window.JCSenha.state.navigationLocked) {
            console.log('[JCSenha] window.carregarEtapa bloqueado:', args);
            return;
          }
          originalCarregarEtapa(...args);
        };
      }
    };

    // Bloquear updateCanvasBackground
    const originalUpdateCanvasBackground = window.JSecoes?.updateCanvasBackground || (() => {});
    window.JSecoes = window.JSecoes || {};
    window.JSecoes.updateCanvasBackground = (sectionId) => {
      if (sectionId === 'section-senha') {
        console.log('[JCSenha] Bloqueando updateCanvasBackground para section-senha');
        return;
      }
      originalUpdateCanvasBackground(sectionId);
    };

    // Remover toggleSenha do jornada-secoes.js
    if (window.JSecoes && window.JSecoes.toggleSenha) {
      console.log('[JCSenha] Removendo toggleSenha do jornada-secoes.js para evitar conflitos');
      window.JSecoes.toggleSenha = () => {
        console.log('[JCSenha] toggleSenha do jornada-secoes.js bloqueado, usando section-senha.js');
      };
    }

    // Eventos de navegação
    toggleBtn.addEventListener('click', () => {
      console.log('[JCSenha] Clique no botão olho mágico');
      senhaInput.type = senhaInput.type === 'password' ? 'text' : 'password';
      toggleBtn.textContent = senhaInput.type === 'password' ? '👁️' : '🙈';
      console.log('[JCSenha] Senha:', senhaInput.type === 'password' ? 'oculta' : 'visível');
    });

    avancarBtn.addEventListener('click', async (e) => {
      if (e.isTrusted && !window.JCSenha.state.navigationLocked && window.JCSenha.state.ready) {
        const senha = senhaInput?.value?.trim() || '';
        console.log('[JCSenha] Enviando senha:', senha);
        if (senha) {
          if (typeof window.JC?.show === 'function') {
            window.JC.show('section-guia');
          } else {
            window.location.href = '/guia';
            console.warn('[JCSenha] Fallback navigation to /guia');
          }
        } else {
          window.toast?.('Por favor, digite a palavra-chave.', 'error');
        }
      } else {
        console.log('[JCSenha] Clique simulado, seção não pronta ou navegação bloqueada, ignorado');
      }
    });

    prevBtn.addEventListener('click', async (e) => {
      if (e.isTrusted && !window.JCSenha.state.navigationLocked) {
        console.log('[JCSenha] Redirecionando para section-termos');
        if (typeof window.JC?.show === 'function') {
          window.JC.show('section-termos');
        } else {
          window.location.href = '/termos';
          console.warn('[JCSenha] Fallback navigation to /termos');
        }
      } else {
        console.log('[JCSenha] Clique simulado ou navegação bloqueada, ignorado');
      }
    });

    senhaInput.addEventListener('input', () => {
      avancarBtn.disabled = !senhaInput.value.trim();
      avancarBtn.style.cursor = senhaInput.value.trim() ? 'pointer' : 'default';
      avancarBtn.style.pointerEvents = seno
      console.log('[JCSenha] Input atualizado:', { senha: senhaInput.value.trim(), avancarBtnDisabled: avancarBtn.disabled });
    });

    window.addEventListener('sectionLoaded', blockAutoNavigation, { capture: true });
    window.addEventListener('section:shown', blockAutoNavigation, { capture: true });

    // Inicializa datilografia
    window.JCSenha.state.ready = false;
    try {
      root.classList.add('active');
      window.JC?.show('section-senha');
      await runTypingChain();
      console.log('[JCSenha] Inicialização concluída');
    } catch (err) {
      console.error('[JCSenha] Erro na inicialização:', err);
      enableControls();
    }
  };

  window.JCSenha.destroy = () => {
    console.log('[JCSenha] Destruindo seção senha');
    clearInterval(window.JCSenha.visibilityInterval);
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    window.removeEventListener('sectionLoaded', blockAutoNavigation, { capture: true });
    window.removeEventListener('section:shown', blockAutoNavigation, { capture: true });
    if (styleSheet) styleSheet.remove();
    const root = document.getElementById('section-senha');
    if (root) {
      root.dataset.senhaInitialized = '';
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.classList.remove('typing-active', 'typing-done', 'lumen-typing');
      });
      root.remove();
    }
    window.JCSenha.state.ready = false;
    window.JCSenha.state.listenerAdded = false;
    window.JCSenha.state.navigationLocked = true;
    window.JCSenha.state.HANDLER_COUNT = 0;
    window.JCSenha.state.TYPING_COUNT = 0;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
    if (window.JSecoes) {
      window.JSecoes.updateCanvasBackground = originalUpdateCanvasBackground;
    }
    window.JCSenha.__bound = false;
  };

  if (!window.JCSenha.state.listenerAdded) {
    console.log('[JCSenha] Registrando listener para sectionLoaded');
    window.addEventListener('sectionLoaded', handler, { once: true });
    window.JCSenha.state.listenerAdded = true;
  }

  const bind = () => {
    console.log('[JCSenha] Executando bind');
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true, once: true });
  };

  if (document.readyState === 'loading') {
    console.log('[JCSenha] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCSenha] DOM já carregado, chamando bind');
    bind();
  }
})();
