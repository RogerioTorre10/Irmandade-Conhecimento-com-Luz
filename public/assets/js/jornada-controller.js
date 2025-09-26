/* /public/assets/js/jornada-controller.js */
(function () {
  'use strict';
  const log = (...args) => console.log('[JORNADA_CONTROLLER]', ...args);

  window.perguntasLoaded = false;

  // --- [CTRL v6-fix] Safe next + action queue ---------------------------------
(function () {
  // Fila: se o controller ainda não estiver pronto, acumulamos ações
  window.__JCQ = window.__JCQ || [];

  function doGoNext() {
    if (window.JController?.goNext) {
      try { window.JController.goNext(); } catch (e) { console.error('[CTRL] goNext erro:', e); }
      return true;
    }
    if (window.JC?.next) {
      try { window.JC.next(); } catch (e) { console.error('[CTRL] JC.next erro:', e); }
      return true;
    }
    return false;
  }

  // Expor a função global esperada pelo HTML/atributos inline
  window.goToNextSection = function () {
    if (!doGoNext()) {
      console.warn('[CTRL] Controller ainda não pronto. Enfileirando AÇÃO: next');
      window.__JCQ.push({ type: 'next' });
    }
  };

  // Quando o sistema sinalizar que está pronto, drenamos a fila
  document.addEventListener('jc:ready', () => {
    if (!window.__JCQ?.length) return;
    const queue = window.__JCQ.slice();
    window.__JCQ.length = 0;
    for (const item of queue) {
      if (item.type === 'next') doGoNext();
    }
  });

  // Delegação para qualquer botão com data-action="next" (backup)
  document.addEventListener('click', (ev) => {
    const btn = ev.target.closest?.('[data-action="next"]');
    if (!btn) return;
    ev.preventDefault();
    window.goToNextSection();
  });
})();


  let isProcessingClick = false;
  function debounceClick(callback, wait = 500) {
    return (...args) => {
      if (isProcessingClick) {
        log('Clique ignorado (debounce ativo)');
        return;
      }
      isProcessingClick = true;
      setTimeout(() => {
        isProcessingClick = false;
      }, wait);
      callback(...args);
    };
  }

  window.JC = window.JC || {
    currentBloco: 0,
    currentPergunta: 0,
    nextSection: null,
    initialized: false,
    init: (route) => {
      if (window.JC.initialized) {
        log('init já feito — ignorando.');
        return;
      }
      window.JC.initialized = true;
      log('Iniciando jornada...');

      const dependencies = {
        JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
        JORNADA_VIDEOS: !!window.JORNADA_VIDEOS,
        showSection: !!window.showSection,
        runTyping: !!window.runTyping,
        playTransition: !!window.playTransition
      };
      log('Dependências:', dependencies);

      window.perguntasLoaded = false;

      if (!window.JORNADA_BLOCKS || !window.JORNADA_VIDEOS) {
        console.error('JORNADA_BLOCKS ou JORNADA_VIDEOS não definido, pulando para section-final');
        window.__currentSectionId = 'section-final';
        window.showSection && window.showSection('section-final');
        return;
      }

      window.__currentSectionId = route === 'intro' ? 'section-intro' : route;
      window.showSection && window.showSection(window.__currentSectionId);
      log('Seção inicial:', window.__currentSectionId);
    },
    goNext: () => {
      log('Iniciando goNext... Estado atual: currentBloco=', window.JC.currentBloco, ', blocos totais=', window.JORNADA_BLOCKS ? window.JORNADA_BLOCKS.length : 0, ', currentSection=', window.__currentSectionId, ', perguntasLoaded=', window.perguntasLoaded);
      const currentSection = window.__currentSectionId || 'section-intro';
      const sections = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-selfie', 'section-perguntas', 'section-final'];
      const currentIdx = sections.indexOf(currentSection);
      log('Seção atual:', currentSection, 'Índice:', currentIdx);
      if (currentIdx < 0) {
        console.warn('Seção atual não encontrada:', currentSection);
        window.__currentSectionId = 'section-intro';
        window.showSection && window.showSection('section-intro');
        log('Reiniciando para section-intro');
        return;
      }
      function goToNextSection() {
  const currentIndex = sections.indexOf(currentSection);
  if (currentIndex < sections.length - 1) {
    const previousSection = currentSection;
    currentSection = sections[currentIndex + 1];
    console.log('[goToNextSection] Indo de', previousSection, 'para', currentSection);

    // Ocultar seção anterior
    document.querySelector(`#${previousSection}`).classList.remove('active');
    // Mostrar nova seção
    document.querySelector(`#${currentSection}`).classList.add('active');

    // Ações específicas por seção
    if (currentSection === 'section-perguntas') {
      renderQuestions(); // Chamar função do jornada-paper-qa.js
    } else if (currentSection === 'section-final') {
      console.log('[goToNextSection] Jornada concluída!');
    }
  } else {
    console.warn('[goToNextSection] Nenhuma seção seguinte disponível');
  }
}

      if (currentSection === 'section-termos') {
        const termosPg1 = document.getElementById('termos-pg1');
        const termosPg2 = document.getElementById('termos-pg2');
        if (termosPg1 && !termosPg1.classList.contains('hidden')) {
          termosPg1.classList.add('hidden');
          termosPg2.classList.remove('hidden');
          log('Avançando de termos-pg1 para termos-pg2');
          return;
        }
        const nextSection = sections[currentIdx + 1];
        window.JC.nextSection = nextSection;
        window.__currentSectionId = nextSection;
        window.showSection && window.showSection(nextSection);
        log('Avançando de', currentSection, 'para', nextSection);
        return;
      }

      if (currentSection === 'section-senha' || currentSection === 'section-guia' || currentSection === 'section-selfie') {
        const nextSection = sections[currentIdx + 1];
        window.JC.nextSection = nextSection;
        window.__currentSectionId = nextSection;
        window.showSection && window.showSection(nextSection);
        log('Avançando de', currentSection, 'para', nextSection);
        return;
      }

      if (currentSection === 'section-perguntas') {
        if (!window.perguntasLoaded) {
          if (window.loadDynamicBlocks) {
            setTimeout(() => {
              window.loadDynamicBlocks();
              window.perguntasLoaded = true;
              log('loadDynamicBlocks chamado (flag false)');
            }, 100);
            return;
          }
        }

        if (!window.JORNADA_BLOCKS || window.JORNADA_BLOCKS.length === 0) {
          console.error('JORNADA_BLOCKS não definido ou vazio');
          window.JC.nextSection = 'section-final';
          window.__currentSectionId = 'section-final';
          window.showSection && window.showSection('section-final');
          log('Avanço direto pro section-final (sem JORNADA_BLOCKS)');
          return;
        }

        const content = document.getElementById('perguntas-container');
        if (!content) {
          console.error('perguntas-container não encontrado');
          window.JC.nextSection = 'section-final';
          window.__currentSectionId = 'section-final';
          window.showSection && window.showSection('section-final');
          log('Avanço direto pro section-final (sem perguntas-container)');
          return;
        }

        const currentBloco = content.querySelector('.j-bloco:not(.hidden)') || content.querySelector(`[data-bloco="${window.JC.currentBloco || 0}"]`);
        if (!currentBloco) {
          console.error('Bloco atual não encontrado para bloco', window.JC.currentBloco);
          window.JC.currentBloco = window.JORNADA_BLOCKS.length;
          window.JC.nextSection = 'section-final';
          window.__currentSectionId = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playTransition) {
            window.playTransition(window.JORNADA_FINAL_VIDEO, () => {
              window.showSection('section-final');
              log('Vídeo final concluído');
            });
            log('Vídeo final iniciado (bloco não encontrado)');
          } else {
            window.showSection && window.showSection('section-final');
            log('Avanço direto pro final (sem vídeo, bloco não encontrado)');
          }
          return;
        }

        const perguntas = currentBloco.querySelectorAll('.j-pergunta');
        if (perguntas.length === 0) {
          console.error('Nenhuma pergunta encontrada no bloco', window.JC.currentBloco);
          window.JC.currentBloco += 1;
          if (window.JC.currentBloco >= window.JORNADA_BLOCKS.length) {
            window.JC.nextSection = 'section-final';
            window.__currentSectionId = 'section-final';
            if (window.JORNADA_FINAL_VIDEO && window.playTransition) {
              window.playTransition(window.JORNADA_FINAL_VIDEO, () => {
                window.showSection('section-final');
                log('Vídeo final concluído');
              });
              log('Vídeo final iniciado (sem perguntas)');
            } else {
              window.showSection && window.showSection('section-final');
              log('Avanço direto pro final (sem vídeo, sem perguntas)');
            }
          } else {
            const nextBloco = content.querySelector(`[data-bloco="${window.JC.currentBloco}"]`);
            if (nextBloco) {
              currentBloco.classList.add('hidden');
              nextBloco.classList.remove('hidden');
              const firstPergunta = nextBloco.querySelector('.j-pergunta');
              if (firstPergunta) {
                firstPergunta.classList.add('active');
                firstPergunta.style.display = 'block';
                window.runTyping && window.runTyping(firstPergunta.querySelector('.pergunta-enunciado'));
                log('Ativando primeira pergunta do bloco', window.JC.currentBloco);
              }
            }
          }
          return;
        }

        let currentPergunta = currentBloco.querySelector('.j-pergunta.active');
        if (!currentPergunta) {
          currentPergunta = perguntas[0];
          currentPergunta.classList.add('active');
          currentPergunta.style.display = 'block';
          log('Ativando primeira pergunta do bloco', window.JC.currentBloco);
          window.runTyping && window.runTyping(currentPergunta.querySelector('.pergunta-enunciado'));
        }
        const currentPerguntaIdx = parseInt(currentPergunta?.dataset.pergunta || '0', 10);

        if (currentPerguntaIdx < perguntas.length - 1) {
          currentPergunta.classList.remove('active');
          currentPergunta.style.display = 'none';
          const nextPergunta = perguntas[currentPerguntaIdx + 1];
          nextPergunta.classList.add('active');
          nextPergunta.style.display = 'block';
          window.JC.currentPergunta = currentPerguntaIdx + 1;
          window.runTyping && window.runTyping(nextPergunta.querySelector('.pergunta-enunciado'));
          log('Avançando para pergunta', currentPerguntaIdx + 1, 'no bloco', window.JC.currentBloco);
        } else {
          currentBloco.classList.add('hidden');
          window.JC.currentBloco += 1;
          window.JC.currentPergunta = 0;
          if (window.JC.currentBloco < window.JORNADA_BLOCKS.length) {
            const nextBloco = content.querySelector(`[data-bloco="${window.JC.currentBloco}"]`);
            if (nextBloco) {
              nextBloco.classList.remove('hidden');
              const firstPergunta = nextBloco.querySelector('.j-pergunta');
              if (firstPergunta) {
                firstPergunta.classList.add('active');
                firstPergunta.style.display = 'block';
                window.runTyping && window.runTyping(firstPergunta.querySelector('.pergunta-enunciado'));
                log('Ativando primeira pergunta do bloco', window.JC.currentBloco);
              }
              const video = window.JORNADA_BLOCKS[window.JC.currentBloco]?.video_after;
              if (video && window.playTransition) {
                window.JC.nextSection = 'section-perguntas';
                window.__currentSectionId = 'section-perguntas';
                window.playTransition(video, () => {
                  window.showSection('section-perguntas');
                  log('Vídeo do bloco concluído');
                });
                log('Reproduzindo vídeo após bloco', window.JC.currentBloco - 1, ':', video);
                return;
              } else {
                window.showSection && window.showSection('section-perguntas');
                log('Mostrando próximo bloco sem vídeo');
              }
            }
          } else {
            window.JC.nextSection = 'section-final';
            window.__currentSectionId = 'section-final';
            if (window.JORNADA_FINAL_VIDEO && window.playTransition) {
              window.playTransition(window.JORNADA_FINAL_VIDEO, () => {
                window.showSection('section-final');
                log('Vídeo final concluído');
              });
              log('Vídeo final iniciado (fim dos blocos)');
            } else {
              window.showSection && window.showSection('section-final');
              log('Avanço direto pro final (sem vídeo)');
            }
          }
        }
      }
    }
  };
  
  function initController() {
  // Inicializar botões de navegação
  document.querySelectorAll('.btn-avancar').forEach(button => {
    button.addEventListener('click', () => {
      console.log('[initController] Botão avançar clicado');
      goToNextSection();
    });
  });

  // Escutar eventos do jornada-paper-qa.js
  document.addEventListener('questionAnswered', (event) => {
    console.log('[initController] Pergunta respondida:', event.detail.questionId);
    // Avançar ou realizar outra ação, se necessário
  });

  document.addEventListener('videoSkipped', () => {
    console.log('[initController] Vídeo pulado, avançando...');
    goToNextSection();
  });

  // Carregar vídeo inicial, se necessário
  loadVideo('/path/to/initial-video.mp4'); // Ajuste o caminho
}

document.addEventListener('DOMContentLoaded', initController);
  

  document.addEventListener('click', debounceClick((e) => {
    const btn = e.target.closest('[data-action="avancar"], .btn-avancar, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney, #iniciarSenha, [data-action="termos-prev"], [data-action="termos-next"]');
    if (btn) {
      log('Clique no botão avançar:', btn.id || btn.className, ', currentSection=', window.__currentSectionId);
      if (btn.dataset.action === 'termos-prev') {
        const termosPg1 = document.getElementById('termos-pg1');
        const termosPg2 = document.getElementById('termos-pg2');
        if (termosPg2 && !termosPg2.classList.contains('hidden')) {
          termosPg2.classList.add('hidden');
          termosPg1.classList.remove('hidden');
          log('Voltando de termos-pg2 para termos-pg1');
          return;
        }
      }
      if (window.JC && window.JC.goNext) {
        window.JC.goNext();
      } else {
        console.error('window.JC.goNext não definido');
        window.toast && window.toast('Erro ao avançar. Tente recarregar a página.');
      }
    }
  }));

  console.log('[JORNADA_CONTROLLER] jornada-controller.js carregado');
  
})();

