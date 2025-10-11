(function () {
  'use strict';

  if (window.__termosBound) return;
  window.__termosBound = true;

  let TERMOS_READY = false;

  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 7000, step = 50 } = {}) {
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

    let root = node || document.getElementById('section-termos');
    if (!root) {
      try {
        root = await waitForElement('#section-termos', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 10000 });
      } catch (e) {
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        return;
      }
    }

    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      pg1 = root.querySelector('#termos-pg1');
      pg2 = root.querySelector('#termos-pg2');
      nextBtn = await waitForElement('[data-action="termos-next"]', { within: root });
      prevBtn = await waitForElement('[data-action="termos-prev"]', { within: root });
      avancarBtn = await waitForElement('[data-action="avancar"]', { within: root });
    } catch (e) {
      window.toast?.('Falha ao carregar os botões da seção Termos.', 'error');
      pg1 = pg1 || root.querySelector('#termos-pg1') || document.createElement('div');
      pg2 = pg2 || root.querySelector('#termos-pg2') || document.createElement('div');
      nextBtn = nextBtn || root.querySelector('[data-action="termos-next"]') || document.createElement('button');
      prevBtn = prevBtn || root.querySelector('[data-action="termos-prev"]') || document.createElement('button');
      avancarBtn = avancarBtn || root.querySelector('[data-action="avancar"]') || document.createElement('button');
    }

    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'flex';
      }
    } catch (err) {
      root.classList.remove('hidden');
      root.style.display = 'flex';
    }

    avancarBtn.classList.add('btn-stone');
    avancarBtn.style.cssText = `
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

    if (typeof window.setupCandleFlame === 'function') {
      window.setupCandleFlame('media', 'flame-bottom-right');
    }

    nextBtn.disabled = true;
    prevBtn.disabled = true;
    avancarBtn.disabled = true;

    const runTypingChain = async () => {
      const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      if (typingElements.length === 0 || typeof window.runTyping !== 'function') {
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
        });
        nextBtn.disabled = false;
        prevBtn.disabled = false;
        avancarBtn.disabled = false;
        return;
      }

      try {
        for (const el of typingElements) {
          const text = getText(el);
          el.textContent = '';
          el.classList.add('typing-active');
          await new Promise((resolve) => {
            window.runTyping(el, text, resolve, {
              speed: Number(el.dataset.speed || 40),
              cursor: String(el.dataset.cursor || 'true') === 'true'
            });
          });
          el.classList.add('typing-done');
        }
      } catch (err) {
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
        });
      }

      nextBtn.disabled = false;
      prevBtn.disabled = false;
      avancarBtn.disabled = false;
    };

    if (!TERMOS_READY) {
      try {
        await runTypingChain();
        TERMOS_READY = true;
      } catch (err) {
        nextBtn.disabled = false;
        prevBtn.disabled = false;
        avancarBtn.disabled = false;
      }
    } else {
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      avancarBtn.disabled = false;
    }
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });

    setTimeout(() => {
      const visibleTermos = document.querySelector('#section-termos:not(.hidden)');
      if (visibleTermos) {
        handler({ detail: { sectionId: 'section-termos', node: visibleTermos } });
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
