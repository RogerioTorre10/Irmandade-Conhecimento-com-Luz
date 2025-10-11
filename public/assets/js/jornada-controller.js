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
  
  // Função auxiliar para criar um elemento fallback
  function createFallbackElement(id) {
    console.warn(`[JC.createFallbackElement] Criando fallback para #${id}`);
    const element = document.createElement('section');
    element.id = id;
    element.classList.add('section', HIDE_CLASS); 
    element.style.display = 'none'; 
    element.innerHTML = `<h1>Erro: Seção ${id} não carregada.</h1>`; 
    const container = document.getElementById('section-conteudo') || document.body;
    container.appendChild(element);
    return element;
  }

  // Lógica específica por seção (MOVIDA PARA CÁ)
  function handleSectionLogic(id, target) {
    if (id === 'section-perguntas') {
      global.JSecoes?.loadDynamicBlocks();
      global.JGuiaSelfie?.loadAnswers(); 
    } else if (id === 'section-selfie') {
      global.JGuiaSelfie?.initSelfie(); // Acesso OK
    } else if (id === 'section-final') {
      global.JSecoes?.generatePDF();
    } 
    global.JSecoes?.updateCanvasBackground(id);
  }

  // Tipagem e ativação de botões (MOVIDA PARA CÁ)
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
          // Lógica de ativação do botão removida para ser gerenciada pelo script da seção
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
    const btns = target.querySelectorAll('[data-action], .btn-avancar, .btn, #iniciar, #btnSkipSelfie, #btnStartJourney, #previewBtn, #captureBtn, #grok-chat-send, #btn-selecionar-guia, #btn-skip-guia');

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

    // Lógica para section-termos (Navegação interna e avanço)
    if (id === 'section-termos') {
      if (action === 'termos-next' && currentTermosPage === 'termos-pg1') {
        document.getElementById('termos-pg1')?.classList.add(HIDE_CLASS);
        document.getElementById('termos-pg2')?.classList.remove(HIDE_CLASS);
        currentTermosPage = 'termos-pg2';
        // Chama show para re-exibir a seção e aplicar lógica/typing na nova página
        JC.show(id); 
      } else if (action === 'termos-prev' && currentTermosPage === 'termos-pg2') {
        document.getElementById('termos-pg2')?.classList.add(HIDE_CLASS);
        document.getElementById('termos-pg1')?.classList.remove(HIDE_CLASS);
        currentTermosPage = 'termos-pg1';
        JC.show(id);
      } else if (action === 'avancar' && currentTermosPage === 'termos-pg2') {
        JC.goNext();
      }
    // Lógica para as seções que usam o padrão JC.goNext()
    } else if (
        (id === 'section-intro' && action === 'avancar') ||
        (id === 'section-senha' && action === 'avancar') ||
        (id === 'section-guia' && (btn.id === 'btn-selecionar-guia' || btn.id === 'btn-skip-guia'))
    ) {
      JC.goNext(); 
    // Lógica para seções com ações customizadas
    } else if (id === 'section-selfie' && action === 'skip-selfie') {
      global.JSecoes?.proceedAfterSelfie();
    } else if (id === 'section-perguntas' && action === 'avancar') {
      global.JGuiaSelfie?.saveAnswers();
      global.JSecoes?.goNext();
    } else {
      JC.goNext();
    }
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
      setTimeout(() => {
         JC.show(sectionOrder[idx + 1]);
      }, 50); 
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

  // Exibe uma seção
  JC.show = async function (id, { force = false } = {}) {
    const now = performance.now();
    if (!force && (now - lastShowSection < 300)) { 
      console.log(`[JC.show] Ignorando chamada para ${id}: muito rápida`);
      return;
    }
    lastShowSection = now;
    
    const loaderName = id.startsWith('section-') ? id.substring(8) : id;

    try {
      if (window.carregarEtapa) { 
        // 1. CARREGA E INJETA O HTML
        await window.carregarEtapa(loaderName); 
        window.i18n?.apply?.(); 
      } else {
        console.error('[JC.show] Função carregarEtapa não encontrada.');
      }

      // 2. CORREÇÃO: Busca o elemento na div de conteúdo (#jornada-content-wrapper)
      let target = document.getElementById(id) || document.getElementById('jornada-content-wrapper')?.querySelector(`#${id}`);
      
      // Se ainda não encontrou, cria o fallback
      if (!target) {
        target = createFallbackElement(id);
        window.toast?.(`Seção ${id} não encontrada. Usando fallback.`, 'error');
      } 
      
      // Esconde a seção anterior
      const previousSection = document.getElementById(global.__currentSectionId);
      if (previousSection && previousSection.id !== id) {
          previousSection.classList?.add(HIDE_CLASS);
          previousSection.style.display = 'none';
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

      setTimeout(() => {
        handleTypingAndButtons(id, target);
      }, 300);

      console.log('[JC.show] Exibido com sucesso:', id);
    } catch (e) {
      console.error('[JC.show] Falha ao exibir', id, e);
    }
  };

  // Inicialização única
  JC.init = function () {
    if (controllerInitialized) return;
    controllerInitialized = true;

    // ORDEM DAS SEÇÕES MANTIDA CORRETA
    if (!sectionOrder.length) {
      JC.setOrder([
        'section-intro',          
        'section-termos',         
        'section-senha',          
        'section-filme-jardim',   
        'section-guia',           
        'section-selfie',         
        'section-filme-ao-encontro', 
        'section-perguntas',      
        'section-filme-jardim',   
        'section-final'           
      ]);
    }

    console.log('[JC.init] Controlador inicializado com sucesso.');
  };
  
  // Finalização da Inicialização
  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', JC.init, { once: true });
    }
  });
  
  global.initController = JC.init;
  global.showSection = JC.show; 
  
})(window);
