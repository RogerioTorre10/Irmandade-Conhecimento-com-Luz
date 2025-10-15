(function () {
  'use strict';

  if (window.__termosBound) return;
  window.__termosBound = true;

  let TERMOS_READY = false;
  let currentTermosPage = 1; // Controla se está em termos-p1 (1) ou termos-p2 (2)

  // Função para adicionar evento único
  const once = (el, ev, fn) => {
    if (!el) return;
    const h = (e) => {
      el.removeEventListener(ev, h);
      fn(e);
    };
    el.addEventListener(ev, h);
  };

  // Função para aguardar elemento no DOM
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

  // Função para obter texto do elemento
  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // Extrair sectionId e node do evento
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
        root = await waitForElement('#section-termos', { 
          within: document.getElementById('jornada-content-wrapper') || document, 
          timeout: 10000 
        });
      } catch (e) {
        window.toast?.('Erro: Seção section-termos não carregada.', 'error');
        console.error('[section-termos] Section not found:', e);
        return;
      }
    }

    // Buscar elementos
    let pg1, pg2, nextBtn, prevBtn, avancarBtn;
    try {
      pg1 = await waitForElement('#termos-p1', { within: root, timeout: 10000 });
      pg2 = await waitForElement('#termos-p2', { within: root, timeout: 10000 });
      nextBtn = await waitForElement('#termos-next', { within: root, timeout: 10000 });
      prevBtn = await waitForElement('#termos-prev', { within: root, timeout: 10000 });
      avancarBtn = await waitForElement('#termos-avancar', { within: root, timeout: 10000 });
    } catch (e) {
      console.error('[section-termos] Elements not found:', e);
      window.toast?.('Falha ao carregar os elementos da seção Termos.', 'error');

      // Criar placeholders apenas se necessário
      pg1 = pg1 || root.querySelector('#termos-p1') || document.createElement('p');
      pg2 = pg2 || root.querySelector('#termos-p2') || document.createElement('p');
      nextBtn = nextBtn || root.querySelector('#termos-next') || document.createElement('button');
      prevBtn = prevBtn || root.querySelector('#termos-prev') || document.createElement('button');
      avancarBtn = avancarBtn || root.querySelector('#termos-avancar') || document.createElement('button');

      if (!pg1.id) {
        pg1.id = 'termos-p1';
        pg1.classList.add('intro-paragraph');
        pg1.dataset.typing = 'true';
        pg1.textContent = 'Bem-vindo aos Termos e Condições...';
        root.appendChild(pg1);
      }
      if (!pg2.id) {
        pg2.id = 'termos-p2';
        pg2.classList.add('intro-paragraph');
        pg2.dataset.typing = 'true';
        pg2.textContent = 'Por favor, leia atentamente...';
        root.appendChild(pg2);
      }
      if (!nextBtn.id) {
        nextBtn.id = 'termos-next';
        nextBtn.classList.add('btn', 'btn-primary', 'btn-stone');
        nextBtn.dataset.action = 'termos-next';
        nextBtn.textContent = 'Próximo';
        root.appendChild(nextBtn);
      }
      if (!prevBtn.id) {
        prevBtn.id = 'termos-prev';
        prevBtn.classList.add('btn', 'btn-primary', 'btn-stone');
        prevBtn.dataset.action = 'termos-prev';
        prevBtn.textContent = 'Anterior';
        root.appendChild(prevBtn);
      }
      if (!avancarBtn.id) {
        avancarBtn.id = 'termos-avancar';
        avancarBtn.classList.add('btn', 'btn-primary', 'btn-stone');
        avancarBtn.dataset.action = 'avancar';
        avancarBtn.textContent = 'Avançar';
        root.appendChild(avancarBtn);
      }
    }

    // Forçar visibilidade inicial
    [pg1, pg2].forEach((el, i) => {
      if (el) {
        el.style.color = '#fff !important';
        el.style.opacity = i === 0 ? '1 !important' : '0 !important'; // Mostrar apenas termos-p1 inicialmente
        el.style.visibility = 'visible !important';
        el.style.display = i === 0 ? 'block !important' : 'none !important';
        console.log(`[section-termos] Texto ${i+1} inicializado:`, el.id, el.textContent?.substring(0, 50));
      }
    });

    // Estilizar root
    root.style.cssText = `
      background: transparent !important;
      padding: 30px !important;
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
    `;

    // Estilizar botões
    [nextBtn, prevBtn, avancarBtn].forEach(btn => {
      if (btn) {
        btn.classList.add('btn', 'btn-primary', 'btn-stone');
        btn.disabled = false;
        btn.style.opacity = '1 !important';
        btn.style.cursor = 'pointer !important';
        console.log('[section-termos] Botão habilitado:', btn.id || btn.textContent);
      }
    });

    // Configurar chama
    if (typeof window.setupCandleFlame === 'function') {
      window.setupCandleFlame('media', 'flame-bottom-right');
    }

    // Lógica de navegação entre termos-p1 e termos-p2
    once(nextBtn, 'click', () => {
      if (currentTermosPage === 1 && pg2) {
        pg1.style.display = 'none !important';
        pg2.style.display = 'block !important';
        pg2.style.opacity = '1 !important';
        pg2.scrollIntoView({ behavior: 'smooth' });
        currentTermosPage = 2;
        console.log('[section-termos] Mostrando termos-p2');
        avancarBtn.textContent = 'Avançar para Senha';
      }
    });

    once(prevBtn, 'click', () => {
      if (currentTermosPage === 2 && pg1) {
        pg2.style.display = 'none !important';
        pg1.style.display = 'block !important';
        pg1.style.opacity = '1 !important';
        currentTermosPage = 1;
        console.log('[section-termos] Voltando para termos-p1');
        avancarBtn.textContent = 'Avançar';
      }
    });

    once(avancarBtn, 'click', () => {
      if (currentTermosPage === 2) {
        console.log('[section-termos] Avançando para section-senha');
        if (typeof window.JC?.show === 'function') {
          window.JC.show('section-senha');
        } else {
          window.location.href = '/senha';
          console.warn('[section-termos] Fallback navigation to /senha');
        }
      } else {
        // Mostrar termos-p2 se ainda está em termos-p1
        if (pg2 && currentTermosPage === 1) {
          pg1.style.display = 'none !important';
          pg2.style.display = 'block !important';
          pg2.style.opacity = '1 !important';
          currentTermosPage = 2;
          console.log('[section-termos] Mostrando termos-p2 antes de avançar');
          avancarBtn.textContent = 'Avançar para Senha';
        }
      }
    });

    // Função de datilografia simplificada
    const runTypingChain = async () => {
      console.log('[section-termos] Iniciando datilografia...');
      const typingElements = [pg1, pg2].filter(el => el && el.dataset.typing === 'true' && !el.classList.contains('typing-done'));
      
      for (let el of typingElements) {
        const text = getText(el);
        console.log('[section-termos] Datilografando:', el.id, text.substring(0, 50));
        
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
        
        // TTS
        if (typeof window.EffectCoordinator?.speak === 'function') {
          window.EffectCoordinator.speak(text, { rate: 1.03, pitch: 1.0 });
          console.log('[section-termos] TTS ativado para:', el.id);
          await new Promise(resolve => setTimeout(resolve, text.length * 50));
        }
      }
      
      console.log('[section-termos] Datilografia concluída');
      // Garantir que botões estejam habilitados
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) btn.disabled = false;
      });
    };

    if (!TERMOS_READY) {
      try {
        await runTypingChain();
        TERMOS_READY = true;
      } catch (err) {
        console.error('[section-termos] Erro na datilografia:', err);
        // Forçar visibilidade em caso de erro
        [pg1, pg2].forEach((el, i) => {
          if (el) {
            el.textContent = getText(el);
            el.classList.add('typing-done');
            el.style.opacity = i === 0 ? '1 !important' : currentTermosPage === 2 ? '1 !important' : '0 !important';
            el.style.color = '#fff !important';
            el.style.display = i === 0 ? 'block !important' : currentTermosPage === 2 ? 'block !important' : 'none !important';
          }
        });
        [nextBtn, prevBtn, avancarBtn].forEach(btn => {
          if (btn) btn.disabled = false;
        });
      }
    } else {
      [nextBtn, prevBtn, avancarBtn].forEach(btn => {
        if (btn) btn.disabled = false;
      });
    }

    // Debug: Logar elementos
    console.log('[section-termos] Elementos encontrados:', {
      pg1: !!pg1, pg1Id: pg1?.id,
      pg2: !!pg2, pg2Id: pg2?.id,
      nextBtn: !!nextBtn, nextId: nextBtn?.id,
      prevBtn: !!prevBtn, prevId: prevBtn?.id,
      avancarBtn: !!avancarBtn, avancarId: avancarBtn?.id
    });
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
