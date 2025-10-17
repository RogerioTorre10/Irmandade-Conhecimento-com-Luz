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

  async function waitForElement(selector, { within = document, timeout = 2000, step = 50 } = {}) {
    console.log('[JCSenha] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
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
        // Fallback para criar seção
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
      display: block;
      opacity: 1;
      visibility: visible;
      position: relative;
      z-index: 2;
      overflow-y: scroll;
      min-height: 80vh;
      height: 80vh;
      box-sizing: border-box;
    `;

    let instr1, instr2, instr3, instr4, senhaInput, toggleBtn, avancarBtn, prevBtn;
    try {
      console.log('[JCSenha] Buscando elementos...');
      instr1 = await waitForElement('#senha-instr1', { within: root, timeout: 2000 });
      instr2 = await waitForElement('#senha-instr2', { within: root, timeout: 2000 });
      instr3 = await waitForElement('#senha-instr3', { within: root, timeout: 2000 });
      instr4 = await waitForElement('#senha-instr4', { within: root, timeout: 2000 });
      senhaInput = await waitForElement('#senha-input', { within: root, timeout: 2000 });
      toggleBtn = await waitForElement('.btn-toggle-senha', { within: root, timeout: 2000 });
      avancarBtn = await waitForElement('#btn-senha-avancar', { within: root, timeout: 2000 });
      prevBtn = await waitForElement('#btn-senha-prev', { within: root, timeout: 2000 });
    } catch (e) {
      console.error('[JCSenha] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Senha.', 'error');
      // Fallback para criar elementos
      const createFallbackElement = (id, isButton = false, isInput = false) => {
        const el = document.createElement(isButton ? 'button' : isInput ? 'input' : 'div');
        el.id = id;
        if (!isButton && !isInput) {
          el.setAttribute('data-typing', 'true');
          el.textContent = `Placeholder para ${id}`;
        } else if (isButton) {
          el.classList.add('btn', 'btn-primary', 'btn-stone');
          el.setAttribute('data-action', id.includes('avancar') ? 'avancar' : id.includes('prev') ? 'senha-prev' : 'toggle-senha');
          el.textContent = id.includes('avancar') ? 'Acessar Jornada' : id.includes('prev') ? 'Voltar' : '👁️';
        } else if (isInput) {
          el.type = 'password';
          el.placeholder = 'Digite a Palavra-Chave';
        }
        root.appendChild(el);
        return el;
      };
      instr1 = instr1 || createFallbackElement('senha-instr1');
      instr2 = instr2 || createFallbackElement('senha-instr2');
      instr3 = instr3 || createFallbackElement('senha-instr3');
      instr4 = instr4 || createFallbackElement('senha-instr4');
      senhaInput = senhaInput || createFallbackElement('senha-input', false, true);
      toggleBtn = toggleBtn || createFallbackElement('btn-toggle-senha', true);
      avancarBtn = avancarBtn || createFallbackElement('btn-senha-avancar', true);
      prevBtn = prevBtn || createFallbackElement('btn-senha-prev', true);
      console.log('[JCSenha] Elementos criados como fallback');
    }

    console.log('[JCSenha] Elementos carregados:', { instr1, instr2, instr3, instr4, senhaInput, toggleBtn, avancarBtn, prevBtn });

    [instr1, instr2, instr3, instr4].forEach((el) => {
      if (el) {
        el.textContent = '';
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
        el.style.display = 'none';
        console.log('[JCSenha] Texto inicializado:', el.id, getText(el));
      }
    });

    [avancarBtn, prevBtn, toggleBtn].forEach(btn => {
      if (btn) {
        btn
