(function () {
  'use strict';

  if (window.__introBound) return;
  window.__introBound = true;

  let INTRO_READY = false;

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
    if (sectionId !== 'section-intro') return;

    let root = node || document.getElementById('section-intro');
    if (!root) {
      try {
        root = await waitForElement('#section-intro', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 10000 });
      } catch (e) {
        window.toast?.('Erro: Seção section-intro não carregada.', 'error');
        console.error('[section-intro.js] Erro ao encontrar section-intro:', e);
        return;
      }
    }

    let el1, el2, btn;
    try {
      el1 = await waitForElement('#intro-p1', { within: root, timeout: 10000 });
      el2 = await waitForElement('#intro-p2', { within: root, timeout: 10000 });
      btn = await waitForElement('#btn-avancar', { within: root, timeout: 10000 });
    } catch (e) {
      window.toast?.('Falha ao carregar os elementos da seção Intro.', 'error');
      console.error('[section-intro.js] Elementos encontrados via fallback:', { el1: !!el1, el2: !!el2, btn: !!btn });
      // Fallback: usa os textos corretos do HTML esperado
      const wrapper = root.querySelector('#jornada-content-wrapper') || root.appendChild(document.createElement('div'));
      wrapper.id = 'jornada-content-wrapper';
      el1 = el1 || wrapper.appendChild(Object.assign(document.createElement('p'), { id: 'intro-p1', textContent: 'Bem-vindo à Jornada Conhecimento com Luz.', className: 'intro-paragraph', dataset: { typing: 'true', speed: '36', cursor: 'true' } }));
      el2 = el2 || wrapper.appendChild(Object.assign(document.createElement('p'), { id: 'intro-p2', textContent: 'Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.', className: 'intro-paragraph', dataset: { typing: 'true', speed: '36', cursor: 'true' } }));
      btn = btn || wrapper.appendChild(Object.assign(document.createElement('button'), { id: 'btn-avancar', textContent: 'Iniciar', className: 'btn btn-primary', dataset: { action: 'avancar' }, disabled: true }));
    }

    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-intro');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'flex';
      }
    } catch (err) {
      root.classList.remove('hidden');
      root.style.display = 'flex';
    }

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

    if (typeof window.setupCandleFlame === 'function') {
      window.setupCandleFlame('media', 'flame-bottom-right');
    }

    btn.disabled = true;

    const runTypingChain = async () => {
      const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      console.log('[section-intro.js] Elementos com data-typing:', typingElements.length);
      if (typingElements.length === 0 || typeof window.runTyping !== 'function') {
        console.warn('[section-intro.js] Nenhum elemento com data-typing ou runTyping não disponível');
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
        });
        btn.disabled = false;
        return;
      }

      try {
        for (const el of typingElements) {
          if (el.classList.contains('typing-done')) {
            console.log('[section-intro.js] Ignorando elemento já processado:', el.id);
            continue;
          }
          const text = getText(el);
          el.textContent = '';
          el.classList.add('typing-active');
          await new Promise((resolve) => {
            window.runTyping(el, text, resolve, {
              speed: Number(el.dataset.speed || 36),
              cursor: String(el.dataset.cursor || 'true') === 'true'
            });
          });
          el.classList.add('typing-done');
        }
        
        if (typeof window.EffectCoordinator?.speak === 'function') {
          const fullText = Array.from(typingElements).map(el => getText(el)).join(' ');
          window.EffectCoordinator.speak(fullText, { rate: 1.03, pitch: 1.0 });
          console.log('[section-intro.js] TTS ativado para:', fullText.substring(0, 50) + '...');
        }
      } catch (err) {
        console.error('[section-intro.js] Erro ao aplicar datilografia:', err);
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
        });
      }

      btn.disabled = false;
      console.log('[section-intro.js] Mostrando botão "Avançar"');
    };

    once(btn, 'click', () => {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
      }
    });

    if (!INTRO_READY) {
      try {
        await runTypingChain();
        INTRO_READY = true;
        console.log('[section-intro.js] Intro já preparada');
      } catch (err) {
        console.error('[section-intro.js] Erro ao preparar intro:', err);
        btn.disabled = false;
      }
    } else {
      btn.disabled = false;
    }

    console.log('[section-intro.js] Elementos encontrados:', { el1: !!el1, el2: !!el2, btn: !!btn });
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });

    setTimeout(() => {
      const visibleIntro = document.querySelector('#section-intro:not(.hidden)');
      if (visibleIntro) {
        handler({ detail: { sectionId: 'section-intro', node: visibleIntro } });
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
