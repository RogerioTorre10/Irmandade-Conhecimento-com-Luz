(function (global) {
  'use strict';

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let lastShowSection = 0;
  let currentTermosPage = 'termos-pg1';
  let currentPerguntasBlock = 'bloco-raizes';
  let selectedGuia = null;

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
    const now = performance.now();
    if (now - lastShowSection < 300) return;
    lastShowSection = now;

    try {
      const all = document.querySelectorAll('div[id^="section-"]');
      const target = document.getElementById(id);
      if (!target) return;

      all.forEach(s => s.classList.add(HIDE_CLASS));
      target.classList.remove(HIDE_CLASS);
      target.style.display = 'block';
      target.style.visibility = 'visible';
      global.__currentSectionId = id;
      global.G = global.G || {};
      global.G.__typingLock = false;

      if (id !== 'section-termos') currentTermosPage = 'termos-pg1';
      if (id !== 'section-perguntas') currentPerguntasBlock = 'bloco-raizes';

      if (id === 'section-termos') {
        speechSynthesis.cancel();
      } else if (id.includes('filme')) {
        const video = target.querySelector('video');
        if (video) {
          video.play().catch(() => {});
          video.addEventListener('ended', () => JC.goNext(), { once: true });
        }
      } else if (id === 'section-perguntas') {
        global.JPaperQA?.renderQuestions();
        global.JGuiaSelfie?.loadAnswers();
        global.JSecoes?.loadDynamicBlocks();
      } else if (id === 'section-selfie') {
        global.JGuiaSelfie?.initSelfie();
      } else if (id === 'section-escolha-guia') {
        global.JSecoes?.proceedAfterGuia(localStorage.getItem('JORNADA_GUIA') || 'zion');
      } else if (id === 'section-final') {
        global.JSecoes?.generatePDF();
      }

      global.JSecoes?.updateCanvasBackground(id);

      setTimeout(() => {
        const container = id === 'section-termos'
          ? target.querySelector(`#${currentTermosPage}`)
          : id === 'section-perguntas'
          ? target.querySelector('#perguntas-container')
          : target;

        const textElements = container ? container.querySelectorAll('[data-typing="true"]:not(.hidden)') : [];

        let typingCompleted = 0;
        const totalTypingElements = textElements.length;

        textElements.forEach(el => {
          el.style.display = 'block';
          el.style.visibility = 'visible';
          if (typeof global.runTyping === 'function') {
            global.runTyping(el, el.getAttribute('data-text') || el.textContent, () => {
              typingCompleted++;
              const btn = id === 'section-termos'
                ? target.querySelector(`#${currentTermosPage} [data-action="termos-next"], #${currentTermosPage} [data-action="avancar"]`)
                : target.querySelector('[data-action="avancar"], [data-action="read-question"], [data-action="select-guia"], [data-action="skip-selfie"], .btn-avancar, .btn');

              if (btn && btn.disabled) btn.disabled = false;

              if (id === 'section-termos' && currentTermosPage === 'termos-pg2') {
                const prevBtn = target.querySelector('#btn-termos-prev');
                if (prevBtn && prevBtn.disabled) prevBtn.disabled = false;
              }
            });
          } else {
            el.classList.add('typing-done');
            el.style.opacity = '1';
          }
        });

        const btns = target.querySelectorAll(
          '[data-action="avancar"], [data-action="termos-next"], [data-action="termos-prev"], [data-action="read-question"], [data-action="select-guia"], [data-action="skip-selfie"], .btn-avancar, .btn, #iniciar, #btnSkipSelfie, #btnStartJourney, #previewBtn, #captureBtn, #grok-chat-send'
        );

        btns.forEach(btn => {
          if (!btn.dataset.clickAttached) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              if (id === 'section-termos') {
                if (btn.dataset.action === 'termos-next' && currentTermosPage === 'termos-pg1') {
                  document.getElementById('termos-pg1')?.classList.add(HIDE_CLASS);
                  document.getElementById('termos-pg2')?.classList.remove(HIDE_CLASS);
                  currentTermosPage = 'termos-pg2';
                  JC.show(id);
                } else if (btn.dataset.action === 'termos-prev' && currentTermosPage === 'termos-pg2') {
                  document.getElementById('termos-pg2')?.classList.add(HIDE_CLASS);
                  document.getElementById('termos-pg1')?.classList.remove(HIDE_CLASS);
                  currentTermosPage = 'termos-pg1';
                  JC.show(id);
                } else if (btn.dataset.action === 'avancar' && currentTermosPage === 'termos-pg2') {
                  JC.goNext?.();
                }
              } else if (id === 'section-escolha-guia' && btn.dataset.action === 'select-guia') {
                selectedGuia = btn.dataset.guia;
                localStorage.setItem('JORNADA_GUIA', selectedGuia);
                global.JSecoes?.proceedAfterGuia(selectedGuia);
              } else if (id === 'section-selfie' && btn.dataset.action === 'skip-selfie') {
                global.JSecoes?.proceedAfterSelfie();
              } else if (id === 'section-perguntas' && btn.dataset.action === 'avancar') {
                global.JGuiaSelfie?.saveAnswers();
                global.JSecoes?.goNext();
              } else if (id === 'section-senha' && btn.dataset.action === 'avancar') {
                global.JSecoes?.startJourney();
              } else {
                JC.goNext?.();
              }
            });
            btn.dataset.clickAttached = '1';
          }
        });
      }, 300);
    } catch (e) {
      console.error('[JornadaController] Erro:', e);
    }
  };

  function initializeController() {
    if (!sectionOrder.length) {
      JC.setOrder([
        'section-intro',
        'section-termos',
        'section-senha',
        'section-filme-jardim',
        'section-escolha-guia',
        'section-filme-ao-encontro',
        'section-selfie',
        'section-filme-entrando',
        'section-perguntas',
        'section-final'
      ]);
    }
    const initial = global.__currentSectionId || 'section-intro';
    JC.show(initial);
  }

  // ✅ Aqui está o ajuste que conecta JC.init corretamente
  JC.init = initializeController;

  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', initializeController, { once: true });
      document.addEventListener('bootstrapComplete', initializeController, { once: true });
    }
    global.initController = initializeController;
  });

  global.showSection = function(id) {
    JC.show(id);
  };
})(window);
