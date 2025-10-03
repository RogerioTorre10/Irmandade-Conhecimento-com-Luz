(function (global) {
  'use strict';

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let currentIndex = 0;

  JC.setOrder = function (order) {
    sectionOrder = order;
  };

  JC.goNext = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx >= 0 && idx < sectionOrder.length - 1) {
      const nextId = sectionOrder[idx + 1];
      JC.show(nextId);
    }
  };

  JC.goPrev = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx > 0) {
      const prevId = sectionOrder[idx - 1];
      JC.show(prevId);
    }
  };

 JC.show = function (id) {
  console.log('[JornadaController] Mostrando seção:', id);
  const all = document.querySelectorAll('div[id^="section-"]');
  const target = document.getElementById(id);
  if (!target) {
    console.warn('[JornadaController] Seção não encontrada:', id);
    return;
  }

  all.forEach(s => s.classList.add(HIDE_CLASS));
  target.classList.remove(HIDE_CLASS);
  global.__currentSectionId = id;
  global.G = global.G || {};
  global.G.__typingLock = false;

  setTimeout(() => {
    console.log('[JornadaController] Processando elementos [data-typing] em:', id);
    const textElements = target.querySelectorAll('[data-typing="true"]');
    console.log('[JornadaController] Elementos [data-typing] encontrados:', textElements.length);
    textElements.forEach(el => {
      if (el.offsetParent !== null) {
        const selector = el.id ? `#${el.id}` : `.${el.className.split(' ')[0] || 'text'}`;
        console.log('[JornadaController] Chamando runTyping para:', selector);
        global.runTyping(selector, () => {
          console.log('[JornadaController] Datilografia concluída para:', selector);
        });
      }
    });

    const btns = target.querySelectorAll(
      '[data-action="avancar"], .btn-avancar, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney'
    );
    console.log('[JornadaController] Botões encontrados:', btns.length);
    btns.forEach(btn => {
      if (!btn.dataset.clickAttached) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const inTermos = !!e.target.closest('#section-termos');
          console.log('[JornadaController] Botão clicado, inTermos:', inTermos);
          console.log('[JornadaController] Avançando para a próxima seção');
          if (JC.goNext) JC.goNext();
        }, { once: true });
        btn.dataset.clickAttached = '1';
      }
    });
  }, 100);
};

  function initializeController() {
    if (!sectionOrder.length) {
      JC.setOrder([
        'section-intro',
        'section-termos',
        'section-filme1',
        'section-escolha-guia',
        'section-selfie',
        'section-filme2',
        'section-perguntas',
        'section-filme3',
        'section-final'
      ]);
    }

    const initial = global.__currentSectionId || 'section-intro';
    JC.show(initial);
  }

  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', initializeController, { once: true });
      document.addEventListener('bootstrapComplete', initializeController, { once: true });
    }

    global.initController = initializeController;
  });
})(window);
