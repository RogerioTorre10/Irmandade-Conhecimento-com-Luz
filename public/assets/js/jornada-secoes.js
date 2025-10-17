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
          while (el.parentElement && el.parentElement !== within && el.parentElement !== document.body) {
            console.log('[JCSenha] Verificando pai:', el.parentElement.tagName, el.parentElement.id);
            el.parentElement.style.cssText = `
              display: block !important;
              opacity: 1 !important;
              visibility: visible !important;
              transform: none !important;
              margin: 0 auto !important;
              width: 100% !important;
              position: static !important;
            `;
            el = el.parentElement;
          }
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

  // Injetar estilos globais
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    #section-senha, #section-senha *, #senha-text-container, #senha-text-container *, #senha-input-container, #senha-input-container *,
    #jornada-content-wrapper, #jornada-canvas, #jornada-canvas.pergaminho.pergaminho-v {
      opacity: 1 !important;
      visibility: visible !important;
      display: flex !important;
      position: static !important;
      transform: none !important;
      transition: none !important;
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 600px !important;
      overflow: hidden !important;
      pointer-events: none;
    }
    #senha-text-container > div {
      text-align: left !important;
      direction: ltr !important;
      display: block !important;
      pointer-events: none;
    }
    .hidden, [class*="hidden"], #jornada-content-wrapper.hidden, #jornada-canvas.hidden {
      display: flex !important;
      opacity: 1 !important;
      visibility: visible !important;
      transform: none !important;
      margin: 0 auto !important;
      width: 100% !important;
    }
    .chama-vela, .chama-vela *, .flame-corner, #chama-header {
      position: static !important;
      transform: none !important;
      margin: 0 !important;
      display: inline-block !important;
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

    console.log('[JCSenha] Root encontrado:', root, 'parent:', root.parentElement?.id || root.parentElement?.tagName);
    root.dataset.senhaInitialized = 'true';
    root.classList.add('section-senha');
    root.classList.remove('hidden');
    root.setAttribute('aria-hidden', 'false');

    // Aplicar estilos ao root
    root.style.cssText = `
      background: transparent;
      padding: 24px;
      border-radius: 12px;
      width: 100% !important;
      max-width: 600px !important;
      margin: 12px auto !important;
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
      transform: none !important;
      transition: none !important;
    `;

    let instr1, instr2, instr3, instr4, senhaInput, toggleBtn, avancarBtn, prevBtn, inputContainer, textContainer;
    let visibilityInterval, mutationObserver;
    try {
      console.log('[JCSenha] Buscando elementos...');
      textContainer = document.createElement('div');
      textContainer.id = 'senha-text-container';
      textContainer.style.cssText = `
        width: 100% !important;
        max-width: 600px !important;
        text-align: left !important;
        direction: ltr !important;
        overflow: hidden;
        box-sizing: border-box;
        opacity: 1 !important;
        visibility: visible !important;
        display: block !important;
        margin: 0 auto !important;
        transform: none !important;
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
        margin: 8px auto !important;
        width: 80% !important;
        max-width: 400px !important;
        overflow: hidden;
        box-sizing: border-box;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
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
        el.textContent = getText(el) || `Placeholder para ${el.id}`;
        el.setAttribute('data-typing', 'true');
        el.style.cssText = `
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
          text-align: left !important;
          direction: ltr !important;
          width: 100% !important;
          max-width: 600px !important;
          box-sizing: border-box;
          white-space: pre-wrap;
          overflow: hidden;
          pointer-events: none;
          cursor: default;
          transform: none !important;
          margin: 0 auto !important;
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
          margin: 8px !important;
          visibility: visible !important;
          pointer-events: none;
          overflow: hidden;
          transform: none !important;
        `;
        console.log('[JCSenha] Botão inicializado:', btn.className, btn.textContent);
      }
    });

    if (inputContainer) {
      inputContainer.style.cssText = `
        position: relative;
        display: block !important;
        margin: 8px auto !important;
        width: 80% !important;
        max-width: 400px !important;
        overflow: hidden;
        box-sizing: border-box;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
      `;
    }

    if (senhaInput) {
      senhaInput.type = 'password';
      senhaInput.placeholder = 'Digite a Palavra-Chave';
      senhaInput.style.cssText = `
        display: block !important;
        padding: 8px 40px 8px 8px;
        width: 100% !important;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: transparent;
        box-sizing: border-box;
        overflow: hidden;
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: none;
        cursor: default;
        transform: none !important;
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
        transform: translateY(-50%) !important;
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
        [avancarBtn, prevBtn, toggleBtn].forEach(btn => {
          if (btn && getComputedStyle(btn).opacity === '1' && getComputedStyle(btn).display !== 'none') {
            btn.disabled = false;
            btn.style.cursor = 'pointer';
            btn.style.pointerEvents = 'auto';
            btn.style.opacity = '1 !important';
            btn.style.visibility = 'visible !important';
            btn.style.display = 'inline-block !important';
          }
        });
        if (senhaInput && getComputedStyle(senhaInput).opacity === '1' && getComputedStyle(senhaInput).display !== 'none') {
          senhaInput.disabled = false;
          senhaInput.style.pointerEvents = 'auto';
          senhaInput.style.cursor = 'text';
          senhaInput.style.opacity = '1 !important';
          senhaInput.style.visibility = 'visible !important';
          senhaInput.style.display = 'block !important';
        }
        root.style.opacity = '1 !important';
        root.style.visibility = 'visible !important';
        root.style.display = 'flex !important';
        window.JCSenha.state.navigationLocked = false;
        return;
      }

      console.log('[JCSenha] Elementos encontrados:', Array.from(typingElements).map(el => el.id));

      if (typeof window.runTyping !== 'function') {
        console.warn('[JCSenha] window.runTyping não encontrado, usando fallback');
        window.runTyping = (el, text, resolve, options) => {
          let i = 0;
          const speed = options.speed || 100;
          const cursor = options.cursor !== 'false';
          el.style.position = 'relative';
          el.style.whiteSpace = 'pre-wrap';
          const type = () => {
            if (i < text.length) {
              el.textContent = text.substring(0, i + 1);
              if (cursor) {
                el.style.borderRight = '2px solid #fff';
              }
              i++;
              setTimeout(type, speed);
            } else {
              el.textContent = text;
              el.style.borderRight = 'none';
              resolve();
            }
          };
          type();
        };
      }

      for (const el of typingElements) {
        const text = getText(el);
        console.log('[JCSenha] Datilografando:', el.id, text.substring(0, 50));
        
        try {
          el.textContent = '';
          el.classList.add('typing-active', 'lumen-typing');
          el.style.color = '#fff';
          el.style.opacity = '1 !important';
          el.style.display = 'block !important';
          el.style.visibility = 'visible !important';
          await new Promise(resolve => window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 100),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          }));
          el.classList.add('typing-done');
          el.classList.remove('typing-active');
          el.style.opacity = '1 !important';
          el.style.visibility = 'visible !important';
          el.style.display = 'block !important';
          if (typeof window.EffectCoordinator?.speak === 'function') {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'pt-BR';
            utterance.rate = 1.1;
            utterance.pitch = 1.0;
            console.log('[JCSenha] TTS iniciado para:', el.id);
            window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
            utterance.onend = () => {
              console.log('[JCSenha] TTS concluído para:', el.id);
            };
          } else {
            console.warn('[JCSenha] window.EffectCoordinator.speak não encontrado');
          }
        } catch (err) {
          console.error('[JCSenha] Erro na datilografia para', el.id, err);
          el.textContent = text;
          el.classList.add('typing-done');
          el.style.opacity = '1 !important';
          el.style.visibility = 'visible !important';
          el.style.display = 'block !important';
        }
      }
      
      console.log('[JCSenha] Datilografia e TTS concluídos');
      [avancarBtn, prevBtn, toggleBtn].forEach(btn => {
        if (btn && getComputedStyle(btn).opacity === '1' && getComputedStyle(btn).display !== 'none') {
          btn.disabled = false;
          btn.style.cursor = 'pointer';
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1 !important';
          btn.style.visibility = 'visible !important';
          btn.style.display = 'inline-block !important';
        }
      });
      if (senhaInput && getComputedStyle(senhaInput).opacity === '1' && getComputedStyle(senhaInput).display !== 'none') {
        senhaInput.disabled = false;
        senhaInput.style.pointerEvents = 'auto';
        senhaInput.style.cursor = 'text';
        senhaInput.style.opacity = '1 !important';
        senhaInput.style.visibility = 'visible !important';
        senhaInput.style.display = 'block !important';
      }
      window.JCSenha.state.navigationLocked = false;
    };

    const blockAutoNavigation = (e) => {
      if (!e.isTrusted || window.JCSenha.state.navigationLocked) {
        console.log('[JCSenha] Navegação automática bloqueada:', e.type, e.target, e);
        e.preventDefault();
        e.stopPropagation();
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
      }
    };

    const forceVisibility = () => {
      const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
      wrapper.style.cssText = `
        display: flex !important;
        opacity: 1 !important;
        visibility: visible !important;
        transform: none !important;
        margin: 0 auto !important;
        width: 100% !important;
        max-width: 600px !important;
        position: static !important;
        overflow: hidden !important;
      `;
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.style.cssText = `
          display: flex !important;
          opacity: 1 !important;
          visibility: visible !important;
          transform: none !important;
          margin: 0 auto !important;
          width: 100% !important;
          max-width: 600px !important;
          position: static !important;
          overflow: hidden !important;
        `;
      }
      if (!root || !document.body.contains(root)) {
        console.warn('[JCSenha] Root não encontrado no DOM, recriando...');
        root = document.createElement('section');
        root.id = 'section-senha';
        root.dataset.senhaInitialized = 'true';
        root.classList.add('section-senha');
        root.classList.remove('hidden');
        root.setAttribute('aria-hidden', 'false');
        root.style.cssText = `
          background: transparent;
          padding: 24px;
          border-radius: 12px;
          width: 100% !important;
          max-width: 600px !important;
          margin: 12px auto !important;
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
          transform: none !important;
          transition: none !important;
        `;
        wrapper.appendChild(root);
        root.appendChild(textContainer);
        root.appendChild(inputContainer);
        root.appendChild(avancarBtn);
        root.appendChild(prevBtn);
      }
      root.style.cssText = `
        background: transparent;
        padding: 24px;
        border-radius: 12px;
        width: 100% !important;
        max-width: 600px !important;
        margin: 12px auto !important;
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
        transform: none !important;
        transition: none !important;
      `;
      [textContainer, inputContainer, instr1, instr2, instr3, instr4, senhaInput, toggleBtn, avancarBtn, prevBtn].forEach(el => {
        if (el) {
          el.style.cssText = el.style.cssText.replace(/transform:.*?;/g, 'transform: none !important;')
            .replace(/margin:.*?;/g, 'margin: 0 auto !important;')
            .replace(/width:.*?;/g, 'width: 100% !important;');
          el.style.opacity = '1 !important';
          el.style.visibility = 'visible !important';
          el.style.display = el.tagName === 'BUTTON' || el.tagName === 'INPUT' ? 'inline-block !important' : 'block !important';
          el.style.margin = el.tagName === 'BUTTON' ? '8px !important' : '0 auto !important';
          el.style.width = '100% !important';
          el.style.maxWidth = el.id === 'senha-input-container' ? '400px !important' : '600px !important';
          console.log('[JCSenha] Visibilidade forçada para:', el.id || el.className, 'opacity:', getComputedStyle(el).opacity, 'display:', getComputedStyle(el).display, 'transform:', getComputedStyle(el).transform, 'parent:', el.parentElement?.id || el.parentElement?.tagName);
        }
      });
      console.log('[JCSenha] Visibilidade forçada, root presente:', document.body.contains(root));
    };

    const observeVisibility = () => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
          console.log('[JCSenha] Mutação detectada:', {
            type: mutation.type,
            target: mutation.target.id || mutation.target.className || mutation.target.tagName,
            attributeName: mutation.attributeName,
            oldValue: mutation.oldValue,
            addedNodes: Array.from(mutation.addedNodes).map(n => n.id || n.className || n.tagName),
            removedNodes: Array.from(mutation.removedNodes).map(n => n.id || n.className || n.tagName)
          });
          if (mutation.type === 'attributes' && (mutation.target === root || root.contains(mutation.target) || mutation.target.id === 'jornada-content-wrapper' || mutation.target.id === 'jornada-canvas')) {
            if (['style', 'class', 'transform', 'margin', 'width', 'position'].includes(mutation.attributeName)) {
              console.log('[JCSenha] Estilo ou classe alterada em:', mutation.target.id || mutation.target.className, 'valor antigo:', mutation.oldValue);
              forceVisibility();
            }
          } else if (mutation.type === 'childList' && !document.body.contains(root)) {
            console.warn('[JCSenha] Root removido do DOM, recriando...');
            forceVisibility();
          }
        });
      });
      observer.observe(document.body, { attributes: true, childList: true, subtree: true, attributeOldValue: true });
      return observer;
    };

    // Bloquear updateCanvasBackground temporariamente
    const originalUpdateCanvasBackground = window.JSecoes?.updateCanvasBackground || (() => {});
    window.JSecoes = window.JSecoes || {};
    window.JSecoes.updateCanvasBackground = (sectionId) => {
      if (sectionId === 'section-senha') {
        console.log('[JCSenha] Bloqueando updateCanvasBackground para section-senha');
        return;
      }
      originalUpdateCanvasBackground(sectionId);
    };

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        console.log('[JCSenha] Clique no botão olho mágico');
        if (senhaInput.type === 'password') {
          senhaInput.type = 'text';
          toggleBtn.textContent = '🙈';
          console.log('[JCSenha] Senha visível');
        } else {
          senhaInput.type = 'password';
          toggleBtn.textContent = '👁️';
          console.log('[JCSenha] Senha oculta');
        }
      });
    }

    if (avancarBtn) {
      avancarBtn.addEventListener('click', async (e) => {
        if (e.isTrusted && !window.JCSenha.state.navigationLocked && window.JCSenha.state.ready) {
          speechSynthesis.cancel();
          const senha = senhaInput?.value?.trim() || '';
          console.log('[JCSenha] Enviando senha:', senha);
          if (typeof window.JC?.show === 'function') {
            window.JC.show('section-guia');
          } else {
            window.location.href = '/guia';
            console.warn('[JCSenha] Fallback navigation to /guia');
          }
        } else {
          console.log('[JCSenha] Clique simulado, seção não pronta ou navegação bloqueada, ignorado');
        }
      });
      avancarBtn.addEventListener('click', blockAutoNavigation, { capture: true });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', async (e) => {
        if (e.isTrusted && !window.JCSenha.state.navigationLocked) {
          speechSynthesis.cancel();
          console.log('[JCSenha] Redirecionando para site fora da jornada');
          window.location.href = '/';
        } else {
          console.log('[JCSenha] Clique simulado ou navegação bloqueada, ignorado');
        }
      });
      prevBtn.addEventListener('click', blockAutoNavigation, { capture: true });
    }

    window.addEventListener('sectionLoaded', blockAutoNavigation, { capture: true });
    window.addEventListener('section:shown', blockAutoNavigation, { capture: true });

    window.JCSenha.state.ready = false;
    console.log('[JCSenha] Iniciando runTypingChain...');
    try {
      mutationObserver = observeVisibility();
      visibilityInterval = setInterval(forceVisibility, 50);
      await runTypingChain();
      window.JCSenha.state.ready = true;
      console.log('[JCSenha] Inicialização concluída');
    } catch (err) {
      console.error('[JCSenha] Erro na datilografia:', err);
      textContainer.querySelectorAll('[data-typing="true"]').forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
      });
      [avancarBtn, prevBtn, toggleBtn].forEach(btn => {
        if (btn && getComputedStyle(btn).opacity === '1' && getComputedStyle(btn).display !== 'none') {
          btn.disabled = false;
          btn.style.cursor = 'pointer';
          btn.style.pointerEvents = 'auto';
          btn.style.opacity = '1 !important';
          btn.style.visibility = 'visible !important';
          btn.style.display = 'inline-block !important';
        }
      });
      if (senhaInput && getComputedStyle(senhaInput).opacity === '1' && getComputedStyle(senhaInput).display !== 'none') {
        senhaInput.disabled = false;
        senhaInput.style.pointerEvents = 'auto';
        senhaInput.style.cursor = 'text';
        senhaInput.style.opacity = '1 !important';
        senhaInput.style.visibility = 'visible !important';
        sanaInput.style.display = 'block !important';
      }
      window.JCSenha.state.navigationLocked = false;
    }

    console.log('[JCSenha] Elementos encontrados:', {
      instr1: !!instr1, instr1Id: instr1?.id,
      instr2: !!instr2, instr2Id: instr2?.id,
      instr3: !!instr3, instr3Id: instr3?.id,
      instr4: !!instr4, instr4Id: instr4?.id,
      textContainer: !!textContainer, textContainerId: textContainer?.id,
      inputContainer: !!inputContainer, inputContainerId: inputContainer?.id,
      senhaInput: !!senhaInput, senhaInputId: senhaInput?.id,
      toggleBtn: !!toggleBtn, toggleBtnAction: toggleBtn?.dataset?.action,
      avancarBtn: !!avancarBtn, avancarBtnAction: avancarBtn?.dataset?.action,
      prevBtn: !!prevBtn, prevBtnAction: prevBtn?.dataset?.action
    });
  };

  window.JCSenha.destroy = () => {
    console.log('[JCSenha] Destruindo seção senha');
    clearInterval(visibilityInterval);
    if (mutationObserver) mutationObserver.disconnect();
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
    }
    window.JCSenha.state.ready = false;
    window.JCSenha.state.listenerAdded = false;
    window.JCSenha.state.navigationLocked = true;
    window.JCSenha.state.HANDLER_COUNT = 0;
    window.JCSenha.state.TYPING_COUNT = 0;
    if (typeof window.EffectCoordinator?.stopAll === 'function') {
      window.EffectCoordinator.stopAll();
    }
    // Restaurar updateCanvasBackground
    if (window.JSecoes) {
      window.JSecoes.updateCanvasBackground = originalUpdateCanvasBackground;
    }
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

    const tryInitialize = (attempt = 1, maxAttempts = 15) => {
      setTimeout(() => {
        const visibleSenha = document.querySelector('#section-senha:not(.hidden)');
        if (visibleSenha && !window.JCSenha.state.ready && !visibleSenha.dataset.senhaInitialized) {
          console.log('[JCSenha] Seção visível encontrada, disparando handler');
          handler({ detail: { sectionId: 'section-senha', node: visibleSenha } });
        } else if (document.getElementById('section-senha') && !window.JCSenha.state.ready && !document.getElementById('section-senha').dataset.senhaInitialized) {
          console.log('[JCSenha] Forçando inicialização manual (tentativa ' + attempt + ')');
          handler({ detail: { sectionId: 'section-senha', node: document.getElementById('section-senha') } });
        } else if (attempt < maxAttempts) {
          console.log('[JCSenha] Nenhuma seção visível ou já inicializada, tentando novamente...');
          tryInitialize(attempt + 1, maxAttempts);
        } else {
          console.error('[JCSenha] Falha ao inicializar após ' + maxAttempts + ' tentativas');
          window.toast?.('Erro: Não foi possível inicializar a seção Senha.', 'error');
          console.log('[JCSenha] Evitando carregamento automático de section-termos');
        }
      }, 1000 * attempt);
    };

    tryInitialize();
  };

  if (document.readyState === 'loading') {
    console.log('[JCSenha] Aguardando DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    console.log('[JCSenha] DOM já carregado, chamando bind');
    bind();
  }
})();
