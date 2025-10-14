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
    if (sectionId !== 'section-termos') return; // Ignora se não for section-termos

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
  pg1 = await waitForElement('#termos-p1', { within: root, timeout: 10000 });
  pg2 = await waitForElement('#termos-p2', { within: root, timeout: 10000 });
  nextBtn = await waitForElement('[data-action="termos-next"]', { within: root, timeout: 10000 });
  prevBtn = await waitForElement('[data-action="termos-prev"]', { within: root, timeout: 10000 });
  avancarBtn = await waitForElement('[data-action="avancar"]', { within: root, timeout: 10000 });
} catch (e) {
  window.toast?.('Falha ao carregar os elementos da seção Termos.', 'error');
  pg1 = pg1 || root.querySelector('#termos-p1') || document.createElement('p');
  pg2 = pg2 || root.querySelector('#termos-p2') || document.createElement('p');
  nextBtn = nextBtn || root.querySelector('[data-action="termos-next"]') || document.createElement('button');
  prevBtn = prevBtn || root.querySelector('[data-action="termos-prev"]') || document.createElement('button');
  avancarBtn = avancarBtn || root.querySelector('[data-action="avancar"]') || document.createElement('button');
  // Configurar placeholders para parágrafos ausentes
  if (!pg1.id) {
    pg1.id = 'termos-p1';
    pg1.classList.add('intro-paragraph');
    pg1.dataset.typing = 'true';
    pg1.textContent = 'Placeholder para Termos 1';
    root.appendChild(pg1);
  }
  if (!pg2.id) {
    pg2.id = 'termos-p2';
    pg2.classList.add('intro-paragraph');
    pg2.dataset.typing = 'true';
    pg2.textContent = 'Placeholder para Termos 2';
    root.appendChild(pg2);
  }
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

    // Adicionar manipuladores de cliques
    once(nextBtn, 'click', () => {
      pg1.classList.add('hidden');
      pg2.classList.remove('hidden');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      }
    });

    once(prevBtn, 'click', () => {
      pg2.classList.add('hidden');
      pg1.classList.remove('hidden');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      }
    });

    once(avancarBtn, 'click', () => {
     if (typeof window.JC?.show === 'function') {
     window.JC.show('section-senha');
   } else {
     window.location.href = '/senha';
    }
   });

  const runTypingChain = async () => {
  const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
  console.log('[section-termos] Typing elements found:', typingElements.length, Array.from(typingElements).map(el => el.id));
  if (typingElements.length === 0 || typeof window.runTyping !== 'function') {
    console.warn('[section-termos] No typing elements or runTyping not available');
    typingElements.forEach(el => {
      el.textContent = getText(el);
      el.classList.add('typing-done');
      el.style.opacity = '1';
      el.style.color = '#fff';
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
      el.style.color = '#fff'; // Garante visibilidade
      await new Promise((resolve) => {
        window.runTyping(el, text, resolve, {
          speed: Number(el.dataset.speed || 40),
          cursor: String(el.dataset.cursor || 'true') === 'true'
        });
      });
      el.classList.add('typing-done');
      el.style.opacity = '1';
      el.style.color = '#fff';
    }
  } catch (err) {
    console.error('[section-termos] Typing error:', err);
    typingElements.forEach(el => {
      el.textContent = getText(el);
      el.classList.add('typing-done');
      el.style.opacity = '1';
      el.style.color = '#fff';
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
