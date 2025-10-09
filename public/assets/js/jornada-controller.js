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

  // Função auxiliar para criar um elemento fallback
 function createFallbackElement(id) {
  console.warn(`[JC.createFallbackElement] Criando fallback para #${id}`);
  const element = document.createElement('section');
  element.id = id;
  element.classList.add('hidden'); // Usa a classe HIDE_CLASS para esconder
  element.style.display = 'none'; // Garante que não seja visível
  element.innerHTML = ''; // Deixa vazio para evitar conteúdo visível
  document.body.appendChild(element);
  return element;
}

  // Define a ordem das seções
  JC.setOrder = function (order) {
    sectionOrder = order;
    console.log('[JC.setOrder] Ordem das seções definida:', sectionOrder);
  };

  // Navegação
  JC.goNext = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx >= 0 && idx < sectionOrder.length - 1) {
      JC.show(sectionOrder[idx + 1]);
    } else {
      console.log('[JC.goNext] Não há próxima seção para', currentId);
    }
  };

  JC.goPrev = function () {
    const currentId = global.__currentSectionId;
    const idx = sectionOrder.indexOf(currentId);
    if (idx > 0) {
      JC.show(sectionOrder[idx - 1]);
    } else {
      console.log('[JC.goPrev] Não há seção anterior para', currentId);
    }
  };

  // Exibe uma seção (versão async: garante DOM via Loader.ensure)
  JC.show = async function (id, { force = false } = {}) {
    const now = performance.now();
    if (!force && (now - lastShowSection < 300 || global.__currentSectionId === id)) {
      console.log(`[JC.show] Ignorando chamada para ${id}: repetida ou muito rápida`);
      return;
    }
    lastShowSection = now;

    try {
      // 1) Log do estado atual do DOM (para depuração)
      console.log('[JC.show] Estado do DOM antes de ensure:', document.body.innerHTML);

      // 2) Garante que a seção exista (montada pelo Loader)
      if (window.Loader?.ensure) {
        await window.Loader.ensure(id);
        console.log(`[JC.show] Após Loader.ensure para #${id}`);
        // Opcional: reaplicar i18n após inserir HTML
        window.i18n?.apply?.();
      }

      // 3) Resolve o alvo e o conjunto de seções
      let target =
        document.getElementById(id) ||
        document.querySelector(`#${id}, section#${id}, div#${id}`);

      // 4) Fallback caso o elemento não seja encontrado
      if (!target) {
        console.warn(`[JC.show] Elemento #${id} não encontrado após ensure. Criando fallback...`);
        target = createFallbackElement(id);
      }    
      
      // 5) Log do DOM após ensure (para confirmar a presença do elemento)
      console.log('[JC.show] Estado do DOM após ensure:', document.body.innerHTML);

      // 6) Oculta todas as seções e mostra apenas o alvo
      const all = document.querySelectorAll('section[id^="section-"], div[id^="section-"]');
      all.forEach(s => {
        s.classList?.add(HIDE_CLASS);
        s.style.display = 'none';
        s.style.visibility = 'hidden';
      });

      target.classList?.remove(HIDE_CLASS);
      target.style.display = 'block';
      target.style.visibility = 'visible';
      global.__currentSectionId = id;

      // 7) Reset de locks/estado
      global.G = global.G || {};
      global.G.__typingLock = false;

      if (id !== 'section-termos') currentTermosPage = 'termos-pg1';
      if (id !== 'section-perguntas') currentPerguntasBlock = 'bloco-raizes';

      // 8) Lógica por seção
      handleSectionLogic?.(id, target);

      // 9) Eventos para quem escuta (intro, senha, etc.)
      const detail = { sectionId: id, id, root: target };
      document.dispatchEvent(new CustomEvent('sectionLoaded', { detail }));
      document.dispatchEvent(new CustomEvent('section:shown', { detail }));

      // 10) Tipagem e botões (mantém o delay atual)
      setTimeout(() => {
        handleTypingAndButtons?.(id, target);
      }, 300);

      console.log('[JC.show] Exibido com sucesso:', id);
    } catch (e) {
      console.error('[JC.show] Falha ao exibir', id, e);
    }
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

    console.log('[JC.init] Controlador inicializado com sucesso.');
    // A chamada inicial para section-intro agora é responsabilidade do bootstrap
  };
  
  (async () => {
  if (!document.getElementById('section-intro')) {
    await carregarEtapa('intro');
  }
  JC.show('section-intro');
})();

 // Em jornada-controller.js, função JC.show
  function show(sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) {
    console.warn(`[JC.show] Elemento #${sectionId} não encontrado. Aguardando carregamento...`);
    setTimeout(() => show(sectionId), 100); // Tenta novamente após um pequeno delay
    return;
    }
    // Prossegue com a exibição
}

  // Eventos
  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', JC.init, { once: true });
      // O bootstrapComplete será o ponto de partida principal
      // document.addEventListener('bootstrapComplete', () => JC.show('section-intro'), { once: true });

      global.initController = JC.init;
    }

    global.showSection = JC.show;
  });
})(window);
