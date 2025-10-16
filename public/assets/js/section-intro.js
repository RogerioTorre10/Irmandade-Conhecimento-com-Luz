(function () {
  'use strict';

  // Namespace isolado da seção Intro
  window.JCIntro = window.JCIntro || {};

  // Evita reinicialização
  if (window.JCIntro.__bound) {
    console.log('[JCIntro] Já inicializado, ignorando...');
    return;
  }
  window.JCIntro.__bound = true;

  // Estado local da seção
  window.JCIntro.state = {
    INTRO_READY: false,
    LISTENER_ADDED: false
  };

  // Utilitários
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 10000, step = 50 } = {}) {
    console.log('[JCIntro] Aguardando elemento:', selector);
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) {
          console.log('[JCIntro] Elemento encontrado:', selector);
          return resolve(el);
        }
        if (performance.now() - start >= timeout) {
          console.error('[JCIntro] Timeout aguardando:', selector);
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

  // ============================================
  // Handler principal da seção Intro
  // ============================================
  const handler = async (evt) => {
    console.log('[JCIntro] Handler disparado:', evt?.detail);

    const { sectionId, node } = fromDetail(evt?.detail || {});
    if (sectionId !== 'section-intro') {
      console.log('[JCIntro] Ignorando, sectionId não é section-intro:', sectionId);
      return;
    }

    // Previne reentrada
    if (window.JCIntro.state.INTRO_READY || (node && node.dataset.introInitialized)) {
      console.log('[JCIntro] Já inicializado (INTRO_READY ou data-intro-initialized), ignorando...');
      return;
    }

    // Localiza ou cria root
    let root = node || document.getElementById('section-intro');
    if (!root) {
      console.log('[JCIntro] Tentando localizar #section-intro...');
      try {
        root = await waitForElement('#section-intro', {
          within: document.getElementById('jornada-content-wrapper') || document,
          timeout: 15000
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        console.error('[JCIntro] Section not found, criando fallback:', e);
        const wrapper = document.getElementById('jornada-content-wrapper') || document.body;
        root = document.createElement('section');
        root.id = 'section-intro';
        wrapper.appendChild(root);
        console.log('[JCIntro] Seção #section-intro criada como fallback');
      }
    }

    console.log('[JCIntro] Root encontrado:', root);
    root.dataset.introInitialized = 'true';
    root.classList.add('section-intro', 'intro-sandbox');

    // Busca elementos
    let p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn;
    try {
      console.log('[JCIntro] Buscando elementos...');
      p1_1 = await waitForElement('#intro-p1-1', { within: root, timeout: 15000 });
      p1_2 = await waitForElement('#intro-p1-2', { within: root, timeout: 15000 });
      p1_3 = await waitForElement('#intro-p1-3', { within: root, timeout: 15000 });
      p2_1 = await waitForElement('#intro-p2-1', { within: root, timeout: 15000 });
      p2_2 = await waitForElement('#intro-p2-2', { within: root, timeout: 15000 });
      avancarBtn = await waitForElement('#btn-avancar', { within: root, timeout: 15000 });
    } catch (e) {
      console.error('[JCIntro] Elements not found, criando fallbacks:', e);
      const createFallbackElement = (id) => {
        const el = document.createElement('div');
        el.id = id;
        el.setAttribute('data-typing', 'true');
        el.textContent = `Placeholder para ${id}`;
        root.appendChild(el);
        return el;
      };
      p1_1 = p1_1 || createFallbackElement('intro-p1-1');
      p1_2 = p1_2 || createFallbackElement('intro-p1-2');
      p1_3 = p1_3 || createFallbackElement('intro-p1-3');
      p2_1 = p2_1 || createFallbackElement('intro-p2-1');
      p2_2 = p2_2 || createFallbackElement('intro-p2-2');
      if (!avancarBtn) {
        avancarBtn = document.createElement('button');
        avancarBtn.id = 'btn-avancar';
        avancarBtn.textContent = 'Iniciar';
        root.appendChild(avancarBtn);
      }
      console.log('[JCIntro] Elementos criados como fallback');
    }

    console.log('[JCIntro] Elementos carregados:', { p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn });

    // Inicializa textos "ocultos" para a datilografia
    [p1_1, p1_2, p1_3, p2_1, p2_2].forEach(el => {
      if (!el) return;
      el.style.opacity = '0';
      el.style.visibility = 'hidden';
      el.style.display = 'none';
      console.log('[JCIntro] Texto inicializado:', el.id, el.textContent?.substring(0, 50));
    });

    // Botão Avançar (desabilitado até concluir a datilografia)
    if (avancarBtn) {
      avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
      avancarBtn.disabled = true;
      avancarBtn.style.opacity = '0.5';
      avancarBtn.style.cursor = 'not-allowed';
      avancarBtn.style.display = 'inline-block';
      avancarBtn.style.margin = '8px auto';
      avancarBtn.style.visibility = 'visible';
      avancarBtn.textContent = avancarBtn.textContent || 'Iniciar';
      console.log('[JCIntro] Botão inicializado:', avancarBtn.className, avancarBtn.textContent);
    }

    // Navegação: prioriza controller; senão evento neutro; por fim fallback de URL
    once(avancarBtn, 'click', () => {
      console.log('[JCIntro] Avançando para section-termos');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
        return;
      }
      // Evento neutro (permite orquestrador decidir)
      document
