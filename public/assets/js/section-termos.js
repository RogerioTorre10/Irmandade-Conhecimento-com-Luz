(function () {
  'use strict';

  if (window.__termosBound) return;
  window.__termosBound = true;

  let TERMOS_READY = false;

  const once = (el, ev, fn) => {
    if (!el) {
      console.warn('[section-termos.js] Elemento para evento não encontrado:', ev);
      return;
    }
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  async function waitForElement(selector, { within = document, timeout = 5000, step = 50 } = {}) {
    const start = performance.now();
    return new Promise((resolve, reject) => {
      const tick = () => {
        let el = within.querySelector(selector);
        
        if (!el && within !== document) {
          el = document.querySelector(`#jornada-content-wrapper ${selector}`);
        }
        
        if (el) {
          console.log(`[waitForElement] Elemento ${selector} encontrado!`);
          return resolve(el);
        }
        
        if (performance.now() - start >= timeout) {
          console.error(`[waitForElement] Timeout após ${timeout}ms para ${selector}`);
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
    console.log('[section-termos.js] Evento recebido:', { sectionId, hasNode: !!node });
    if (sectionId !== 'section-termos') return;

    console.log('[section-termos.js] Ativando termos');

    let root = node || document.getElementById('section-termos');
    if (!root) {
      try {
        root = await waitForElement('#section-termos', { within: document.getElementById('jornada-content-wrapper') || document, timeout: 10000 });
        console.log('[section-termos.js] Root encontrado:', root.outerHTML.slice(0, 200) + '...');
      } catch (e) {
        console.error('[section-termos.js] Root da termos não encontrado:', e);
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        return;
      }
    }

    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      pg1 = root.querySelector('#termos-pg1');
      pg2 = root.querySelector('#termos-pg2');
      nextBtn = await waitForElement('[data-action="termos-next"]', { within: root, timeout: 5000 });
      prevBtn = await waitForElement('[data-action="termos-prev"]', { within: root, timeout: 5000 });
      avancarBtn = await waitForElement('[data-action="avancar"]', { within: root, timeout: 5000 });
    } catch (e) {
      console.error('[section-termos.js] Falha ao esperar pelos elementos essenciais de botão:', e);
      window.toast?.('Falha ao carregar os botões da seção Termos. Verifique o HTML.', 'error');
      pg1 = pg1 || document.createElement('div');
      pg2 = pg2 || document.createElement('div');
      nextBtn = nextBtn || document.createElement('button');
      prevBtn = prevBtn || document.createElement('button');
      avancarBtn = avancarBtn || document.createElement('button');
    }

    console.log('[section-termos.js] Elementos encontrados:', { pg1: !!pg1, pg2: !!pg2, nextBtn: !!nextBtn, prevBtn: !!prevBtn, avancarBtn: !!avancarBtn });

    try {
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else if (typeof window.showSection === 'function') {
        window.showSection('section-termos');
      } else {
        root.classList.remove('hidden');
        root.style.display = 'flex';
      }
    } catch (err) {
      console.warn('[section-termos.js] Falha ao exibir seção:', err);
      root.classList.remove('hidden');
      root.style.display = 'flex';
    }
    
    // Adiciona estilização de textura de pedra ao botão "avancarBtn"
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

    // Desativa os botões antes do typing (serão ativados após)
    nextBtn.disabled = true;
    prevBtn.disabled = true;
    avancarBtn.disabled = true;

    const runTypingChain = async () => {
      console.log('[section-termos.js] Iniciando runTypingChain');
      const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)'); 
      if (typingElements.length === 0) {
        console.warn('[section-termos.js] Nenhum elemento com [data-typing="true"] encontrado');
        // Se não houver typing, garante que os botões serão ativados
        nextBtn.disabled = false;
        prevBtn.disabled = false;
        avancarBtn.disabled = false;
        return;
      }
      
      if (typeof window.runTyping === 'function') {
        try {
          for (const el of typingElements) {
            const text = getText(el);
            el.textContent = '';
            el.classList.add('typing-active');
            await new Promise((resolve) => {
              window.runTyping(el, text, resolve, { speed: Number(el.dataset.speed || 40), cursor: String(el.dataset.cursor || 'true') === 'true' });
            });
            el.classList.add('typing-done');
            console.log(`[section-termos.js] Typing concluído para ${el.tagName}${el.id ? '#' + el.id : ''}`);
          }
        } catch (err) {
          console.warn('[section-termos.js] Erro no runTyping:', err);
          typingElements.forEach(el => {
            el.textContent = getText(el);
            el.classList.add('typing-done');
          });
        }
      } else {
        console.log('[section-termos.js] Fallback: sem efeitos');
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
        });
      }
      
      // Reativa os botões após o typing
      nextBtn.disabled = false;
      prevBtn.disabled = false;
      avancarBtn.disabled = false;
    };

    if (!TERMOS_READY) {
        try {
            await runTypingChain();
            TERMOS_READY = true;
        } catch (err) {
            console.warn('[section-termos.js] Typing chain falhou', err);
            nextBtn.disabled = false;
            prevBtn.disabled = false;
            avancarBtn.disabled = false;
        }
    } else {
        console.log('[section-termos.js] Termos já preparado, reativando botões.');
        nextBtn.disabled = false;
        prevBtn.disabled = false;
        avancarBtn.disabled = false;
    }
  };

  const bind = () => {
    document.removeEventListener('sectionLoaded', handler);
    document.removeEventListener('section:shown', handler);
    document.addEventListener('sectionLoaded', handler, { passive: true });
    document.addEventListener('section:shown', handler, { passive: true });
    console.log('[section-termos.js] Handler ligado');

    const visibleTermos = document.querySelector('#section-termos:not(.hidden)');
    if (visibleTermos) {
      handler({ detail: { sectionId: 'section-termos', node: visibleTermos } });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
