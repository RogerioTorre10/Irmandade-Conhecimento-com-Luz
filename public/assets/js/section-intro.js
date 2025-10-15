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
  };

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
    if (sectionId !== 'sec-intro') return;

    let root = node || document.getElementById('sec-intro');
    if (!root) {
      try {
        root = await waitForElement('#sec-intro', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 10000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção sec-intro não carregada.', 'error');
        console.error('[sec-intro] Section not found:', e);
        return;
      }
    }

    let title, p1, p2, avancarBtn;
    try {
      title = await waitForElement('.parchment-title-rough', { within: root, timeout: 10000 });
      p1 = await waitForElement('.parchment-text-rough:nth-of-type(1)', { within: root, timeout: 10000 });
      p2 = await waitForElement('.parchment-text-rough:nth-of-type(2)', { within: root, timeout: 10000 });
      avancarBtn = await waitForElement('#btn-avancar', { within: root, timeout: 10000 });
    } catch (e) {
      console.error('[sec-intro] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Intro.', 'error');
      return;
    }

    [title, p1, p2].forEach(el => {
      if (el) {
        el.style.color = '#fff !important';
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
        console.log('[sec-intro] Texto inicializado:', el.tagName, el.textContent?.substring(0, 50));
      }
    });

    root.style.cssText = `
      background: transparent !important;
      padding: 24px !important;
      border-radius: 12px !important;
      max-width: 600px !important;
      text-align: center !important;
      box-shadow: none !important;
      border: none !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 2 !important;
      overflow-y: auto !important;
      max-height: 60vh !important;
    `;

    if (avancarBtn) {
      avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
      avancarBtn.disabled = false;
      avancarBtn.style.opacity = '1 !important';
      avancarBtn.style.cursor = 'pointer !important';
      avancarBtn.style.display = 'block !important';
      avancarBtn.style.margin = '8px auto !important';
      console.log('[sec-intro] Botão habilitado:', avancarBtn.className, avancarBtn.textContent);
    }

    once(avancarBtn, 'click', () => {
      console.log('[sec-intro] Avançando para section-termos');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
        console.warn('[sec-intro] Fallback navigation to /termos');
      }
    });

    const runTypingChain = async () => {
      console.log('[sec-intro] Iniciando datilografia...');
      const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
      
      for (let el of typingElements) {
        const text = getText(el);
        console.log('[sec-intro] Datilografando:', el.tagName, text.substring(0, 50));
        
        if (typeof window.runTyping === 'function') {
          el.textContent = '';
          el.classList.add('typing-active');
          el.style.color = '#fff !important';
          await new Promise(resolve => window.runTyping(el, text, resolve, {
            speed: Number(el.dataset.speed || 40),
            cursor: String(el.dataset.cursor || 'true') === 'true'
          }));
        } else {
          el.textContent = text;
        }
        
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.color = '#fff !important';
        
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.03, pitch: 1.0 });
          console.log('[sec-intro] TTS ativado para:', el.tagName);
          await new Promise(resolve => setTimeout(resolve, text.length * 50));
        }
      }
      
      console.log('[sec-intro] Datilografia concluída');
      if (avancarBtn) avancarBtn.disabled = false;
    };

    if (!INTRO_READY) {
      try {
        await runTypingChain();
        INTRO_READY = true;
      } catch (err) {
        console.error('[sec-intro] Erro na datilografia:', err);
        root.querySelectorAll('[data-typing="true"]').forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
          el.style.opacity = '1 !important';
          el.style.color = '#fff !important';
        });
        if (avancarBtn) avancarBtn.disabled = false;
      }
    } else {
      if (avancarBtn) avancarBtn.disabled = false;
    }

    console.log('[sec-intro] Elementos encontrados:', {
      title: !!title, titleClass: title?.className,
      p1: !!p1, p1Text: p1?.textContent?.substring(0, 50),
      p2: !!p2, p2Text: p2?.textContent?.substring(0, 50),
      avancarBtn: !!avancarBtn, avancarId: avancarBtn?.id
    });
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });

    setTimeout(() => {
      const visibleIntro = document.querySelector('#sec-intro:not(.hidden)');
      if (visibleIntro) {
        handler({ detail: { sectionId: 'sec-intro', node: visibleIntro } });
      }
    }, 100);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
