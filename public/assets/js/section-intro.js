(function () {
  'use strict';

  if (window.__introBound) return;
  window.__introBound = true;

  let INTRO_READY = false;
  let nomeDigitado = false;
  let dadosGuiaCarregados = false;

  const once = (el, ev, fn) => {
    if (!el) {
      console.warn('[section-intro.js] Elemento para evento não encontrado:', ev);
      return;
    }
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  function waitForElement(selector, { within = document, timeout = 10000 } = {}) {
    return new Promise((resolve, reject) => {
      let el = within.querySelector(selector);
      if (el) {
        console.log(`[waitForElement] Elemento ${selector} encontrado imediatamente`);
        return resolve(el);
      }

      const observer = new MutationObserver((mutations, obs) => {
        el = within.querySelector(selector);
        if (el) {
          console.log(`[waitForElement] Elemento ${selector} encontrado após mutação`);
          obs.disconnect();
          resolve(el);
        }
      });

      observer.observe(within, {
        childList: true,
        subtree: true,
        attributes: false
      });

      setTimeout(() => {
        observer.disconnect();
        const fallbackEl = document.querySelector(`#jornada-content-wrapper ${selector}`);
        if (fallbackEl) {
          console.log(`[waitForElement] Elemento ${selector} encontrado via fallback global`);
          resolve(fallbackEl);
        } else {
          console.error(`[waitForElement] Timeout após ${timeout}ms para ${selector}`);
          reject(new Error(`timeout waiting ${selector}`));
        }
      }, timeout);
    });
  }

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  function fromDetail(detail = {}) {
    const sectionId = detail.sectionId || detail.id || window.__currentSectionId;
    const node = detail.node || detail.root || null;
    const name = detail.name || null;
    return { sectionId, node, name };
  }

  const checkReady = (btn) => {
    console.log('[checkReady] Verificando estado:', { nomeDigitado, dadosGuiaCarregados });
    btn.disabled = false; // Debug: sempre habilita
    btn.classList.remove('disabled-temp');
    console.log('[Guia Setup] Botão "Iniciar" ativado (debug mode).');
    // Descomente para lógica original
    /*
    if (nomeDigitado && dadosGuiaCarregados) {
      btn.disabled = false;
      btn.classList.remove('disabled-temp');
      console.log('[Guia Setup] Botão "Iniciar" ativado.');
    } else {
      btn.disabled = true;
      btn.classList.add('disabled-temp');
    }
    */
  };

  async function loadAndSetupGuia(root, btn) {
    const nameInput = root.querySelector('#name-input');
    const guiaPlaceholder = root.querySelector('#guia-selfie-placeholder');

    console.log('[loadAndSetupGuia] Elementos:', { nameInput: !!nameInput, guiaPlaceholder: !!guiaPlaceholder });

    if (nameInput) {
      nameInput.addEventListener('input', () => {
        nomeDigitado = nameInput.value.trim().length > 2;
        console.log('[loadAndSetupGuia] Nome digitado:', nameInput.value, 'nomeDigitado:', nomeDigitado);
        checkReady(btn);
      });
      nomeDigitado = nameInput.value.trim().length > 2;
      console.log('[loadAndSetupGuia] Estado inicial do nome:', nameInput.value, 'nomeDigitado:', nomeDigitado);
    } else {
      console.warn('[loadAndSetupGuia] #name-input não encontrado');
    }

    try {
      console.log('[Guia Setup] Iniciando fetch para dados dos guias...');
      const response = await fetch('/assets/data/guias.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - Verifique o caminho '/assets/data/guias.json'`);
      }
      const guias = await response.json();
      console.log('[Guia Setup] Dados dos guias carregados com sucesso:', guias.length);

      if (guiaPlaceholder && guias.length > 0) {
        if (typeof window.JornadaGuiaSelfie?.renderSelector === 'function') {
          window.JornadaGuiaSelfie.renderSelector(guiaPlaceholder, guias);
          document.addEventListener('guiaSelected', (e) => {
            console.log('[Intro] Guia selecionado. Verificando se pode avançar.');
            dadosGuiaCarregados = true;
            checkReady(btn);
          }, { once: true });
          dadosGuiaCarregados = false;
          console.log('[loadAndSetupGuia] Aguardando evento guiaSelected');
        } else {
          console.warn('[Guia Setup] Função de renderização do guia não encontrada. Avance sem seleção.');
          dadosGuiaCarregados = true;
          checkReady(btn);
        }
      } else {
        console.warn('[loadAndSetupGuia] Nenhum guia disponível ou placeholder ausente. Prosseguindo.');
        dadosGuiaCarregados = true;
        checkReady(btn);
      }
    } catch (err) {
      console.error('[Guia Setup] Falha crítica no fetch dos guias. Verifique a URL e o JSON:', err);
      window.toast?.('Falha ao carregar dados dos guias. Tente recarregar a página.', 'error');
      dadosGuiaCarregados = true;
      checkReady(btn);
    }
  }

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-intro.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-intro') return;

    console.log('[section-intro.js] Ativando intro');

    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForElement('#section-intro', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 10000 });
        console.log('[section-intro.js] Root encontrado via waitForElement:', root.outerHTML.slice(0, 200) + '...');
      } catch (e) {
        console.error('[section-intro.js] Root da intro não encontrado:', e);
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        return;
      }
    }

    let el1, el2, btn;
    try {
      el1 = await waitForElement('#intro-p1', { within: root, timeout: 5000 });
      el2 = await waitForElement('#intro-p2', { within: root, timeout: 5000 });
      btn = await waitForElement('#btn-avancar', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[section-intro.js] Falha ao esperar pelos elementos essenciais:', e);
      window.toast?.('Falha ao carregar a Introdução. Usando fallback.', 'error');
      // Fallback corrigido para evitar TypeError
      el1 = root.querySelector('#intro-p1');
      if (!el1) {
        el1 = document.createElement('div');
        el1.id = 'intro-p1';
        el1.className = 'intro-paragraph';
        el1.textContent = 'Bem-vindo à Jornada Conhecimento com Luz.';
        el1.setAttribute('data-typing', '');
        el1.setAttribute('data-speed', '36');
        el1.setAttribute('data-cursor', 'true');
        root.appendChild(el1);
      }
      el2 = root.querySelector('#intro-p2');
      if (!el2) {
        el2 = document.createElement('div');
        el2.id = 'intro-p2';
        el2.className = 'intro-paragraph';
        el2.textContent = 'Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.';
        el2.setAttribute('data-typing', '');
        el2.setAttribute('data-speed', '36');
        el2.setAttribute('data-cursor', 'true');
        root.appendChild(el2);
      }
      btn = root.querySelector('#btn-avancar');
      if (!btn) {
        btn = document.createElement('button');
        btn.id = 'btn-avancar';
        btn.className = 'btn btn-primary';
        btn.textContent = 'Iniciar';
        root.appendChild(btn);
      }
    }

    console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });

    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-intro');
      } else if (typeof window.showSection === 'function') {
        window.showSection('section-intro');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'flex';
      }
    } catch (err) {
      console.warn('[section-intro.js] Falha ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'flex';
    }

    btn.classList.add('hidden');
    btn.disabled = true;
    const showBtn = () => {
      console.log('[section-intro.js] Mostrando botão (aguardando dados/nome)');
      btn.classList.remove('hidden');
      btn.classList.add('btn');
      checkReady(btn);
    };

    const speed1 = Number(el1.dataset.speed || 36);
    const speed2 = Number(el2.dataset.speed || 36);
    const t1 = getText(el1);
    const t2 = getText(el2);
    const cursor1 = String(el1.dataset.cursor || 'true') === 'true';
    const cursor2 = String(el2.dataset.cursor || 'true') === 'true';

    if (INTRO_READY) {
      console.log('[section-intro.js] Intro já preparada');
      showBtn();
      loadAndSetupGuia(root, btn);
      return;
    }

    window.EffectCoordinator?.stopAll?.();

    const runTypingChain = async () => {
      console.log('[section-intro.js] Iniciando runTypingChain');
      if (typeof window.runTyping === 'function') {
        try {
          await new Promise((resolve) => {
            window.runTyping(el1, t1, resolve, { speed: speed1, cursor: cursor1 });
          });
          console.log('[section-intro.js] Typing concluído para intro-p1');
          window.EffectCoordinator?.speak?.(t1, { rate: 1.06 });

          await new Promise((resolve) => {
            window.runTyping(el2, t2, resolve, { speed: speed2, cursor: cursor2 });
          });
          console.log('[section-intro.js] Typing concluído para intro-p2');
          setTimeout(() => window.EffectCoordinator?.speak?.(t2, { rate: 1.05 }), 300);
        } catch (err) {
          console.warn('[section-intro.js] Erro no runTyping:', err);
          el1.textContent = t1;
          el2.textContent = t2;
        }
      } else {
        console.log('[section-intro.js] Fallback: sem efeitos');
        el1.textContent = t1;
        el2.textContent = t2;
      }
      showBtn();
    };

    try {
      await runTypingChain();
      INTRO_READY = true;
      await loadAndSetupGuia(root, btn);
      checkReady(btn);
    } catch (err) {
      console.warn('[section-intro.js] Typing chain falhou', err);
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
      checkReady(btn);
    }

    const goNext = () => {
      console.log('[section-intro.js] Botão clicado, navegando para section-termos');
      if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) {
        console.log('[section-intro.js] Navegação bloqueada por __canNavigate');
        return;
      }

      const nextSection = 'section-termos';
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection);
        } else if (typeof window.showSection === 'function') {
          window.showSection(nextSection);
        } else {
          console.warn('[section-intro.js] Nenhuma função de navegação disponível');
        }
      } catch (err) {
        console.error('[section-intro.js] Erro ao avançar:', err);
      }
    };

    console.log('[section-intro.js] Configurando evento de clique no botão');
    const freshBtn = btn.cloneNode(true);
    freshBtn.classList.add('btn');
    btn.replaceWith(freshBtn);
    once(freshBtn, 'click', goNext);
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    console.log('[section-intro.js] Handler ligado');

    const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
    if (visibleIntro) {
      handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
