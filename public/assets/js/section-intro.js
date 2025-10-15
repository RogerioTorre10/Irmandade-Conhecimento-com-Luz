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
  if (sectionId !== 'section-intro') return;

  let root = node || document.getElementById('section-intro');
  if (!root) {
    try {
      root = await waitForElement('#section-intro', { 
        within: document.getElementById('jornada-content-wrapper') || document, 
        timeout: 10000 
      });
    } catch (e) {
      window.toast?.('Erro: Seção section-intro não carregada.', 'error');
      console.error('[section-intro] Section not found:', e);
      return;
    }
  }

  root.classList.add('section-intro');

  let p1_1, p1_2, p1_3, p2_1, p2_2, avancarBtn;
  try {
    p1_1 = await waitForElement('#intro-p1-1', { within: root, timeout: 10000 });
    p1_2 = await waitForElement('#intro-p1-2', { within: root, timeout: 10000 });
    p1_3 = await waitForElement('#intro-p1-3', { within: root, timeout: 10000 });
    p2_1 = await waitForElement('#intro-p2-1', { within: root, timeout: 10000 });
    p2_2 = await waitForElement('#intro-p2-2', { within: root, timeout: 10000 });
    avancarBtn = await waitForElement('#btn-avancar', { within: root, timeout: 10000 });
  } catch (e) {
    console.error('[section-intro] Elements not found:', e);
    window.toast?.('Falha ao carregar os elementos da seção Intro.', 'error');
    return;
  }

  [p1_1, p1_2, p1_3, p2_1, p2_2].forEach(el => {
    if (el) {
      el.style.color = '#fff !important';
      el.style.opacity = '0 !important';
      el.style.visibility = 'hidden !important';
      el.style.display = 'none !important';
      console.log('[section-intro] Texto inicializado:', el.id, el.textContent?.substring(0, 50));
    }
  });

  root.style.cssText = `
    background: transparent !important;
    padding: 24px !important;
    border-radius: 12px !important;
    width: 100% !important;
    max-width: 600px !important;
    margin: 12px auto !important;
    text-align: center !important;
    box-shadow: none !important;
    border: none !important;
    display: block !important;
    opacity: 1 !important;
    visibility: visible !important;
    position: relative !important;
    z-index: 2 !important;
    overflow: hidden !important;
    min-height: 80vh !important;
    height: 80vh !important;
    box-sizing: border-box !important;
  `;

  if (avancarBtn) {
    avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
    avancarBtn.disabled = true;
    avancarBtn.style.opacity = '0.5 !important';
    avancarBtn.style.cursor = 'not-allowed !important';
    avancarBtn.style.display = 'inline-block !important';
    avancarBtn.style.margin = '8px auto !important';
    avancarBtn.style.visibility = 'visible !important';
    avancarBtn.textContent = 'Iniciar';
    console.log('[section-intro] Botão inicializado:', avancarBtn.className, avancarBtn.textContent);
  }

  once(avancarBtn, 'click', () => {
    console.log('[section-intro] Avançando para section-termos');
    if (typeof window.JC?.show === 'function') {
      window.JC.show('section-termos');
    } else {
      window.location.href = '/termos';
      console.warn('[section-intro] Fallback navigation to /termos');
    }
  });

  const runTypingChain = async () => {
    console.log('[section-intro] Iniciando datilografia...');
    const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');

    if (!typingElements.length) {
      console.warn('[section-intro] Nenhum elemento com data-typing="true" encontrado');
      if (avancarBtn) {
        avancarBtn.disabled = false;
        avancarBtn.style.opacity = '1 !important';
        avancarBtn.style.cursor = 'pointer !important';
      }
      return;
    }

    console.log('[section-intro] Elementos encontrados:', Array.from(typingElements).map(el => el.id));

    // Fallback para window.runTyping
    if (typeof window.runTyping !== 'function') {
      console.warn('[section-intro] window.runTyping não encontrado, usando fallback');
      window.runTyping = (el, text, resolve, options) => {
        let i = 0;
        const speed = options.speed || 20;
        const type = () => {
          if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
          } else {
            resolve();
          }
        };
        type();
      };
    }

    for (const el of typingElements) {
      const text = getText(el);
      console.log('[section-intro] Datilografando:', el.id, text.substring(0, 50));
      
      try {
        el.textContent = '';
        el.classList.add('typing-active', 'lumen-typing');
        el.style.color = '#fff !important';
        el.style.opacity = '0 !important';
        el.style.display = 'block !important';
        el.style.visibility = 'hidden !important';
        await new Promise(resolve => window.runTyping(el, text, resolve, {
          speed: Number(el.dataset.speed || 20),
          cursor: String(el.dataset.cursor || 'true') === 'true'
        }));
        el.classList.add('typing-done');
        el.classList.remove('typing-active');
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
      } catch (err) {
        console.error('[section-intro] Erro na datilografia para', el.id, err);
        el.textContent = text;
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
      }
      
      try {
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
          console.log('[section-intro] TTS ativado para:', el.id);
          await new Promise(resolve => setTimeout(resolve, text.length * 30));
        } else {
          console.warn('[section-intro] window.EffectCoordinator.speak não encontrado');
        }
      } catch (err) {
        console.error('[section-intro] Erro no TTS para', el.id, err);
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('[section-intro] Datilografia concluída');
    if (avancarBtn) {
      avancarBtn.disabled = false;
      avancarBtn.style.opacity = '1 !important';
      avancarBtn.style.cursor = 'pointer !important';
    }
  };

  // Forçar inicialização
  INTRO_READY = false;
  try {
    await runTypingChain();
    INTRO_READY = true;
  } catch (err) {
    console.error('[section-intro] Erro na datilografia:', err);
    root.querySelectorAll('[data-typing="true"]').forEach(el => {
      el.textContent = getText(el);
      el.classList.add('typing-done');
      el.style.opacity = '1 !important';
      el.style.visibility = 'visible !important';
      el.style.display = 'block !important';
    });
    if (avancarBtn) {
      avancarBtn.disabled = false;
      avancarBtn.style.opacity = '1 !important';
      avancarBtn.style.cursor = 'pointer !important';
    }
  }

  console.log('[section-intro] Elementos encontrados:', {
    p1_1: !!p1_1, p1_1Id: p1_1?.id,
    p1_2: !!p1_2, p1_2Id: p1_2?.id,
    p1_3: !!p1_3, p1_3Id: p1_3?.id,
    p2_1: !!p2_1, p2_1Id: p2_1?.id,
    p2_2: !!p2_2, p2_2Id: p2_2?.id,
    avancarBtn: !!avancarBtn, avancarId: avancarBtn?.id
  });
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
