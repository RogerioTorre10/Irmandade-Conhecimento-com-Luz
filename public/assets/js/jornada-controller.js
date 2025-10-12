(function (global) {
  'use strict';

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let lastShowSection = 0;
  let controllerInitialized = false;

  let currentTermosPage = 'termos-pg1';
  let currentPerguntasBlock = 'bloco-raizes';

  function handleSectionLogic(id, target) {
    console.log('[JC.handleSectionLogic] Processando lógica para seção:', id);
    if (id === 'section-perguntas') {
      global.JSecoes?.loadDynamicBlocks();
      global.JGuiaSelfie?.loadAnswers();
    } else if (id === 'section-selfie') {
      global.JGuiaSelfie?.initSelfie();
    } else if (id === 'section-final') {
      global.JSecoes?.generatePDF();
    }
    global.JSecoes?.updateCanvasBackground(id);
  }

  function handleTypingAndButtons(id, target) {
    // Evita aplicar datilografia para section-intro, delegando ao section-intro.js
    if (id === 'section-intro') {
      console.log('[JC.handleTypingAndButtons] Pulando datilografia para section-intro (delegado ao section-intro.js)');
      attachButtonEvents(id, target);
      return;
    }

    const container = id === 'section-termos'
      ? target.querySelector(`#${currentTermosPage}`)
      : id === 'section-perguntas'
      ? target.querySelector('#perguntas-container')
      : target;

    const textElements = container ? container.querySelectorAll('[data-typing="true"]:not(.typing-done)') : [];
    console.log('[JC.handleTypingAndButtons] Elementos com data-typing para', id, ':', textElements.length);

    textElements.forEach(el => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      if (typeof global.runTyping === 'function') {
        console.log('[JC.handleTypingAndButtons] Chamando runTyping para:', el.id);
        global.runTyping(el, el.getAttribute('data-text') || el.textContent, () => {
          const btn = target.querySelector('[data-action="avancar"], .btn-avancar, .btn');
          if (btn && btn.disabled) btn.disabled = false;
        });
      } else {
        console.warn('[JC.handleTypingAndButtons] runTyping não disponível');
        el.classList.add('typing-done');
        el.style.opacity = '1';
      }
    });

    attachButtonEvents(id, target);
  }

  function attachButtonEvents(id, target) {
    const btns = target.querySelectorAll('[data-action], .btn-avancar, .btn, #iniciar, #btnSkipSelfie, #btnStartJourney, #previewBtn, #captureBtn, #grok-chat-send');
    console.log('[JC.attachButtonEvents] Botões encontrados para', id, ':', btns.length);

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

  function handleButtonAction(id, btn) {
    const action = btn.dataset.action;
    console.log('[JC.handleButtonAction] Ação do botão:', action, 'para seção:', id);

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
    } else if (id === 'section-intro' && action === 'avancar') {
      JC.goNext();
    } else if (id === 'section-selfie' && action === 'skip-selfie') {
      global.JSecoes?.proceedAfterSelfie();
    } else if (id === 'section-perguntas' && action === 'avancar') {
      global.JGuiaSelfie?.saveAnswers();
      global.JSecoes?.goNext();
    } else if (id === 'section-senha' && action === 'avancar') {
      JC.goNext();
    } else {
      JC.goNext();
    }
  }

  JC.setOrder = function (order) {
    sectionOrder = order;
    console.log('[JC.setOrder] Ordem das seções definida:', sectionOrder);
  };

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

  JC.show = async function (id, { force = false } = {}) {
    const now = performance.now();
    if (!force && (now - lastShowSection < 300)) {
      console.log(`[JC.show] Ignorando chamada para ${id}: muito rápida`);
      return;
    }
    lastShowSection = now;

    const loaderName = id.startsWith('section-') ? id.substring(8) : id;
    console.log('[JC.show] Iniciando exibição para', id);

    try {
      if (window.carregarEtapa) {
        console.log('[JC.show] Iniciando carregarEtapa para', loaderName);
        await window.carregarEtapa(loaderName);
        console.log('[JC.show] carregarEtapa concluído, elemento #' + id + ':', !!document.getElementById(id));
        console.log('[JC.show] Conteúdo de #jornada-content-wrapper:', document.getElementById('jornada-content-wrapper')?.innerHTML.slice(0, 120) + '...');
        window.i18n?.apply?.();
      } else {
        console.error('[JC.show] Função carregarEtapa não encontrada.');
      }

      let target = document.getElementById(id);
      if (!target) {
        console.error(`[JC.show] Elemento #${id} não encontrado. NÃO criando fallback para diagnóstico.`);
        console.log('[JC.show] Conteúdo de #jornada-canvas:', document.getElementById('jornada-canvas')?.innerHTML);
        console.log('[JC.show] Conteúdo de #section-conteudo:', document.getElementById('section-conteudo')?.innerHTML);
        return;
      }

      target.classList?.remove(HIDE_CLASS);
      target.style.display = 'block';
      target.style.visibility = 'visible';
      global.__currentSectionId = id;

      global.G = global.G || {};
      global.G.__typingLock = false;

      if (id !== 'section-termos') currentTermosPage = 'termos-pg1';
      if (id !== 'section-perguntas') currentPerguntasBlock = 'bloco-raizes';

      handleSectionLogic(id, target);

      const detail = { sectionId: id, id, root: target };
      document.dispatchEvent(new CustomEvent('section:shown', { detail }));
      console.log('[JC.show] Evento section:shown disparado para', id);

      setTimeout(() => {
        handleTypingAndButtons(id, target);
      }, 300);

      console.log('[JC.show] Exibido com sucesso:', id);
    } catch (e) {
      console.error('[JC.show] Falha ao exibir', id, e);
    }
  };

  JC.init = function () {
    if (controllerInitialized) return;
    controllerInitialized = true;

    if (!sectionOrder.length) {
      JC.setOrder([
        'section-intro',
        'section-termos',
        'section-senha',
        'section-filme-conhecimento-com-luz-jardim',
        'section-guia',
        'section-filme-conhecimento-com-luz-jardim',
        'section-selfie',
        'section-filme-0-ao-encontro-da-jornada',
        'section-perguntas',
        'section-filme-5-fim-da-jornada',
        'section-final'
      ]);
    }

    console.log('[JC.init] Controlador inicializado com sucesso.');
  };

  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', JC.init, { once: true });
    }
  });

  global.initController = JC.init;
  global.showSection = JC.show;
})(window);
