(function () {
  'use strict';

  let currentSection = null;

  async function show(sectionId) {
    if (currentSection === sectionId) {
      console.log('[JC.show] Seção já exibida, ignorando:', sectionId);
      return;
    }
    currentSection = sectionId;
    console.log('[JC.show] Starting display for:', sectionId, new Error().stack);

    try {
      console.log('[JC.show] Starting carregarEtapa for:', sectionId);
      const section = await window.carregarEtapa(sectionId);
      console.log('[JC.show] carregarEtapa completed, element #', sectionId, ':', !!section);

      const wrapper = document.getElementById('jornada-content-wrapper');
      console.log('[JC.show] Content of #jornada-content-wrapper:', wrapper?.innerHTML);

      if (section) {
        handleSectionLogic(sectionId, section);
        document.dispatchEvent(new CustomEvent('section:shown', { detail: { sectionId, node: section } }));
        console.log('[JC.show] Event section:shown fired for:', sectionId);
        console.log('[JC.show] Displayed successfully:', sectionId);
      } else {
        console.error('[JC.show] Failed to load section:', sectionId);
      }
    } catch (e) {
      console.error('[JC.show] Error in show:', sectionId, e);
    }
  }

  function handleSectionLogic(sectionId, root) {
    console.log('[JC.handleSectionLogic] Processing logic for:', sectionId);
    attachButtonEvents(sectionId, root);
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  function attachButtonEvents(sectionId, root) {
    console.log('[JC.attachButtonEvents] Attaching buttons for:', sectionId);
    const buttons = root.querySelectorAll('[data-action]');
    console.log('[JC.attachButtonEvents] Buttons found:', buttons.length, Array.from(buttons).map(btn => btn.id || btn.dataset.action));
    buttons.forEach(btn => {
      if (btn.dataset.hasEvents) return;
      btn.dataset.hasEvents = 'true';
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.classList.add('btn', 'btn-primary', 'btn-stone');
      const handleClick = debounce(() => {
        console.log('[JC.attachButtonEvents] Button clicked:', action, btn.id || btn.dataset.action);
        if (action === 'avancar' || action === 'termos-next' || action === 'select-guia') {
          const sectionOrder = window.JC.sectionOrder || ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-perguntas', 'section-final'];
          const currentIndex = sectionOrder.indexOf(sectionId);
          const nextSection = sectionOrder[currentIndex + 1];
          console.log('[JC.attachButtonEvents] Navigating to:', nextSection);
          if (nextSection) {
            window.JC.show(nextSection);
          } else {
            console.warn('[JC.attachButtonEvents] No next section, redirecting to /termos');
            window.location.href = '/termos';
          }
        }
      }, 300);
      btn.addEventListener('click', handleClick);
      btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.click();
        console.log('[JC.attachButtonEvents] Toque detectado em:', btn.id || btn.dataset.action);
      }, { passive: false });
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

  function init() {
    console.log('[JC.init] Initializing jornada...');
    try {
      const sectionOrder = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-perguntas', 'section-final'];
      window.JC.setOrder(sectionOrder);
      window.JC.show('section-intro');
    } catch (e) {
      console.error('[JC.init] Error during initialization:', e);
    }
  }

  // Exportar JC
  window.JC = window.JC || {};
  window.JC.show = show;
  window.JC.setOrder = function (order) {
    console.log('[JC.setOrder] Setting section order:', order);
    window.JC.sectionOrder = order;
  };
  window.JC.init = init;

  console.log('[jornada-controller.js] Loaded');
})();
