(function () {
  'use strict';

  if (window.__introBound) return;
  window.__introBound = true;

  // ===== GUARDAS =====
  let INTRO_READY = false;

  // ===== HELPERS =====
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

  async function waitForEl(selector, { within = document, timeout = 8000, step = 100 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        const el = within.querySelector(selector);
        console.log(`[waitForEl] Buscando ${selector}, tempo: ${Math.round(performance.now() - start)}ms`);
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) {
          console.error(`[waitForEl] Timeout após ${timeout}ms para ${selector}`);
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
    const name = detail.name || null;
    return { sectionId, node, name };
  }

  // ===== HANDLER PRINCIPAL DA INTRO =====
  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    console.log('[section-intro.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-intro') return;

    console.log('[section-intro.js] Ativando intro');

    // 1) Garante o root da seção
    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForEl('#section-intro', { timeout: 8000, step: 100 });
      } catch {
        root = document.querySelector('section[data-section="intro"]') || null;
      }
    }

    if (!root) {
      console.warn('[section-intro.js] Root da intro não encontrado (após espera)');
      window.toast?.('Intro ainda não montou no DOM.', 'warn');
      return;
    }

    // 2) Busca elementos dentro do root
    const el1 = root.querySelector('#intro-p1');
    const el2 = root.querySelector('#intro-p2');
    const btn = root.querySelector('#btn-avancar');
    console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });

    if (!(el1 && el2 && btn)) {
      console.warn('[section-intro.js] Elementos não encontrados', { el1, el2, btn });
      return;
    }

    // 3) Garante visibilidade
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

    // 4) Prepara botão
    btn.classList.add('hidden');
    btn.disabled = true;
    const showBtn = () => {
      console.log('[section-intro.js] Mostrando botão');
      btn.classList.remove('hidden');
      btn.style.display = 'inline-block';
      btn.disabled = false;
    };

    // 5) Parâmetros da datilografia
    const speed1 = Number(el1.dataset.speed || 36);
    const speed2 = Number(el2.dataset.speed || 36);
    const t1 = getText(el1);
    const t2 = getText(el2);
    const cursor1 = String(el1.dataset.cursor || 'true') === 'true';
    const cursor2 = String(el2.dataset.cursor || 'true') === 'true';

    // 6) Evita duplicar efeitos
    if (INTRO_READY) {
      console.log('[section-intro.js] Intro já preparada');
      showBtn();
      return;
    }

    // 7) Interrompe efeitos anteriores
    window.EffectCoordinator?.stopAll?.();

    // 8) Encadeia typing
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
          showBtn();
        } catch (err) {
          console.warn('[section-intro.js] Erro no runTyping:', err);
          el1.textContent = t1;
          el2.textContent = t2;
          showBtn();
        }
      } else {
        console.log('[section-intro.js] Fallback: sem efeitos');
        el1.textContent = t1;
        el2.textContent = t2;
        showBtn();
      }
    };

    try {
      await runTypingChain();
      INTRO_READY = true;
    } catch (err) {
      console.warn('[section-intro.js] Typing chain falhou', err);
      el1.textContent = t1;
      el2.textContent = t2;
      showBtn();
      INTRO_READY = true;
    }

    // 9) Navegação
    const goNext = () => {
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
    const freshBtn = btn.cloneNode(true);
    btn.replaceWith(freshBtn);
    once(freshBtn, 'click', goNext);
  };

  // ===== BIND DOS EVENTOS =====
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
