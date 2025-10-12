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
  
  function createFallbackElement(id) {
    console.warn(`[JC.createFallbackElement] Criando fallback para #${id}`);
    const element = document.createElement('section');
    element.id = id;
    element.classList.add('section', HIDE_CLASS); 
    element.style.display = 'none'; 
    if (id === 'section-intro') {
      element.innerHTML = `
        <div id="jornada-content-wrapper">
          <div class="intro-wrap">
            <div id="intro-p1" class="intro-paragraph" data-typing="true" data-speed="36" data-cursor="true">
              Bem-vindo à Jornada Conhecimento com Luz.
            </div>
            <div id="intro-p2" class="intro-paragraph" data-typing="true" data-speed="36" data-cursor="true">
              Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.
            </div>
            <input id="name-input" type="text" placeholder="Digite seu nome">
            <div class="intro-actions">
              <button id="btn-avancar" class="btn btn-primary" data-action="avancar" disabled>Iniciar</button>
            </div>
          </div>
        </div>`;
    } else {
      element.innerHTML = `<h1>Erro: Seção ${id} não carregada.</h1>`;
    }
    const container = document.getElementById('section-conteudo') || document.body;
    container.appendChild(element);
    return element;
  }

  function handleSectionLogic(id, target) {
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
    const container = id === 'section-termos'
      ? target.querySelector(`#${currentTermosPage}`)
      : id === 'section-perguntas'
      ? target.querySelector('#perguntas-container')
      : target;

    const textElements = container ? container.querySelectorAll('[data-typing="true"]:not(.hidden)') : [];
    console.log('[JC.handleTypingAndButtons] Elementos com data-typing:', textElements.length);

    textElements.forEach(el => {
      el.style.display = 'block';
      el.style.visibility = 'visible';
      if (typeof global.runTyping === 'function') {
        console.log('[JC.handleTypingAndButtons] Chamando runTyping para:', el);
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

  try {
    if (window.carregarEtapa) { 
      console.log('[JC.show] Iniciando carregarEtapa para', loaderName);
      await window.carregarEtapa(loaderName); 
      console.log('[JC.show] carregarEtapa concluído, elemento #section-intro:', !!document.getElementById('section-intro'));
      console.log('[JC.show] DOM após carregarEtapa:', document.getElementById('jornada-canvas')?.innerHTML);
      window.i18n?.apply?.(); 
    } else {
      console.error('[JC.show] Função carregarEtapa não encontrada.');
    }

    let target = document.getElementById(id);
    if (!target) {
      console.error(`[JC.show] Elemento #${id} não encontrado. NÃO criando fallback para diagnóstico.`);
      console.log('[JC.show] Conteúdo de #jornada-canvas:', document.getElementById('jornada-canvas')?.innerHTML);
      console.log('[JC.show] Conteúdo de #section-conteudo:', document.getElementById('section-conteudo')?.innerHTML);
      return; // Impede a criação do fallback
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
