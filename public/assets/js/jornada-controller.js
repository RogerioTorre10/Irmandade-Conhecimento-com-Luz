(function () {
  'use strict';
  // Preservar JC existente
  window.JC = window.JC || {};
  const existingJC = { ...window.JC };

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

  function getText(el) {
    return (el?.dataset?.text ?? el?.textContent ?? '').trim();
  }

  async function applyTypingAndTTS(sectionId, root) {
    console.log('[JC.applyTypingAndTTS] Desativado para:', sectionId);
  }

  function attachButtonEvents(sectionId, root) {
    console.log('[JC.attachButtonEvents] Attaching buttons for:', sectionId);
    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Buttons found:', buttons.length, Array.from(buttons).map(btn => btn.id));
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.classList.add('btn', 'btn-primary', 'btn-stone');
      btn.addEventListener('click', () => {
        console.log('[JC.attachButtonEvents] Button clicked:', action, btn.id);
        if (action === 'avancar') {
          const currentIndex = sectionOrder.indexOf(sectionId);
          const nextSection = sectionOrder[currentIndex + 1];
          console.log('[JC.attachButtonEvents] Navigating to:', nextSection);
          if (nextSection) {
            JC.show(nextSection);
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

  function handleSectionLogic(sectionId, root) {
    console.log('[JC.handleSectionLogic] Processing logic for:', sectionId);
    if (sectionId === 'section-intro' || sectionId === 'section-termos') {
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
      attachButtonEvents(sectionId, root);
    }
  }

  async function show(sectionId) {
    console.log('[JC.show] Starting display for:', sectionId);
    try {
      const cleanId = sectionId.replace(/^section-/, '');
      console.log('[JC.show] Starting carregarEtapa for:', cleanId);
      const section = await window.carregarEtapa(cleanId);
      console.log('[JC.show] carregarEtapa completed, element #', sectionId, ':', !!section);
      if (section) {
        console.log('[JC.show] Content of #jornada-content-wrapper:', document.getElementById('jornada-content-wrapper')?.innerHTML.slice(0, 120) + '...');
        handleSectionLogic(sectionId, section);
        document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId, node: section } }));
        console.log('[JC.show] Event section:shown fired for:', sectionId);
        console.log('[JC.show] Displayed successfully:', sectionId);
      } else {
        console.error('[JC.show] Section element is null for:', sectionId);
      }
    } catch (err) {
      console.error('[JC.show] Error showing section:', sectionId, err);
    }
  }

  function setOrder(order) {
    console.log('[JC.setOrder] Setting section order:', order);
    sectionOrder.length = 0;
    sectionOrder.push(...order);
  }

  function init() {
    console.log('[JC.init] Controller initialized successfully');
    // Mesclar com JC existente
    window.JC = {
      ...existingJC,
      init,
      show,
      setOrder,
      attachButtonEvents,
      handleSectionLogic
    };
    // Iniciar com section-intro
    window.JC.show('section-intro');
  }

  // Reagir automaticamente ao evento de exibição de seção
  document.addEventListener('section:shown', (e) => {
    const sectionId = e.detail.sectionId;
    const node = e.detail.node;
    if (node) {
      attachButtonEvents(sectionId, node);
      handleSectionLogic(sectionId, node);
    }
  });

  init();
})();
