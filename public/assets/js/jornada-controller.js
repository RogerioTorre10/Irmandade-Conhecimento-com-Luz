(function () {
  'use strict';

  console.log('[JC.init] Initializing controller...');

  // Ordem das seções
  const sectionOrder = [
    'section-intro',
    'section-termos',
    'section-senha',
    'section-filme',
    'section-guia',
    'section-selfie',
    'section-perguntas',
    'section-final'
  ];

  // Função para obter texto do elemento
  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  // Função para aplicar datilografia e TTS
  async function applyTypingAndTTS(sectionId, root) {
    console.log('[JC.applyTypingAndTTS] Processing typing and TTS for:', sectionId);
    const typingElements = sectionId === 'section-intro' 
      ? [root.querySelector('#intro-p1'), root.querySelector('#intro-p2')]
      : [root.querySelector('#termos-p1'), root.querySelector('#termos-p2')];
    const validElements = typingElements.filter(el => {
      if (!el) {
        console.warn('[JC.applyTypingAndTTS] Element not found for:', sectionId);
        return false;
      }
      return el.dataset.typing === 'true' && !el.classList.contains('typing-done');
    });
    console.log('[JC.applyTypingAndTTS] Typing elements:', validElements.length, validElements.map(el => el?.id));

    if (validElements.length > 0 && typeof window.runTyping === 'function') {
      console.log('[JC.applyTypingAndTTS] Starting typing animation');
      try {
        for (const el of validElements) {
          if (el.classList.contains('typing-done')) {
            console.log('[JC.applyTypingAndTTS] Skipping already processed:', el.id);
            continue;
          }
          const text = getText(el);
          console.log('[JC.applyTypingAndTTS] Typing:', el.id, text.substring(0, 30) + '...');
          el.textContent = '';
          el.classList.add('typing-active');
          el.style.direction = 'ltr';
          el.style.textAlign = 'left';
          el.style.opacity = '1 !important'; // Garante visibilidade
          el.style.display = 'block !important'; // Força exibição
          await new Promise((resolve) => {
            window.runTyping(el, text, resolve, {
              speed: Number(el.dataset.speed || 36),
              cursor: String(el.dataset.cursor || 'true') === 'true'
            });
          });
          el.classList.add('typing-done');
          console.log('[JC.applyTypingAndTTS] Typing completed:', el.id);

          // Aplica TTS para o parágrafo atual
          if (typeof window.EffectCoordinator?.speak === 'function') {
            window.EffectCoordinator.speak(text, { rate: 1.03, pitch: 1.0 });
            console.log('[JC.applyTypingAndTTS] TTS activated for:', el.id, text.substring(0, 50) + '...');
            await new Promise(resolve => setTimeout(resolve, text.length * 50));
          } else {
            console.warn('[JC.applyTypingAndTTS] EffectCoordinator.speak not available');
          }
        }
      } catch (err) {
        console.error('[JC.applyTypingAndTTS] Typing error:', err);
        validElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
          el.style.opacity = '1 !important';
          el.style.display = 'block !important';
          el.style.direction = 'ltr';
          el.style.textAlign = 'left';
        });
      }
    } else {
      console.warn('[JC.applyTypingAndTTS] No valid typing elements or runTyping not available');
      validElements.forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1 !important';
        el.style.display = 'block !important';
        el.style.direction = 'ltr';
        el.style.textAlign = 'left';
      });
    }
  }

  // Função para anexar eventos aos botões
  function attachButtonEvents(sectionId, root) {
    console.log('[JC.attachButtonEvents] Attaching buttons for:', sectionId);
    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Buttons found:', buttons.length, Array.from(buttons).map(btn => btn.id));
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      btn.disabled = false; // Garante que o botão não esteja desabilitado
      btn.style.opacity = '1 !important'; // Garante visibilidade total
      btn.style.cssText = `
        padding: 10px 20px !important;
        background: linear-gradient(to bottom, #a0a0a0, #808080), url('/assets/img/textura-de-pedra.jpg') center/cover !important;
        background-blend-mode: overlay !important;
        color: #fff !important;
        border-radius: 8px !important;
        font-size: 20px !important;
        border: 3px solid #4a4a4a !important;
        box-shadow: inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6) !important;
        text-shadow: 1px 1px 3px rgba(0,0,0,0.7) !important;
        opacity: 1 !important;
        visibility: visible !important;
        display: inline-block !important;
        cursor: pointer !important;
        transition: transform 0.2s ease, box-shadow 0.2s ease !important;
      `;
      btn.addEventListener('click', () => {
        console.log('[JC.attachButtonEvents] Button clicked:', action, btn.id);
        if (action === 'avancar') {
          const currentIndex = sectionOrder.indexOf(sectionId);
          const nextSection = sectionOrder[currentIndex + 1];
          console.log('[JC.attachButtonEvents] Navigating to:', nextSection);
          if (nextSection) {
            show(nextSection);
          } else {
            console.warn('[JC.attachButtonEvents] No next section, redirecting to /termos');
            window.location.href = '/termos';
          }
        }
      });
      btn.addEventListener('mouseover', () => {
        btn.style.transform = 'scale(1.05)';
        btn.style.boxShadow = '0 8px 16px rgba(0,0,0,0.7)';
      });
      btn.addEventListener('mouseout', () => {
        btn.style.transform = 'scale(1)';
        btn.style.boxShadow = 'inset 0 3px 6px rgba(0,0,0,0.4), 0 6px 12px rgba(0,0,0,0.6)';
      });
    });
  }

  // Função para processar lógica da seção
  function handleSectionLogic(sectionId, root) {
    console.log('[JC.handleSectionLogic] Processing logic for:', sectionId);
    if (sectionId === 'section-intro' || sectionId === 'section-termos') {
      root.style.cssText = `
        background: transparent !important; /* Fundo transparente para exibir o pergaminho do #jornada-canvas */
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
        color: #333 !important; /* Contraste com o pergaminho */
      `;
      applyTypingAndTTS(sectionId, root);
      attachButtonEvents(sectionId, root);
    }
  }

  // Função para exibir uma seção
  async function show(sectionId) {
    console.log('[JC.show] Starting display for:', sectionId);
    try {
      console.log('[JC.show] Starting carregarEtapa for:', sectionId.replace('section-', ''));
      const section = await window.carregarEtapa(sectionId.replace('section-', ''));
      console.log('[JC.show] carregarEtapa completed, element #', sectionId, ':', !!section);
      if (section) {
        console.log('[JC.show] Content of #jornada-content-wrapper:', document.getElementById('jornada-content-wrapper')?.innerHTML.slice(0, 120) + '...');
        handleSectionLogic(sectionId, section);
        document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId } }));
        console.log('[JC.show] Event section:shown fired for:', sectionId);
        console.log('[JC.show] Displayed successfully:', sectionId);
      } else {
        console.error('[JC.show] Section element is null for:', sectionId);
      }
    } catch (err) {
      console.error('[JC.show] Error showing section:', sectionId, err);
    }
  }

  // Função para definir a ordem das seções
  function setOrder(order) {
    console.log('[JC.setOrder] Setting section order:', order);
    sectionOrder.length = 0;
    sectionOrder.push(...order);
  }

  // Inicializa o controlador
  function init() {
    console.log('[JC.init] Controller initialized successfully');
    window.JC = { show, setOrder };
    // Carrega a seção inicial
    show('section-intro');
  }

  init();
})();
