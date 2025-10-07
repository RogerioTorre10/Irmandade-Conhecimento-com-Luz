(function (global) {
  'use strict';

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let lastShowSection = 0;
  let controllerInitialized = false;

  // Estado interno
  let currentTermosPage = 'termos-pg1';
  let currentPerguntasBlock = 'bloco-raizes';
  let selectedGuia = null;

  // Define a ordem das seções
  JC.setOrder = function (order) {
    sectionOrder = order;
  };

  // Navegação
  JC.goNext = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx >= 0 && idx < sectionOrder.length - 1) {
      JC.show(sectionOrder[idx + 1]);
    }
  };

  JC.goPrev = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx > 0) {
      JC.show(sectionOrder[idx - 1]);
    }
  };

  // Exibe uma seção
  JC.show = function (id) {
    const now = performance.now();
    if (now - lastShowSection < 300 || global.__currentSectionId === id) return;
    lastShowSection = now;

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

    // Reset de estado
    if (id !== 'section-termos') currentTermosPage = 'termos-pg1';
    if (id !== 'section-perguntas') currentPerguntasBlock = 'bloco-raizes';

    // Lógica por seção
    handleSectionLogic(id, target);

    // Tipagem e botões
    setTimeout(() => {
      handleTypingAndButtons(id, target);
    }, 300);
  };

  // Lógica específica por seção
  function handleSectionLogic(id, target) {
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
  }

  // Tipagem e ativação de botões
  function handleTypingAndButtons(id, target) {
    const container = id === 'section-termos'
      ? target.querySelector(`#${currentTermosPage}`)
      : id === 'section-perguntas'
      ? target.querySelector('#perguntas-container')
      : target;

    const textElements = container ? container.querySelectorAll('[data-typing="true"]:not(.hidden)') : [];

    textElements.forEach(el => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      if (typeof global.runTyping === 'function') {
        global.runTyping(el, el.getAttribute('data-text') || el.textContent, () => {
          const btn = target.querySelector('[data-action="avancar"], .btn-avancar, .btn');
          if (btn && btn.disabled) btn.disabled = false;
        });
      } else {
        el.classList.add('typing-done');
        el.style.opacity = '1';
      }
    });

    attachButtonEvents(id, target);
  }

  // Eventos de clique
  function attachButtonEvents(id, target) {
    const btns = target.querySelectorAll('[data-action], .btn-avancar, .btn, #iniciar, #btnSkipSelfie, #btnStartJourney, #previewBtn, #captureBtn, #grok-chat-send');

    btns.forEach(btn => {
      if (!btn.dataset.clickAttached) {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          handleButtonAction(id, btn);
        });
        btn.dataset.clickAttached = '1';
      }
    });
  }

  // Ações dos botões
  function handleButtonAction(id, btn) {
    const action = btn.dataset.action;

    if (id === 'section-termos') {
      if (action === 'termos-next' && currentTermosPage === 'termos-pg1') {
        document.getElementById('termos-pg1')?.classList.add(HIDE_CLASS);
        document.getElementById('termos-pg2')?.classList.remove(HIDE_CLASS);
        currentTermosPage = 'termos-pg2';
        JC.show(id);
      } else if (action === 'termos-prev' && currentTermosPage === 'termos-pg2') {
        document.getElementById('termos-pg2')?.classList.add(HIDE_CLASS);
        document.getElementById('termos-pg1')?.classList.remove(HIDE_CLASS);
        currentTermosPage = 'termos-pg1';
        JC.show(id);
      } else if (action === 'avancar' && currentTermosPage === 'termos-pg2') {
        JC.goNext();
      }
    } else if (id === 'section-escolha-guia' && action === 'select-guia') {
      selectedGuia = btn.dataset.guia;
      localStorage.setItem('JORNADA_GUIA', selectedGuia);
      global.JSecoes?.proceedAfterGuia(selectedGuia);
    } else if (id === 'section-selfie' && action === 'skip-selfie') {
      global.JSecoes?.proceedAfterSelfie();
    } else if (id === 'section-perguntas' && action === 'avancar') {
      global.JGuiaSelfie?.saveAnswers();
      global.JSecoes?.goNext();
    } else if (id === 'section-senha' && action === 'avancar') {
      global.JSecoes?.startJourney();
    } else {
      JC.goNext();
    }
  }

  // Inicialização única
  JC.init = function () {
    if (controllerInitialized) return;
    controllerInitialized = true;

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
  };

  // Eventos
  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', JC.init, { once: true });
      document.addEventListener('bootstrapComplete', JC.init, { once: true });
    }
    
  JC.show = function (id) {
    console.log('[JC.show] Exibindo:', id);
    const target = document.getElementById(id);
    if (target) {
    document.querySelectorAll('.section').forEach(s => s.classList.add('hidden'));
    target.classList.remove('hidden');
   }
  };   
    
    global.initController = JC.init;
  });
  
  global.showSection = JC.show;
})(window);
