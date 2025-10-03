(function (global) {
  'use strict';

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let currentIndex = 0;
  let lastShowSection = 0;

  JC.setOrder = function (order) {
    sectionOrder = order;
  };

  JC.goNext = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx >= 0 && idx < sectionOrder.length - 1) {
      const nextId = sectionOrder[idx + 1];
      console.log('[JornadaController] goNext: Avançando de', currentId, 'para', nextId);
      JC.show(nextId);
    } else {
      console.log('[JornadaController] goNext: Fim da jornada ou índice inválido:', idx);
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
    const now = performance.now();
    if (now - lastShowSection < 500) {
      console.log('[JornadaController] Debounce: evitando chamada repetida para:', id);
      return;
    }
    lastShowSection = now;

    try {
      const all = document.querySelectorAll('div[id^="section-"]');
      const target = document.getElementById(id);
      if (!target) {
        console.warn('[JornadaController] Seção não encontrada:', id);
        window.toast && window.toast(`Seção ${id} não encontrada.`);
        return;
      }

      all.forEach(s => s.classList.add(HIDE_CLASS));
      target.classList.remove(HIDE_CLASS);
      global.__currentSectionId = id;
      global.G = global.G || {};
      global.G.__typingLock = false;

      setTimeout(() => {
        console.log('[JornadaController] Processando elementos [data-typing] em:', id);
        const textElements = target.querySelectorAll('[data-typing="true"]:not(.hidden)');
        console.log('[JornadaController] Elementos [data-typing] encontrados:', textElements.length);

        if (textElements.length === 0 && id === 'section-termos') {
          // Ativar botão mesmo sem datilografia
          const termosBtn = target.querySelector('[data-action="termos-next"]');
          if (termosBtn && termosBtn.disabled) {
            termosBtn.disabled = false;
            console.log('[JornadaController] Botão "Próxima página" ativado (sem datilografia) em section-termos');
            window.toast && window.toast('Termos prontos! Clique para avançar.');
          }
        }

        let typingCompleted = 0;
        const totalTypingElements = textElements.length;

        textElements.forEach(el => {
          if (el.offsetParent !== null) {
            console.log('[JornadaController] Chamando runTyping para elemento:', el.id || el.className);
            global.runTyping(el, () => {
              typingCompleted++;
              console.log('[JornadaController] Datilografia concluída para elemento:', el.id || el.className, '- Progresso:', typingCompleted + '/' + totalTypingElements);
              
              // Ativar botão após datilografia completa
              if (typingCompleted === totalTypingElements) {
                const termosBtn = target.querySelector('[data-action="termos-next"]');
                if (termosBtn && termosBtn.disabled) {
                  termosBtn.disabled = false;
                  console.log('[JornadaController] Botão "Próxima página" ativado após datilografia em:', id);
                  window.toast && window.toast('Termos lidos! Clique para avançar.');
                }
              }
            });
          }
        });

        const btns = target.querySelectorAll(
          '[data-action="avancar"], [data-action="termos-next"], .btn-avancar, .btn, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney'
        );
        console.log('[JornadaController] Botões encontrados:', btns.length);
        btns.forEach(btn => {
          if (!btn.dataset.clickAttached) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              console.log('[JornadaController] Botão clicado em:', id, 'Botão:', btn.id || btn.className || btn.dataset.action);
              if (JC.goNext) JC.goNext();
            }, { once: true });
            btn.dataset.clickAttached = '1';
            console.log('[JornadaController] Evento de clique adicionado ao botão em:', id, 'Botão:', btn.id || btn.className || btn.dataset.action);
          }
        });
      }, 100);
    } catch (e) {
      console.error('[JornadaController] Erro:', e);
      window.toast && window.toast('Erro ao exibir seção');
    }
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
    console.log('[JornadaController] Inicializando com seção:', initial);
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
