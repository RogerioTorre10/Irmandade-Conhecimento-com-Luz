(function (global) {
  'use strict';

  // Inicializa mesmo sem todas as dependências
  if (!global.TypingBridge) {
    console.warn('[JornadaController] TypingBridge não inicializado, prosseguindo com limitações');
  }
  if (!global.JPaperQA) {
    console.warn('[JornadaController] JPaperQA não inicializado, prosseguindo com limitações');
  }

  const JC = {};
  global.JC = JC;

  const HIDE_CLASS = 'hidden';
  let sectionOrder = [];
  let currentTermosPage = 'termos-pg1';
  let currentPerguntasIndex = 0;

  const videoMapping = {
    'section-filme-ao-encontro': global.JORNADA_VIDEOS?.afterBlocks?.[0],
    'section-filme-entrando': global.JORNADA_VIDEOS?.afterBlocks?.[1],
    'section-final': global.JORNADA_VIDEOS?.final
  };

  function pauseAllVideos() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
      video.pause();
      video.src = '';
      video.load();
    });
    const videoOverlay = document.querySelector('#videoOverlay');
    if (videoOverlay) videoOverlay.classList.add('hidden');
    console.log('[JornadaController] Todos os vídeos pausados');
  }

  JC.setOrder = function (order) {
    sectionOrder = order;
  };

  JC.goNext = function () {
    const currentId = global.__currentSectionId;
    let idx = sectionOrder.indexOf(currentId);
    if (idx >= 0 && idx < sectionOrder.length - 1) {
      let nextId = sectionOrder[idx + 1];
      // Pular seções inexistentes
      while (nextId && !document.getElementById(nextId) && idx < sectionOrder.length - 1) {
        idx++;
        nextId = sectionOrder[idx + 1];
        console.warn('[JornadaController] Seção', sectionOrder[idx], 'não encontrada, tentando próxima:', nextId);
      }
      if (nextId && document.getElementById(nextId)) {
        console.log('[JornadaController] goNext: Avançando de', currentId, 'para', nextId);
        if (currentId === 'section-termos') {
          currentTermosPage = 'termos-pg1';
        }
        JC.show(nextId);
      } else {
        console.error('[JornadaController] Nenhuma seção válida encontrada após', currentId);
        window.toast && window.toast('Erro: Nenhuma seção válida encontrada.');
      }
    } else {
      console.log('[JornadaController] goNext: Fim da jornada ou índice inválido:', idx);
    }
  };

  JC.goPrev = function () {
    const currentId = global.__currentSectionId;
    let idx = sectionOrder.indexOf(currentId);
    if (idx > 0) {
      let prevId = sectionOrder[idx - 1];
      while (prevId && !document.getElementById(prevId) && idx > 0) {
        idx--;
        prevId = sectionOrder[idx - 1];
        console.warn('[JornadaController] Seção', sectionOrder[idx], 'não encontrada, tentando anterior:', prevId);
      }
      if (prevId && document.getElementById(prevId)) {
        if (currentId === 'section-termos') {
          currentTermosPage = 'termos-pg1';
        }
        JC.show(prevId);
      } else {
        console.error('[JornadaController] Nenhuma seção válida encontrada antes de', currentId);
        window.toast && window.toast('Erro: Nenhuma seção válida encontrada.');
      }
    }
  };

  JC.show = function (id) {
    const now = performance.now();
    if (now - global.lastShowSection < 500) {
      console.log('[JornadaController] Debounce: evitando chamada repetida para:', id);
      return;
    }
    global.lastShowSection = now;

    try {
      // Cancela TTS e vídeos anteriores
      speechSynthesis.cancel();
      pauseAllVideos();

      const all = document.querySelectorAll('div[id^="section-"]');
      const target = document.getElementById(id);
      if (!target) {
        console.error('[JornadaController] Seção não encontrada:', id);
        document.dispatchEvent(new CustomEvent('sectionError', { detail: { id, error: 'Section not found' } }));
        window.toast && window.toast(`Seção ${id} não encontrada.`);
        JC.goNext(); // Tenta a próxima seção
        return;
      }

      all.forEach(s => s.classList.add(HIDE_CLASS));
      target.classList.remove(HIDE_CLASS);
      global.__currentSectionId = id;
      global.G = global.G || {};
      global.G.__typingLock = false;

      setTimeout(() => {
        console.log('[JornadaController] Processando seção:', id, 'Página:', currentTermosPage);
        let container;
        if (id === 'section-termos') {
          container = target.querySelector(`#${currentTermosPage}`);
        } else if (id === 'section-perguntas' && global.JPaperQA) {
          global.JPaperQA.renderQuestions();
          container = target.querySelector('#jornada-conteudo');
        } else {
          container = target;
        }

        const textElements = container ? container.querySelectorAll('[data-typing="true"]:not(.hidden)') : [];
        console.log('[JornadaController] Elementos [data-typing] encontrados:', textElements.length, 'em', id);

        if (textElements.length === 0) {
          console.log('[JornadaController] Nenhum elemento com data-typing, ativando botão imediatamente');
          let btn = id === 'section-termos' ? target.querySelector(`#${currentTermosPage} [data-action="termos-next"], #${currentTermosPage} [data-action="avancar"]`) : 
                   id === 'section-perguntas' ? target.querySelector(`[data-bloco="${currentPerguntasIndex}"] [data-action="avancar"]`) : 
                   target.querySelector('[data-action="avancar"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, .btn-iniciar, .start-btn, .next-btn');
          if (!btn) {
            btn = target.querySelector('button') || document.querySelector('#iniciar, [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-iniciar, .start-btn, .next-btn, .btn-avancar, .btn-avanca');
            console.warn('[JornadaController] Botão não encontrado pelos seletores padrão, usando fallback:', btn ? (btn.id || btn.className) : 'nenhum botão encontrado');
          }
          if (btn) {
            btn.disabled = false;
            console.log('[JornadaController] Botão ativado imediatamente em:', id, 'Botão:', btn.id || btn.className);
            window.toast && window.toast('Conteúdo pronto! Clique para avançar.');
          } else {
            console.error('[JornadaController] Botão de avançar não encontrado em:', id);
            window.toast && window.toast('Botão de avançar não encontrado!');
          }
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target: id } }));
          return;
        }

        if (global.runTyping) {
          global.runTyping(container, () => {
            console.log('[JornadaController] Datilografia sequencial concluída para container:', id);
          });
        } else {
          console.warn('[JornadaController] runTyping não disponível, pulando datilografia');
          document.dispatchEvent(new CustomEvent('allTypingComplete', { detail: { target: id } }));
        }

        const onAllComplete = () => {
          let btn = id === 'section-termos' ? target.querySelector(`#${currentTermosPage} [data-action="termos-next"], #${currentTermosPage} [data-action="avancar"]`) : 
                   id === 'section-perguntas' ? target.querySelector(`[data-bloco="${currentPerguntasIndex}"] [data-action="avancar"]`) : 
                   target.querySelector('[data-action="avancar"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, .btn-iniciar, .start-btn, .next-btn');
          if (!btn) {
            btn = target.querySelector('button') || document.querySelector('#iniciar, [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-iniciar, .start-btn, .next-btn, .btn-avancar, .btn-avanca');
            console.warn('[JornadaController] Botão não encontrado pelos seletores padrão, usando fallback:', btn ? (btn.id || btn.className) : 'nenhum botão encontrado');
          }
          if (btn) {
            btn.disabled = false;
            console.log('[JornadaController] Botão ativado após toda datilografia em:', id, 'Botão:', btn.id || btn.className);
            window.toast && window.toast('Conteúdo pronto! Clique para avançar.');
          } else {
            console.error('[JornadaController] Botão de avançar não encontrado em:', id);
            window.toast && window.toast('Botão de avançar não encontrado!');
          }

          if (videoMapping[id] && global.JPaperQA) {
            speechSynthesis.cancel();
            setTimeout(() => {
              global.JPaperQA.loadVideo(videoMapping[id]);
              console.log('[JornadaController] Carregando vídeo após datilografia para seção:', id, 'Vídeo:', videoMapping[id]);
            }, 500);
          }

          if (id === 'section-termos' && currentTermosPage === 'termos-pg2') {
            const prevBtn = target.querySelector('#btn-termos-prev');
            if (prevBtn && prevBtn.disabled) {
              prevBtn.disabled = false;
              console.log('[JornadaController] Botão "Voltar" ativado em termos-pg2');
            }
          }

          // Depuração: Listener de clique direto
          const introBtn = target.querySelector('[data-action="avancar"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, .btn-iniciar, .start-btn, .next-btn') || target.querySelector('button');
          if (introBtn) {
            introBtn.addEventListener('click', () => {
              console.log('[JornadaController] Clique manual detectado no botão:', introBtn.id || introBtn.className);
              JC.goNext();
            }, { once: true });
          }

          console.log('[JornadaController] Navegação concluída para:', id);
          document.removeEventListener('allTypingComplete', onAllComplete);
        };
        document.addEventListener('allTypingComplete', onAllComplete, { once: true });

        // Fallback para ativar botão após 10 segundos
        setTimeout(() => {
          let btn = target.querySelector('[data-action="avancar"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, .btn-iniciar, .start-btn, .next-btn');
          if (!btn) {
            btn = target.querySelector('button') || document.querySelector('#iniciar, [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-iniciar, .start-btn, .next-btn, .btn-avancar, .btn-avanca');
          }
          if (btn && btn.disabled) {
            btn.disabled = false;
            console.warn('[JornadaController] Fallback: Botão ativado após timeout em:', id, 'Botão:', btn.id || btn.className);
            window.toast && window.toast('Conteúdo pronto (fallback)! Clique para avançar.');
          }
        }, 10000);

        const btns = target.querySelectorAll(
          '[data-action="avancar"], [data-action="termos-next"], [data-action="termos-prev"], [data-action="read-question"], [data-action="iniciar"], [data-action="start"], [data-action="next"], .btn-avancar, .btn-avanca, .btn, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney, .btn-iniciar, .start-btn, .next-btn'
        );
        console.log('[JornadaController] Botões encontrados:', btns.length, 'em', id);
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
                  JC.goNext();
                }
              } else if (id === 'section-perguntas') {
                const totalBlocos = global.JORNADA_BLOCKS ? global.JORNADA_BLOCKS.length : 5;
                if (currentPerguntasIndex < totalBlocos - 1) {
                  currentPerguntasIndex++;
                  global.JPaperQA && global.JPaperQA.renderQuestions();
                  console.log('[JornadaController] Navegando para próximo bloco de perguntas:', currentPerguntasIndex);
                  JC.show(id);
                } else {
                  console.log('[JornadaController] Avançando de section-perguntas para a próxima seção');
                  JC.goNext();
                }
              } else {
                JC.goNext();
              }
            }, { once: true });
            btn.dataset.clickAttached = '1';
            console.log('[JornadaController] Evento de clique adicionado ao botão em:', id, 'Botão:', btn.id || btn.className || btn.dataset.action);
          }
        });
      }, 100);
    } catch (e) {
      console.error('[JornadaController] Erro:', e);
      document.dispatchEvent(new CustomEvent('sectionError', { detail: { id, error: e.message } }));
      window.toast && window.toast('Erro ao exibir seção');
      JC.goNext(); // Tenta a próxima seção em caso de erro
    }
  };

  function initializeController() {
    if (!sectionOrder.length) {
      JC.setOrder([
        'section-intro',
        'section-termos',
        'section-senha',
        'section-escolha-guia',
        'section-filme-ao-encontro',
        'section-selfie',
        'section-filme-entrando',
        'section-perguntas',
        'section-final'
      ]);
    }
    const initial = global.__currentSectionId || 'section-intro';
    console.log('[JornadaController] Inicializando com seção:', initial);
    JC.show(initial);
  }

  document.addEventListener('blockCompleted', (e) => {
    const { video } = e.detail;
    if (video && global.JPaperQA) {
      speechSynthesis.cancel();
      setTimeout(() => {
        global.JPaperQA.loadVideo(video);
        console.log('[JornadaController] Carregando vídeo após bloco:', video);
      }, 500);
    }
  });

  document.addEventListener('videoEnded', () => {
    console.log('[JornadaController] Vídeo finalizado, avançando para próxima seção');
    JC.goNext();
  });

  Promise.resolve().finally(() => {
    if (!global.__ControllerEventsBound) {
      global.__ControllerEventsBound = true;
      document.addEventListener('DOMContentLoaded', initializeController, { once: true });
      document.addEventListener('bootstrapComplete', initializeController, { once: true });
    }
    global.initController = initializeController;
  });
})(window);
