(function () {
  'use strict';

  if (window.__termosBound) return;
  window.__termosBound = true;

  let TERMOS_READY = false;
  let currentTermosPage = 1;

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
  if (sectionId !== 'section-termos') return;

  // Verificar se já foi inicializado
  if (window.TERMOS_READY) {
    console.log('[section-termos] Já inicializado, ignorando...');
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
      console.error('[section-termos] Section not found:', e);
      return;
    }
  }

  root.classList.add('section-termos');

  let pg1, pg2, nextBtn, prevBtn, avancarBtn;
  try {
    pg1 = await waitForElement('#termos-pg1', { within: root, timeout: 15000 });
    pg2 = await waitForElement('#termos-pg2', { within: root, timeout: 15000 });
    nextBtn = await waitForElement('.nextBtn[data-action="termos-next"]', { within: root, timeout: 15000 });
    prevBtn = await waitForElement('.prevBtn[data-action="termos-prev"]', { within: root, timeout: 15000 });
    avancarBtn = await waitForElement('.avancarBtn[data-action="avancar"]', { within: root, timeout: 15000 });
  } catch (e) {
    console.error('[section-termos] Elements not found:', e);
    window.toast?.('Falha ao carregar os elementos da seção Termos.', 'error');
    return;
  }

  [pg1, pg2].forEach((el, i) => {
    if (el) {
      el.style.opacity = i === 0 ? '1 !important' : '0 !important';
      el.style.visibility = i === 0 ? 'visible !important' : 'hidden !important';
      el.style.display = i === 0 ? 'block !important' : 'none !important';
      el.classList.remove('hidden');
      console.log(`[section-termos] Página ${i+1} inicializada:`, el.id);
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

  [nextBtn, prevBtn, avancarBtn].forEach(btn => {
    if (btn) {
      btn.classList.add('btn', 'btn-primary', 'btn-stone');
      btn.disabled = true;
      btn.style.opacity = '0.5 !important';
      btn.style.cursor = 'not-allowed !important';
      btn.style.display = 'inline-block !important';
      btn.style.margin = '8px !important';
      btn.style.visibility = 'visible !important';
      console.log('[section-termos] Botão inicializado:', btn.className, btn.textContent);
    }
  });

  once(nextBtn, 'click', async () => {
    if (window.currentTermosPage === 1 && pg2) {
      pg1.style.display = 'none !important';
      pg1.style.opacity = '0 !important';
      pg1.style.visibility = 'hidden !important';
      pg2.style.display = 'block !important';
      pg2.style.opacity = '1 !important';
      pg2.style.visibility = 'visible !important';
      pg2.classList.remove('hidden');
      pg2.scrollIntoView({ behavior: 'smooth' });
      window.currentTermosPage = 2;
      console.log('[section-termos] Mostrando termos-pg2');
      avancarBtn.textContent = 'Aceito e quero continuar';
      await runTypingChain();
    }
  });

  once(prevBtn, 'click', async () => {
    if (window.currentTermosPage === 2 && pg1) {
      pg2.style.display = 'none !important';
      pg2.style.opacity = '0 !important';
      pg2.style.visibility = 'hidden !important';
      pg1.style.display = 'block !important';
      pg1.style.opacity = '1 !important';
      pg1.style.visibility = 'visible !important';
      pg1.classList.remove('hidden');
      window.currentTermosPage = 1;
      console.log('[section-termos] Voltando para termos-pg1');
      avancarBtn.textContent = 'Avançar';
      await runTypingChain();
    }
  });

  once(avancarBtn, 'click', async () => {
    if (window.currentTermosPage === 2) {
      console.log('[section-termos] Avançando para section-senha');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-senha');
      } else {
        window.location.href = '/senha';
        console.warn('[section-termos] Fallback navigation to /senha');
      }
    } else if (pg2 && window.currentTermosPage === 1) {
      pg1.style.display = 'none !important';
      pg1.style.opacity = '0 !important';
      pg1.style.visibility = 'hidden !important';
      pg2.style.display = 'block !important';
      pg2.style.opacity = '1 !important';
      pg2.style.visibility = 'visible !important';
      pg2.classList.remove('hidden');
      window.currentTermosPage = 2;
      console.log('[section-termos] Mostrando termos-pg2 antes de avançar');
      avancarBtn.textContent = 'Aceito e quero continuar';
      await runTypingChain();
    }
  });

  const runTypingChain = async () => {
    console.log('[section-termos] Iniciando datilografia...');
    const typingElements = root.querySelectorAll(`#termos-pg${window.currentTermosPage} [data-typing="true"]:not(.typing-done)`);

    if (!typingElements.length) {
      console.warn('[section-termos] Nenhum elemento com data-typing="true" encontrado');
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.style.opacity = '1 !important';
          btn.style.visibility = 'visible !important';
          btn.style.cursor = 'pointer !important';
        }
      });
      return;
    }

    console.log('[section-termos] Elementos encontrados:', Array.from(typingElements).map(el => el.tagName + (el.id ? `#${el.id}` : '')));

    // Fallback para window.runTyping
    if (typeof window.runTyping !== 'function') {
      console.warn('[section-termos] window.runTyping não encontrado, usando fallback');
      window.runTyping = (el, text, resolve, options) => {
        let i = 0;
        const speed = options.speed || 50;
        const type = () => {
          if (i < text.length) {
            el.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
          } else {
            el.textContent = text; // Garantir texto completo
            resolve();
          }
        };
        type();
      };
    }

    for (const el of typingElements) {
      const text = getText(el);
      console.log('[section-termos] Datilografando:', el.tagName, text.substring(0, 50));
      
      try {
        el.textContent = '';
        el.classList.add('typing-active', 'lumen-typing');
        el.style.color = '#fff !important';
        el.style.opacity = '0 !important';
        el.style.display = 'block !important';
        el.style.visibility = 'hidden !important';
        await new Promise(resolve => window.runTyping(el, text, resolve, {
          speed: Number(el.dataset.speed || 50),
          cursor: String(el.dataset.cursor || 'true') === 'true'
        }));
        el.classList.add('typing-done');
        el.classList.remove('typing-active');
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
        // Chamada única para TTS
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.1, pitch: 1.0 });
          console.log('[section-termos] TTS ativado para:', el.tagName);
          await new Promise(resolve => setTimeout(resolve, text.length * 30));
        } else {
          console.warn('[section-termos] window.EffectCoordinator.speak não encontrado');
        }
      } catch (err) {
        console.error('[section-termos] Erro na datilografia para', el.tagName, err);
        el.textContent = text;
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.visibility = 'visible !important';
        el.style.display = 'block !important';
      }
      
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('[section-termos] Datilografia concluída');
    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1 !important';
        btn.style.visibility = 'visible !important';
        btn.style.cursor = 'pointer !important';
      }
    });
  };

  // Forçar inicialização
  window.TERMOS_READY = false;
  window.currentTermosPage = window.currentTermosPage || 1; // Inicializar página
  try {
    await runTypingChain();
    window.TERMOS_READY = true;
  } catch (err) {
    console.error('[section-termos] Erro na datilografia:', err);
    root.querySelectorAll('[data-typing="true"]').forEach(el => {
      el.textContent = getText(el);
      el.classList.add('typing-done');
      el.style.opacity = '1 !important';
      el.style.visibility = 'visible !important';
      el.style.display = 'block !important';
    });
    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.disabled = false;
        btn.style.opacity = '1 !important';
        btn.style.visibility = 'visible !important';
        btn.style.cursor = 'pointer !important';
      }
    });
  }

  console.log('[section-termos] Elementos encontrados:', {
    pg1: !!pg1, pg1Id: pg1?.id,
    pg2: !!pg2, pg2Id: pg2?.id,
    nextBtn: !!nextBtn, nextClass: nextBtn?.className,
    prevBtn: !!prevBtn, prevClass: prevBtn?.className,
    avancarBtn: !!avancarBtn, avancarClass: avancarBtn?.className
  });
};

// Registrar handler apenas uma vez
if (!window.TERMOS_LISTENER) {
  window.addEventListener('sectionLoaded', handler);
  window.TERMOS_LISTENER = true;
}
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
