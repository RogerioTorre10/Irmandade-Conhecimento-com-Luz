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

  function waitForElement(selector, { within = document, timeout = 5000 } = {}) {
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
    // MODO DEBUG: Habilita o botão sempre para testar
    btn.disabled = false;
    btn.classList.remove('disabled-temp');
    console.log('[Guia Setup] Botão "Iniciar" ativado (debug mode).');
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
    }

    // Simula carregamento de guias para debug
    dadosGuiaCarregados = true;
    console.log('[loadAndSetupGuia] Guias simulados carregados. Prosseguindo.');
    checkReady(btn);
  }

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-intro.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-intro') return;

    console.log('[section-intro.js] Ativando intro');

    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForElement('#section-intro', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 8000 });
      } catch {
        root = document.querySelector('section[data-section="intro"]') || null;
      }
    }
    if (!root) {
      console.error('[section-intro.js] Root da intro não encontrado');
      return;
    }

    let el1, el2, btn;
    try {
      el1 = await waitForElement('#intro-p1', { within: root, timeout: 5000 });
      el2 = await waitForElement('#intro-p2', { within: root, timeout: 5000 });
      btn = await waitForElement('#btn-avancar', { within: root, timeout: 5000 });
      console.log('[section-intro.js] Elementos encontrados com sucesso!');
    } catch (e) {
      console.error('[section-intro.js] Falha ao encontrar elementos:', e);
      return; // Para aqui se não encontrar elementos
    }

    // APLICA TEXTURA DE PEDRA AO BOTÃO (SEM QUEBRAR O JS)
    const applyStoneTexture = (button) => {
      button.style.cssText += `
        padding: 12px 24px !important;
        background: linear-gradient(to bottom, #a0a0a0, #808080), url('/assets/img/textura-de-pedra.jpg') center/cover !important;
        background-blend-mode: overlay !important;
        color: #fff !important;
        border-radius: 8px !important;
        font-size: 18px !important;
        border: 3px solid #4a4a4a !important;
        box-shadow: inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6) !important;
        text-shadow: 1px 1px 3px rgba(0,0,0,0.7) !important;
        opacity: 1 !important;
        visibility: visible !important;
      `;
      button.classList.add('btn-stone');
    };

    applyStoneTexture(btn);

    // Mostra a seção
    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-intro');
      } else {
        root.style.display = 'block';
        root.classList.remove('hidden');
      }
    } catch (err) {
      root.style.display = 'block';
    }

    // Configura botão inicialmente invisível
    btn.classList.add('hidden');
    btn.disabled = true;

    const showBtn = () => {
      console.log('[section-intro.js] Mostrando botão');
      btn.classList.remove('hidden');
      btn.disabled = false; // Habilita imediatamente para debug
      applyStoneTexture(btn); // Reaplica textura
    };

    // Efeitos de datilografia
    const speed1 = Number(el1.dataset.speed || 36);
    const speed2 = Number(el2.dataset.speed || 36);
    const t1 = getText(el1);
    const t2 = getText(el2);

    const runTypingChain = async () => {
      console.log('[section-intro.js] Iniciando datilografia');
      if (typeof window.runTyping === 'function') {
        try {
          await new Promise((resolve) => {
            window.runTyping(el1, t1, resolve, { speed: speed1, cursor: true });
          });
          console.log('Datilografia p1 concluída');

          await new Promise((resolve) => {
            window.runTyping(el2, t2, resolve, { speed: speed2, cursor: true });
          });
          console.log('Datilografia p2 concluída');
        } catch (err) {
          console.warn('Erro na datilografia:', err);
          el1.textContent = t1;
          el2.textContent = t2;
        }
      } else {
        el1.textContent = t1;
        el2.textContent = t2;
      }
      showBtn(); // MOSTRA O BOTÃO APÓS DATILOGRAFIA
      loadAndSetupGuia(root, btn);
    };

    try {
      await runTypingChain();
      INTRO_READY = true;
    } catch (err) {
      console.error('Falha na intro:', err);
      showBtn();
    }

    // Navegação
    const goNext = () => {
      console.log('[section-intro.js] Botão clicado!');
      const nextSection = 'section-termos';
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection);
        }
      } catch (err) {
        console.error('Erro na navegação:', err);
      }
    };

    // Clona botão para evento limpo
    const freshBtn = btn.cloneNode(true);
    applyStoneTexture(freshBtn);
    btn.replaceWith(freshBtn);
    once(freshBtn, 'click', goNext);
  };

  const bind = () => {
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    console.log('[section-intro.js] Bind completo');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
