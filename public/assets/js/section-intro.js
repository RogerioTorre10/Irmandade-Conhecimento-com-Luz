console.log('[section-intro.js] === SCRIPT LOADED ===');

(function () {
  'use strict';

  // Função para obter texto do elemento
  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // Função principal para aplicar efeitos
  async function applyEffects() {
    console.log('[section-intro.js] === APPLYING EFFECTS ===');

    // Verifica duplicação no DOM
    const introSections = document.querySelectorAll('#section-intro');
    console.log('[section-intro.js] Number of #section-intro elements:', introSections.length);
    if (introSections.length > 1) {
      console.warn('[section-intro.js] Multiple #section-intro elements detected. Keeping only the first.');
      for (let i = 1; i < introSections.length; i++) {
        introSections[i].remove();
      }
    }

    // Busca a seção
    const root = document.getElementById('section-intro');
    if (!root) {
      console.error('[section-intro.js] ERROR: #section-intro not found');
      window.toast?.('Error: section-intro not loaded.', 'error');
      return;
    }
    console.log('[section-intro.js] #section-intro found');

    // Busca os elementos
    const el1 = document.getElementById('intro-p1');
    const el2 = document.getElementById('intro-p2');
    const btn = document.getElementById('btn-avancar');
    console.log('[section-intro.js] Elements found:', { el1: !!el1, el2: !!el2, btn: !!btn });

    // Verifica se os elementos existem
    if (!el1 || !el2 || !btn) {
      console.error('[section-intro.js] ERROR: Missing critical elements:', { el1: !!el1, el2: !!el2, btn: !!btn });
      window.toast?.('Error: Missing intro elements.', 'error');
      return;
    }

    // Aplica estilos ao pergaminho
    root.style.cssText = `
      background: url('/assets/img/textura-pergaminho.jpg') center/cover !important;
      padding: 30px !important;
      border-radius: 12px !important;
      max-width: 600px !important;
      text-align: center !important;
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6) !important;
      display: block !important;
      opacity: 1 !important;
      visibility: visible !important;
      position: relative !important;
      z-index: 2 !important;
      border: 2px solid #8B4513 !important;
    `;
    console.log('[section-intro.js] Pergaminho styles applied');

    // Aplica estilos aos parágrafos
    [el1, el2].forEach(el => {
      el.style.cssText = `
        font-size: 18px !important;
        margin-bottom: 20px !important;
        color: #333 !important;
        opacity: 0 !important;
        visibility: visible !important;
        display: block !important;
        font-family: 'Times New Roman', serif !important;
      `;
    });
    console.log('[section-intro.js] Paragraph styles applied');

    // Aplica estilos ao botão
    btn.style.cssText = `
      padding: 8px 16px !important;
      background: linear-gradient(to bottom, #a0a0a0, #808080), url('/assets/img/textura-de-pedra.jpg') center/cover !important;
      background-blend-mode: overlay !important;
      color: #fff !important;
      border-radius: 8px !important;
      font-size: 18px !important;
      border: 3px solid #4a4a4a !important;
      box-shadow: inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6) !important;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.7) !important;
      opacity: 1 !important;
      visibility: visible !important;
      display: inline-block !important;
      cursor: pointer !important;
    `;
    console.log('[section-intro.js] Button styles applied');

    // Aplica datilografia
    const typingElements = [el1, el2];
    console.log('[section-intro.js] Typing elements:', typingElements.length);

    if (typingElements.length > 0 && typeof window.runTyping === 'function') {
      console.log('[section-intro.js] Starting typing animation');
      try {
        for (const el of typingElements) {
          if (el.classList.contains('typing-done')) {
            console.log('[section-intro.js] Skipping already processed:', el.id);
            continue;
          }
          const text = getText(el);
          console.log('[section-intro.js] Typing:', el.id, text.substring(0, 30) + '...');
          el.textContent = '';
          el.classList.add('typing-active');
          await new Promise((resolve) => {
            window.runTyping(el, text, resolve, {
              speed: Number(el.dataset.speed || 36),
              cursor: String(el.dataset.cursor || 'true') === 'true'
            });
          });
          el.classList.add('typing-done');
          el.style.opacity = '1';
          console.log('[section-intro.js] Typing completed:', el.id);
        }

        // Aplica TTS após datilografia
        if (typeof window.EffectCoordinator?.speak === 'function') {
          const fullText = typingElements.map(el => getText(el)).join(' ');
          window.EffectCoordinator.speak(fullText, { rate: 1.03, pitch: 1.0 });
          console.log('[section-intro.js] TTS activated:', fullText.substring(0, 50) + '...');
        } else {
          console.warn('[section-intro.js] EffectCoordinator.speak not available');
        }
      } catch (err) {
        console.error('[section-intro.js] Typing error:', err);
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
          el.style.opacity = '1';
        });
      }
    } else {
      console.warn('[section-intro.js] No typing elements or runTyping not available');
      typingElements.forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1';
      });
    }

    // Aplica efeito de vela
    if (typeof window.setupCandleFlame === 'function') {
      window.setupCandleFlame('media', 'flame-bottom-right');
      window.setupCandleFlame('media', 'flame-top-left');
      console.log('[section-intro.js] Candle flame effect applied for bottom-right and top-left');
    } else {
      console.warn('[section-intro.js] setupCandleFlame not available');
    }

    // Habilita o botão
    btn.disabled = false;
    console.log('[section-intro.js] Button enabled');
    console.log('[section-intro.js] === EFFECTS APPLIED ===');

    // Vincula o evento de clique ao botão
    btn.addEventListener('click', () => {
      console.log('[section-intro.js] Next button clicked');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
      }
    });
  }

  // Executa imediatamente
  try {
    console.log('[section-intro.js] DOM state:', document.readyState);
    window.__introBound = true; // Marca que o script foi carregado
    applyEffects();
  } catch (err) {
    console.error('[section-intro.js] Error in immediate initialization:', err);
  }
})();
