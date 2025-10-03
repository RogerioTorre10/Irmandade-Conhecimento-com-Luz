(function (global) {
  'use strict';

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let currentIndex = 0;
  let lastShowSection = 0;
  let currentTermosPage = 'termos-pg1';

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

      if (id === 'section-termos') {
        speechSynthesis.cancel();
        console.log('[JornadaController] TTS cancelado para section-termos');
      }

      setTimeout(() => {
        console.log('[JornadaController] Processando elementos [data-typing] em:', id, 'Página:', currentTermosPage);
        const container = id === 'section-termos' ? target.querySelector(`#${currentTermosPage}`) : target;
        const textElements = container.querySelectorAll('[data-typing="true"]:not(.hidden)');
        console.log('[JornadaController] Elementos [data-typing] encontrados:', textElements.length);

        if (textElements.length === 0) {
          const termosBtn = id === 'section-termos' ? target.querySelector(`#${currentTermosPage} [data-action="termos-next"], #${currentTermosPage} [data-action="avancar"]`) : target.querySelector('[data-action="avancar"], .btn-avancar, .btn');
          if (termosBtn && termosBtn.disabled) {
            termosBtn.disabled = false;
            console.log('[JornadaController] Botão ativado (sem datilografia) em:', id, currentTermosPage || '');
            window.toast && window.toast('Conteúdo pronto! Clique para avançar.');
          }
        }

        let typingCompleted = 0;
        const totalTypingElements = textElements.length;

        textElements.forEach(el => {
          console.log('[JornadaController] Verificando visibilidade para elemento:', el.id || el.className);
          const isVisible = el.offsetParent !== null && window.getComputedStyle(el).visibility !== 'hidden' && window.getComputedStyle(el).display !== 'none';
          if (isVisible) {
            console.log('[JornadaController] Chamando runTyping para elemento:', el.id || el.className);
            global.runTyping(el, () => {
              typingCompleted++;
              console.log('[JornadaController] Datilografia concluída para elemento:', el.id || el.className, '- Progresso:', typingCompleted + '/' + totalTypingElements);
              
              // Ativar botões após cada elemento datilografado
              const termosBtn = id === 'section-termos' ? target.querySelector(`#${currentTermosPage} [data-action="termos-next"], #${currentTermosPage} [data-action="avancar"]`) : target.querySelector('[data-action="avancar"], .btn-avancar, .btn');
              if (termosBtn && termosBtn.disabled) {
                termosBtn.disabled = false;
                console.log('[JornadaController] Botão ativado após datilografia em:', id, currentTermosPage || '', 'Elemento:', el.id || el.className);
                window.toast && window.toast('Conteúdo lido! Clique para avançar.');
              }
              if (id === 'section-termos' && currentTermosPage === 'termos-pg2') {
                const prevBtn = target.querySelector('#btn-termos-prev');
                if (prevBtn && prevBtn.disabled) {
                  prevBtn.disabled = false;
                  console.log('[JornadaController] Botão "Voltar" ativado em termos-pg2');
                }
              }
            });
          } else {
            console.warn('[JornadaController] Elemento não visível, pulando datilografia:', el.id || el.className);
          }
        });

        const btns = target.querySelectorAll(
          '[data-action="avancar"], [data-action="termos-next"], [data-action="termos-prev"], .btn-avancar, .btn, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney'
        );
        console.log('[JornadaController] Botões encontrados:', btns.length);
        btns.forEach(btn => {
          if (!btn.dataset.clickAttached) {
            btn.addEventListener('click', (e) => {
              e.preventDefault();
              console.log('[JornadaController] Botão clicado em:', id, 'Botão:', btn.id || btn.className || btn.dataset.action);
              if (id === 'section-termos') {
                if (btn.dataset.action === 'termos-next' && currentTermosPage === 'termos-pg1') {
                  console.log('[JornadaController] Navegando de termos-pg1 para termos-pg2');
                  document.getElementById('termos-pg1').classList.add(HIDE_CLASS);
                  document.getElementById('termos-pg2').classList.remove(HIDE_CLASS);
                  currentTermosPage = 'termos-pg2';
                  JC.show(id);
                } else if (btn.dataset.action === 'termos-prev' && currentTermosPage === 'termos-pg2') {
                  console.log('[JornadaController] Navegando de termos-pg2 para termos-pg1');
                  document.getElementById('termos-pg2').classList.add(HIDE_CLASS);
                  document.getElementById('termos-pg1').classList.remove(HIDE_CLASS);
                  currentTermosPage = 'termos-pg1';
                  JC.show(id);
                } else if (btn.dataset.action === 'avancar' && currentTermosPage === 'termos-pg2') {
                  console.log('[JornadaController] Avançando de section-termos para a próxima seção');
                  if (JC.goNext) JC.goNext();
                }
              } else {
                if (JC.goNext) JC.goNext();
              }
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
        'section-senha',
        'section-filme-jardim', // Filme: conhecimento-com-luz-jardim.mp4
        'section-escolha-guia',
        'section-filme-ao-encontro', // Filme: filme-0-ao-encontro-da-jornada.mp4
        'section-selfie',
        'section-filme-entrando', // Filme: filme-1-entrando-na-jornada.mp4
        'section-perguntas',
        'section-final' // Filme 6 pendente, não incluído
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
