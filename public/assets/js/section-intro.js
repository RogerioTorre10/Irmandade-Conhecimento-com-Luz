console.log('[section-intro.js] === SCRIPT LOADED ===');

(function () {
  'use strict';

  // Função para obter texto do elemento
  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // Função principal para aplicar datilografia e TTS
  async function applyEffects() {
    console.log('[section-intro.js] === APPLYING EFFECTS ===');

    // Busca a seção
    const root = document.getElementById('section-intro');
    if (!root) {
      console.error('[section-intro.js] ERROR: #section-intro not found');
      return;
    }
    console.log('[section-intro.js] #section-intro found');

    // Busca os elementos
    const el1 = root.querySelector('#intro-p1');
    const el2 = root.querySelector('#intro-p2');
    const btn = root.querySelector('#btn-avancar');
    console.log('[section-intro.js] Elements found:', { el1: !!el1, el2: !!el2, btn: !!btn });

    if (!el1 || !el2 || !btn) {
      console.warn('[section-intro.js] WARNING: Some elements missing, creating fallback');
      // Cria fallback se necessário
      const wrapper = root.querySelector('#jornada-content-wrapper') || root.appendChild(document.createElement('div'));
      wrapper.id = 'jornada-content-wrapper';
      wrapper.className = 'intro-wrap';
      
      if (!el1) {
        el1 = wrapper.appendChild(Object.assign(document.createElement('div'), {
          id: 'intro-p1',
          className: 'intro-paragraph',
          textContent: 'Bem-vindo à Jornada Conhecimento com Luz.',
          dataset: { typing: 'true', speed: '36', cursor: 'true' }
        }));
      }
      if (!el2) {
        el2 = wrapper.appendChild(Object.assign(document.createElement('div'), {
          id: 'intro-p2',
          className: 'intro-paragraph',
          textContent: 'Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.',
          dataset: { typing: 'true', speed: '36', cursor: 'true' }
        }));
      }
      if (!btn) {
        btn = wrapper.appendChild(Object.assign(document.createElement('button'), {
          id: 'btn-avancar',
          className: 'btn btn-primary btn-stone',
          textContent: 'Iniciar',
          dataset: { action: 'avancar' },
          disabled: true
        }));
      }
      console.log('[section-intro.js] Fallback elements created');
    }

    // Aplica estilos ao botão
    console.log('[section-intro.js] Applying button styles');
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
      opacity: 1 !important;
      visibility: visible;
      display: inline-block;
      cursor: pointer;
    `;

    // Exibe a seção
    root.classList.remove('hidden');
    root.style.display = 'block';
    console.log('[section-intro.js] Section displayed');

    // Vincula o evento de clique ao botão
    btn.addEventListener('click', () => {
      console.log('[section-intro.js] Next button clicked');
      if (typeof window.JC?.show === 'function') {
        window.JC.show('section-termos');
      } else {
        window.location.href = '/termos';
      }
    });

    // Aplica datilografia
    const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
    console.log('[section-intro.js] Typing elements:', typingElements.length);

    if (typingElements.length > 0 && typeof window.runTyping === 'function') {
      console.log('[section-intro.js] Starting typing animation');
      
      try {
        for (const el of typingElements) {
          if (el.classList.contains('typing-done')) continue;
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
          console.log('[section-intro.js] Typing completed:', el.id);
        }

        // Aplica TTS
        if (typeof window.EffectCoordinator?.speak === 'function') {
          const fullText = Array.from(typingElements).map(el => getText(el)).join(' ');
          window.EffectCoordinator.speak(fullText, { rate: 1.03, pitch: 1.0 });
          console.log('[section-intro.js] TTS activated');
        }
      } catch (err) {
        console.error('[section-intro.js] Typing error:', err);
      }
    }

    btn.disabled = false;
    console.log('[section-intro.js] Button enabled');
    console.log('[section-intro.js] === EFFECTS APPLIED ===');
  }

  // Executa imediatamente
  console.log('[section-intro.js] DOM state:', document.readyState);
  applyEffects();
})();
