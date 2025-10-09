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
    // Anexa ao contêiner principal para que o Loader possa encontrá-lo, se for o caso
    const container = document.getElementById('section-conteudo') || document.body;
    container.appendChild(element);
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
    // Remove a verificação global.__currentSectionId === id para permitir recarregamento limpo
    if (!force && (now - lastShowSection < 300)) { 
      console.log(`[JC.show] Ignorando chamada para ${id}: muito rápida`);
      return;
    }
    lastShowSection = now;
    
    // O ID passado para o Loader é o nome da seção sem o prefixo 'section-'
    const loaderName = id.startsWith('section-') ? id.substring(8) : id;

    try {
      // 1) Garante que a seção exista (montada pelo Loader)
      if (window.carregarEtapa) { // Verifica a função do jornada-loader.js
        // carregarEtapa limpa o container e injeta o HTML
        await window.carregarEtapa(loaderName); 
        window.i18n?.apply?.(); // Reaplica i18n
      } else {
        console.error('[JC.show] Função carregarEtapa não encontrada. Seções não serão carregadas dinamicamente.');
      }

      // 2) Resolve o alvo
      let target = document.getElementById(id);
      if (!target) {
        target = createFallbackElement(id);
        window.toast?.(`Seção ${id} não encontrada. Usando fallback.`, 'error');
      }    
     
      // 3) Oculta todas as seções, mantendo apenas o alvo
      const container = document.getElementById('section-conteudo') || document.body;
      // Como o carregarEtapa limpa o container, a única seção visível deve ser o 'target'
      
      // 4) Exibe o alvo (caso o Loader não tenha feito)
      target.classList?.remove(HIDE_CLASS);
      target.style.display = 'block';
      target.style.visibility = 'visible';
      global.__currentSectionId = id;

      // 5) Reset de locks/estado e Lógica por seção
      global.G = global.G || {};
      global.G.__typingLock = false;
      
      // Reset de estado (como você tinha no original)
      if (id !== 'section-termos') currentTermosPage = 'termos-pg1';
      if (id !== 'section-perguntas') currentPerguntasBlock = 'bloco-raizes';

      handleSectionLogic(id, target);

      // 6) Eventos para quem escuta (intro, senha, etc.)
      const detail = { sectionId: id, id, root: target };
      // sectionLoaded deve ser disparado pelo loader.js. Aqui disparamos apenas o 'shown'.
      document.dispatchEvent(new CustomEvent('section:shown', { detail }));

      // 7) Tipagem e botões (mantém o delay atual)
      setTimeout(() => {
        handleTypingAndButtons(id, target);
      }, 300);

      console.log('[JC.show] Exibido com sucesso:', id);
    } catch (e) {
      console.error('[JC.show] Falha ao exibir', id, e);
    }
  };

  // Lógica específica por seção (Ajustada a chamada de Guia)
  function handleSectionLogic(id, target) {
    // ... (mantido o código de termos, filme, perguntas, selfie e final)
    
    // Lógica para a Introdução
    if (id === 'section-intro') {
      // O section-intro.js já escuta o 'section:shown' para iniciar typing e fetch do guia
    } else if (id === 'section-perguntas') {
      // Garante que a lógica de perguntas seja carregada
      global.JSecoes?.loadDynamicBlocks();
      global.JGuiaSelfie?.loadAnswers(); // Para carregar respostas salvas
    } else if (id === 'section-selfie') {
      global.JGuiaSelfie?.initSelfie();
    } else if (id === 'section-final') {
      global.JSecoes?.generatePDF();
    } else if (id === 'section-escolha-guia') {
      // Essa seção provavelmente será removida do fluxo. Mantido como fallback.
      global.JSecoes?.proceedAfterGuia(localStorage.getItem('JORNADA_GUIA') || 'zion');
    }

    global.JSecoes?.updateCanvasBackground(id);
  }

  // ... (funções handleTypingAndButtons, attachButtonEvents, handleButtonAction mantidas) ...

  // Ações dos botões (Revisão da lógica de Avanço)
  function handleButtonAction(id, btn) {
    const action = btn.dataset.action;

    // ... (lógica de section-termos mantida)

    if (id === 'section-intro' && action === 'avancar') {
      // O botão avançar na introdução deve ser desabilitado se o nome/guia não estiver pronto.
      // Se chegou aqui e o botão está habilitado, avança para a próxima seção (Termos).
      JC.goNext(); 
    } else if (id === 'section-escolha-guia' && action === 'select-guia') {
      // Essa lógica deve ter sido movida para section-intro.js, mas mantemos o fallback
      const selectedGuia = btn.dataset.guia;
      localStorage.setItem('JORNADA_GUIA', selectedGuia);
      global.JSecoes?.proceedAfterGuia(selectedGuia);
    } else if (id === 'section-selfie' && action === 'skip-selfie') {
      global.JSecoes?.proceedAfterSelfie();
    } else if (id === 'section-perguntas' && action === 'avancar') {
      global.JGuiaSelfie?.saveAnswers();
      global.JSecoes?.goNext();
    } else if (id === 'section-senha' && action === 'avancar') {
      // Se a senha estiver correta, começa a Jornada real (que é a intro/primeiro filme)
      JC.goNext(); 
    } else {
      // Default para outros botões sem ação específica
      JC.goNext();
    }
  }
  
  // Inicialização única
  JC.init = function () {
    if (controllerInitialized) return;
    controllerInitialized = true;

    if (!sectionOrder.length) {
      // Ordem padrão da Jornada (corrigida para começar na intro e manter um fluxo lógico)
      JC.setOrder([
        'section-intro',          // 1. Apresentação, nome e escolha do guia (com fetch)
        'section-termos',         // 2. Termos de uso
        'section-senha',          // 3. Senha (se houver)
        'section-filme-jardim',   // 4. Primeiro filme
        'section-selfie',         // 5. Selfie (Guia já escolhido na Intro)
        'section-filme-ao-encontro', // 6. Próximo filme
        'section-perguntas',      // 7. Seção de perguntas dinâmicas
        'section-final'           // 8. Final e PDF
      ]);
    }

    console.log('[JC.init] Controlador inicializado com sucesso.');
  };
  
  // Correção do bloco final: Usar DOMContentLoaded apenas para inicializar o controlador
  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', JC.init, { once: true });
    }
  });
  
  global.initController = JC.init;
  global.showSection = JC.show; // Exporta JC.show como showSection
  
})(window);
