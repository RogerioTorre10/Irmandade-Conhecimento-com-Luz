(function () {
  'use strict';
  window.JC = window.JC || {};
  const existingJC = { ...window.JC };

  const sectionOrder = [
    'section-intro',
    'section-termos1',
    'section-termos2',
    'section-senha',
    'section-guia',
    'section-selfie',
    'section-perguntas',
    'section-final'
  ];

  function attachButtonEvents(sectionId, root) {
    const buttons = root.querySelectorAll('[data-action]');
    buttons.forEach(btn => {
      const action = btn.dataset.action;
      btn.disabled = false;
      btn.classList.add('btn', 'btn-primary', 'btn-stone');
      btn.addEventListener('click', () => {
        if (action === 'avancar') {
          const currentIndex = sectionOrder.indexOf(sectionId);
          const nextSection = sectionOrder[currentIndex + 1];
          if (nextSection) {
            JC.show(nextSection);
          } else {
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
    if (
      sectionId === 'section-intro' ||
      sectionId === 'section-termos1' ||
      sectionId === 'section-termos2'
    ) {
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
    try {
      const cleanId = sectionId.replace(/^section-/, '');
      const section = await window.carregarEtapa(cleanId);
      if (section) {
        handleSectionLogic(sectionId, section);
        document.dispatchEvent(new CustomEvent('section:shown', {
          detail: { sectionId, node: section }
        }));
      }
    } catch (err) {
      console.error('[JC.show] Error showing section:', sectionId, err);
    }
  }

  function goNext() {
    const currentIndex = sectionOrder.indexOf(window.JC.currentSection || 'section-intro');
    const nextSection = sectionOrder[currentIndex + 1];
    if (nextSection) {
      show(nextSection);
    } else {
      window.location.href = '/termos';
    }
  }

  function setOrder(order) {
    sectionOrder.length = 0;
    sectionOrder.push(...order);
  }

  function init() {
    window.JC = {
      ...existingJC,
      init,
      show,
      goNext,
      setOrder,
      attachButtonEvents,
      handleSectionLogic
    };
    window.JC.currentSection = 'section-intro';
    window.JC.show('section-intro');
  }

  document.addEventListener('section:shown', e => {
    const sectionId = e.detail.sectionId;
    const node = e.detail.node;
    if (node) {
      window.JC.currentSection = sectionId;
      attachButtonEvents(sectionId, node);
      handleSectionLogic(sectionId, node);
    }
  });

  init();
})();
