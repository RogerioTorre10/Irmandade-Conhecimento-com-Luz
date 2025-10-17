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
      console.log('[JCSenha] Tentando localizar #section-senha...');
      try {
        root = await waitForElement('#section-senha', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 10000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-senha não carregada.', 'error');
        console.error('[JCSenha] Section not found:', e);
        const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
        root = document.createElement('section');
        root.id = 'section-senha';
        wrapper.appendChild(root);
        console.log('[JCSenha] Seção #section-senha criada como fallback');
      }
    }

    console.log('[JCSenha] Root encontrado:', root);
    root.dataset.senhaInitialized = 'true';
    root.classList.add('section-senha');
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');

    // Aplicar estilos ao root
    root.style.cssText = `
      background: transparent;
      padding: 24px;
      border-radius: 12px;
      width: 100%;
      max-width: 600px;
      margin: 12px auto;
      text-align: center;
      box-shadow: none;
      border: none;
      display: flex !important;
      flex-direction: column;
      align-items: center;
      opacity: 1 !important;
      visibility: visible !important;
      position: static;
      z-index: 1000;
      overflow-y: hidden;
      overflow-x: hidden;
      max-height: 100vh;
      box-sizing: border-box;
      transition: none;
    `;

    let instr1, instr2, instr3, instr4, senhaInput, toggleBtn, avancarBtn, prevBtn, inputContainer, textContainer;
    let visibilityInterval, mutationObserver;
    try {
      console.log('[JCSenha] Buscando elementos...');
      textContainer = document.createElement('div');
      textContainer.id = 'senha-text-container';
      textContainer.style.cssText = `
        width: 100%;
        max-width: 600px;
        text-align: left !important;
        overflow: hidden;
        box-sizing: border-box;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
      `;
      root.appendChild(textContainer);

      instr1 = await waitForElement('#senha-instr1', { within: root, timeout: 5000 }) || document.createElement('div');
      instr1.id = 'senha-instr1';
      instr2 = await waitForElement('#senha-instr2', { within: root, timeout: 5000 }) || document.createElement('div');
      instr2.id = 'senha-instr2';
      instr3 = await waitForElement('#senha-instr3', { within: root, timeout: 5000 }) || document.createElement('div');
      instr3.id = 'senha-instr3';
      instr4 = await waitForElement('#senha-instr4', { within: root, timeout: 5000 }) || document.createElement('div');
      instr4.id = 'senha-instr4';

      inputContainer = document.createElement('div');
      inputContainer.id = 'senha-input-container';
      inputContainer.style.cssText = `
        position: relative;
        display: block !important;
        margin: 8px auto;
        width: 80%;
        max-width: 400px;
        overflow: hidden;
        box-sizing: border-box;
        opacity: 1 !important;
        visibility: visible !important;
      `;
      root.appendChild(inputContainer);

      senhaInput = await waitForElement('#senha-input', { within: inputContainer || root, timeout: 5000 }) || document.createElement('input');
      senhaInput.id = 'senha-input';
      toggleBtn = await waitForElement('.btn-toggle-senha', { within: inputContainer || root, timeout: 5000 }) || document.createElement('button');
      toggleBtn.className = 'btn-toggle-senha';
      avancarBtn = await waitForElement('#btn-senha-avancar', { within: root, timeout: 5000 }) || document.createElement('button');
      avancarBtn.id = 'btn-senha-avancar';
      prevBtn = await waitForElement('#btn-senha-prev', { within: root, timeout: 5000 }) || document.createElement('button');
      prevBtn.id = 'btn-senha-prev';

      textContainer.appendChild(instr1);
      textContainer.appendChild(instr2);
      textContainer.appendChild(instr3);
      textContainer.appendChild(instr4);
      inputContainer.appendChild(senhaInput);
      inputContainer.appendChild(toggleBtn);
      root.appendChild(avancarBtn);
      root.appendChild(prevBtn);
    } catch (e) {
      console.error('[JCSenha] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Senha.', 'error');
      const createFallbackElement = (id, isButton = false, isInput = false, isContainer = false) => {
        const el = document.createElement(isButton ? 'button' : isInput ? 'input' : 'div');
        el.id = id;
        if (!isButton && !isInput && !isContainer) {
          el.setAttribute('data-typing', 'true');
          el.textContent = `Placeholder para ${id}`;
        } else if (isButton) {
          el.classList.add('btn', 'btn-primary', 'btn-stone');
          el.setAttribute('data-action', id.includes('avancar') ? 'avancar' : id.includes('prev') ? 'senha-prev' : 'toggle-senha');
          el.textContent = id.includes('avancar') ? 'Acessar Jornada' : id.includes('prev') ? 'Voltar' : '👁️';
        } else if (isInput) {
          el.type = 'password';
          el.placeholder = 'Digite a Palavra-Chave';
        } else if (isContainer) {
          el.style.position = 'relative';
          el.id = id;
        }
        return el;
      };
      textContainer = textContainer || createFallbackElement('senha-text-container', false, false, true);
      instr1 = instr1 || createFallbackElement('senha-instr1');
      instr2 = instr2 || createFallbackElement('senha-instr2');
      instr3 = instr3 || createFallbackElement('senha-instr3');
      instr4 = instr4 || createFallbackElement('senha-instr4');
      inputContainer = inputContainer || createFallbackElement('senha-input-container', false, false, true);
      senhaInput = senhaInput || createFallbackElement('senha-input', false, true);
      toggleBtn = toggleBtn || createFallbackElement('btn-toggle-senha', true);
      avancarBtn = avancarBtn || createFallbackElement('btn-senha-avancar', true);
      prevBtn = prevBtn || createFallbackElement('btn-senha-prev', true);
      textContainer.appendChild(instr1);
      textContainer.appendChild(instr2);
      textContainer.appendChild(instr3);
      textContainer.appendChild(instr4);
      inputContainer.appendChild(senhaInput);
      inputContainer.appendChild(toggleBtn);
      root.appendChild(textContainer);
      root.appendChild(inputContainer);
      root.appendChild(avancarBtn);
      root.appendChild(prevBtn);
      console.log('[JCSenha] Elementos criados como fallback');
    }

    console.log('[JCSenha] Elementos carregados:', { instr1, instr2, instr3, instr4, textContainer, inputContainer, senhaInput, toggleBtn, avancarBtn, prevBtn });

    [instr1, instr2, instr3, instr4].forEach((el) => {
      if (el) {
        el.textContent = '';
        el.setAttribute('data-typing', 'true');
        el.style.cssText = `
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
          text-align: left !important;
          width: 100%;
          max-width: 600px;
          box-sizing: border-box;
          white-space: pre-wrap;
          overflow: hidden;
          pointer-events: none;
          cursor: default;
        `;
        console.log('[JCSenha] Texto inicializado:', el.id, getText(el));
      }
    });

    [avancarBtn, prevBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = true;
        btn.style.cssText = `
          opacity: 1 !important;
          cursor: default;
          display: inline-block !important;
          margin: 8px;
          visibility: visible !important;
          pointer-events: none;
          overflow: hidden;
        `;
        console.log('[JCSenha] Botão inicializado:', btn.className, btn.textContent);
      }
    });

    if (inputContainer) {
      inputContainer.style.cssText = `
        position: relative;
        display: block !important;
        margin: 8px auto;
        width: 80%;
        max-width: 400px;
        overflow: hidden;
        box-sizing: border-box;
        opacity: 1 !important;
        visibility: visible !important;
      `;
    }

    if (senhaInput) {
      senhaInput.type = 'password';
      senhaInput.placeholder = 'Digite a Palavra-Chave';
      senhaInput.style.cssText = `
        display: block !important;
        padding: 8px 40px 8px 8px;
        width: 100%;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: transparent;
        box-sizing: border-box;
        overflow: hidden;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: none;
        cursor: default;
      `;
      senhaInput.disabled = true;
      console.log('[JCSenha] Input inicializado:', senhaInput.id);
    }

    if (toggleBtn) {
      toggleBtn.classList.add('btn', 'btn-primary', 'btn-stone');
      toggleBtn.disabled = true;
      toggleBtn.style.cssText = `
        opacity: 1 !important;
        cursor: default;
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: transparent;
        padding: 0;
        font-size: 16px;
        line-height: 1;
        visibility: visible !important;
        pointer-events: none;
        overflow: hidden;
      `;
      toggleBtn.textContent = '👁️';
      console.log('[JCSenha] Toggle botão inicializado:', toggleBtn.className);
    }

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
        [avancarBtn
