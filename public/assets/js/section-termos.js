(function () {
  'use strict';

  // Namespace isolado
  window.JCTermos = window.JCTermos || {
    state: {
      ready: false,
      currentPage: 1,
      listenerAdded: false
    }
  };

  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 10000, step = 50 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        if (el) return resolve(el);
        if (performance.now() - start >= timeout) {
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

  const handler = async (evt) => {
    const { sectionId, node } = fromDetail(evt?.detail);
    if (sectionId !== 'section-termos') return;

    if (window.JCTermos.state.ready) {
      console.log('[JCTermos] Já inicializado, ignorando...');
      return;
    }

    let root = node || document.getElementById('section-termos');
    if (!root) {
      try {
        root = await waitForElement('#section-termos', {
          within: document.getElementById('jornada-content-wrapper') || document,
          timeout: 15000
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        console.error('[JCTermos] Section not found:', e);
        return;
      }
    }

    root.classList.add('section-termos');

    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      pg1 = await waitForElement('#termos-pg1', { within: root });
      pg2 = await waitForElement('#termos-pg2', { within: root });
      nextBtn = await waitForElement('.nextBtn[data-action="termos-next"]', { within: root });
      prevBtn = await waitForElement('.prevBtn[data-action="termos-prev"]', { within: root });
      avancarBtn = await waitForElement('.avancarBtn[data-action="avancar"]', { within: root });
    } catch (e) {
      console.error('[JCTermos] Elementos não encontrados:', e);
      window.toast?.('Falha ao carregar os elementos da seção Termos.', 'error');
      return;
    }

    [pg1, pg2].forEach((el, i) => {
      if (el) {
        el.classList.remove('hidden');
        el.style.display = i === 0 ? 'block' : 'none';
      }
    });

    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.cursor = 'not-allowed';
      }
    });

    const runTypingChain = async () => {
      console.log('[JCTermos] Iniciando datilografia...');
      const typingElements = root.querySelectorAll(`#termos-pg${window.JCTermos.state.currentPage} [data-typing="true"]:not(.typing-done)`);

      if (!typingElements.length) {
        [nextBtn, prevBtn, avancarBtn].forEach(btn => {
          if (btn) {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
          }
        });
        return;
      }

      if (typeof window.runTyping !== 'function') {
        window.runTyping = (el, text, resolve, options) => {
          let i = 0;
          const speed = options.speed || 50;
          const type = () => {
            if (i < text.length) {
              el.textContent += text.charAt(i++);
              setTimeout(type, speed);
            } else {
              el.textContent = text;
              resolve();
            }
          };
          type();
        };
      }

      for (const el of typingElements) {
        const text = getText(el);
        el.textContent = '';
        el.classList.add('typing-active', 'lumen-typing');
        await new Promise(resolve => window.runTyping(el, text, resolve, {
          speed: Number(el.dataset.speed || 50),
          cursor: String(el.dataset.cursor || 'true') === 'true'
        }));
        el.classList.add('typing-done');
        el.classList.remove('typing-active');
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
          await new Promise(resolve => setTimeout(resolve, text.length * 30));
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1';
          btn.style.cursor = 'pointer';
        }
      });
    };

    once(nextBtn, 'click', async () => {
      if (window.JCTermos.state.currentPage === 1 && pg2) {
        pg1.style.display = 'none';
        pg2.style.display = 'block';
        avancarBtn.textContent = 'Aceito e quero continuar';
        window.JCTermos.state.currentPage = 2;
        await runTypingChain();
      }
    });

    once(prevBtn, 'click', async () => {
      if (window.JCTermos.state.currentPage === 2 && pg1) {
        pg2.style.display = 'none';
        pg1.style.display = 'block';
        avancarBtn.textContent = 'Avançar';
        window.JCTermos.state.currentPage = 1;
        await runTypingChain();
      }
    });

    once(avancarBtn, 'click', async () => {
      if (window.JCTermos.state.currentPage === 2) {
        console.log('[JCTermos] Avançando para section-senha');
        if (typeof window.JC?.show === 'function') {
          window.JC.show('section-senha');
        } else {
          window.location.href = '/senha';
        }
      }
    });

    try {
      await runTypingChain();
      window.JCTermos.state.ready = true;
    } catch (err) {
      console.error('[JCTermos] Erro na datilografia:', err);
    }
  };

  if (!window.JCTermos.state.listenerAdded) {
    document.addEventListener('sectionLoaded', handler, { passive: true });
    window.JCTermos.state.listenerAdded = true;
  }

  const bind = () => {
    const visible = document.querySelector('#section-termos:not(.hidden)');
    if (visible) {
      handler({ detail: { sectionId: 'section-termos', node: visible } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
