(function () {
  'use strict';
  window.JC = window.JC || {};
  const existingJC = { ...window.JC };

  console.log('[JC.init] Initializing controller...');
  console.log('[JC] Estado inicial de JC:', window.JC); // Log para depuração

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
    // Não aplicar efeitos, deixar para section-intro.js e section-termos.js
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

  // Função init pública: agora ela será incluída no JC e pode ser chamada externamente
  function init() {
    console.log('[JC.init] Controller initialized successfully');
    // Aqui você pode adicionar lógica global de inicialização, ex.: carregar a primeira seção
    // Exemplo: JC.show('section-intro'); // Descomente se quiser auto-iniciar
    console.log('[JC.init] Inicialização global executada');
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

  // Agora define JC incluindo a função init
  window.JC = {
    init,  // <-- Isso corrige o problema: init agora é pública em JC.init
    show,
    setOrder,
    attachButtonEvents,
    handleSectionLogic
  };

  console.log('[JC] Estado final de JC:', window.JC); // Log para depuração
  console.log('[JC] JC.init disponível:', typeof window.JC.init); // Deve ser 'function'
})();
