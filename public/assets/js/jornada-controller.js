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
    const typingElements = root.querySelectorAll('[data-typing="true"]:not(.typing-done)');
    console.log('[JC.applyTypingAndTTS] Typing elements:', typingElements.length);

    if (typingElements.length > 0 && typeof window.runTyping === 'function') {
      console.log('[JC.applyTypingAndTTS] Starting typing animation');
      try {
        for (const el of typingElements) {
          if (el.classList.contains('typing-done')) {
            console.log('[JC.applyTypingAndTTS] Skipping already processed:', el.id);
            continue;
          }
          const text = getText(el);
          console.log('[JC.applyTypingAndTTS] Typing:', el.id, text.substring(0, 30) + '...');
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
          console.log('[JC.applyTypingAndTTS] Typing completed:', el.id);
        }

        // Aplica TTS após datilografia
        if (typeof window.EffectCoordinator?.speak === 'function') {
          const fullText = Array.from(typingElements).map(el => getText(el)).join(' ');
          window.EffectCoordinator.speak(fullText, { rate: 1.03, pitch: 1.0 });
          console.log('[JC.applyTypingAndTTS] TTS activated:', fullText.substring(0, 50) + '...');
        } else {
          console.warn('[JC.applyTypingAndTTS] EffectCoordinator.speak not available');
        }
      } catch (err) {
        console.error('[JC.applyTypingAndTTS] Typing error:', err);
        typingElements.forEach(el => {
          el.textContent = getText(el);
          el.classList.add('typing-done');
          el.style.opacity = '1';
        });
      }
    } else {
      console.warn('[JC.applyTypingAndTTS] No typing elements or runTyping not available');
      typingElements.forEach(el => {
        el.textContent = getText(el);
        el.classList.add('typing-done');
        el.style.opacity = '1';
      });
    }
  }

  // Função para anexar eventos aos botões
  function attachButtonEvents(sectionId, root) {
    console.log('[JC.attachButtonEvents] Attaching buttons for:', sectionId);
    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Buttons found:', buttons.length);
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.style.opacity = '1';
      btn.style.cursor = 'pointer';
      btn.addEventListener('click', () => {
        console.log('[JC.attachButtonEvents] Button clicked:', action);
        if (action === 'avancar') {
          const currentIndex = sectionOrder.indexOf(sectionId);
          const nextSection = sectionOrder[currentIndex + 1];
          if (nextSection) {
            show(nextSection);
          } else {
            window.location.href = '/termos';
          }
        }
      });
    });
  }

  // Função para processar lógica da seção
  function handleSectionLogic(sectionId, root) {
    console.log('[JC.handleSectionLogic] Processing logic for:', sectionId);
    if (sectionId === 'section-intro') {
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
      console.log('[JC.show] Content of #jornada-content-wrapper:', document.getElementById('jornada-content-wrapper')?.innerHTML.slice(0, 120) + '...');
      handleSectionLogic(sectionId, section);
      document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId } }));
      console.log('[JC.show] Event section:shown fired for:', sectionId);
      console.log('[JC.show] Displayed successfully:', sectionId);
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
  }

  init();
})();
