(function () {
  'use strict';

  // Verifica se o script já foi vinculado para evitar duplicidade
  if (window.__introBound) return;
  window.__introBound = true;

  let INTRO_READY = false;

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

  // A função checkReady e loadAndSetupGuia foram removidas desta seção.

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-intro.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-intro') return;

    console.log('[section-intro.js] Ativando intro');

    let root = node || document.getElementById('section-intro');
    // ... (restante da lógica de carregamento do root e dos elementos el1, el2, btn)
    if (!root) {
      try {
        root = await waitForElement('#section-intro', { timeout: 8000 });
      } catch {
        root = document.querySelector('section[data-section="intro"]') || null;
      }
    }
    if (!root) {
      console.warn('[section-intro.js] Root da intro não encontrado (após espera)');
      window.toast?.('Intro ainda não montou no DOM.', 'warn');
      return;
    }

    let el1, el2, btn;
    try {
      el1 = await waitForElement('#intro-p1', { within: root, timeout: 5000 });
      el2 = await waitForElement('#intro-p2', { within: root, timeout: 5000 });
      btn = await waitForElement('#btn-avancar', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[section-intro.js] Falha ao esperar pelos elementos essenciais:', e);
      window.toast?.('Falha ao carregar a Introdução. Usando fallback.', 'error');
      // Fallback: cria elementos básicos para evitar crash
      el1 = el1 || root.appendChild(Object.assign(document.createElement('p'), { id: 'intro-p1', textContent: 'Bem-vindo à sua jornada!' }));
      el2 = el2 || root.appendChild(Object.assign(document.createElement('p'), { id: 'intro-p2', textContent: 'Vamos começar?' }));
      btn = btn || root.appendChild(Object.assign(document.createElement('button'), { id: 'btn-avancar', textContent: 'Avançar', className: 'hidden' })); // Removido disabled-temp no fallback
    }

    console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });

    // Aplica textura de pedra ao botão (mantido, pois é apenas estilo)
    btn.classList.add('btn-stone');
    btn.style.cssText = `
      padding: 8px 16px;
      background: linear-gradient(to bottom, #a0a0a0, #808080), url('/assets/img/textura-de-pedra.jpg') center/cover;
      background-blend-mode: overlay;
      color: #fff;
      border-radius: 8px;
      font-size: 18px;
      border: 3px solid #4a4a4a;
      box-shadow: inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6);
      text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
      opacity: 1;
      visibility: visible;
      display: inline-block;
    `;
    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-intro');
      } else if (typeof window.showSection === 'function') {
        window.showSection('section-intro');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'block';
      }
    } catch (err) {
      console.warn('[section-intro.js] Falha ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'block';
    }

    // O botão fica oculto até o typing chain terminar
    btn.classList.add('hidden');
    btn.disabled = false; // O botão não precisa mais de desabilitação condicional
    const showBtn = () => {
      console.log('[section-intro.js] Mostrando botão "Avançar"');
      btn.classList.remove('hidden');
      btn.classList.remove('disabled-temp'); // Caso tenha sobrado
      btn.style.display = 'inline-block';
      btn.disabled = false;
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
      // loadAndSetupGuia(root, btn); // REMOVIDO
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
      // await loadAndSetupGuia(root, btn); // REMOVIDO
    } catch (err) {
      console.warn('[section-intro.js] Typing chain falhou', err);
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
      INTRO_READY = true;
    }

    const goNext = () => {
      // O AVANÇAR AGORA ESTÁ SEMPRE LIBERADO APÓS O TYPING
      console.log('[section-intro.js] Botão clicado, navegando para section-termos');
      if (typeof window.__canNavigate === 'function' && !window.__canNavigate()) return;

      const nextSection = 'section-termos';
      try {
        if (window.JC?.goNext) {
          window.JC.goNext(nextSection);
        } else if (typeof window.showSection === 'function') {
          window.showSection(nextSection);
        }
      } catch (err) {
        console.error('[section-intro.js] Erro ao avançar:', err);
      }
    };

    console.log('[section-intro.js] Configurando evento de clique no botão');
    // Adiciona uma pequena correção para garantir que o botão seja clicável após o "voltar"
    const freshBtn = btn.cloneNode(true);
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
