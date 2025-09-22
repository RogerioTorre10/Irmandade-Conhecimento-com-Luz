// jornada-controller.js
(function() {
  const log = (...args) => console.log('[JORNADA_CONTROLLER]', ...args);

  window.JC = window.JC || {
    currentBloco: 0,
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
        playVideo: !!window.playVideo
      };
      log('Dependências:', dependencies);

      if (window.loadDynamicBlocks) {
        window.loadDynamicBlocks();
        log('loadDynamicBlocks concluído');
      } else {
        console.error('loadDynamicBlocks não definido');
      }

      window.showSection && window.showSection(route === 'intro' ? 'section-intro' : route);
    },
    goNext: () => {
      log('Iniciando goNext...');
      const currentSection = window.__currentSectionId;
      const sections = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-selfie', 'section-perguntas', 'section-final'];
      const currentIdx = sections.indexOf(currentSection);
      if (currentIdx < 0) {
        console.warn('Seção atual não encontrada:', currentSection);
        return;
      }

      if (currentSection === 'section-perguntas') {
        const content = document.getElementById('perguntas-container');
        if (!content) {
          console.error('perguntas-container não encontrado');
          window.JC.nextSection = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Reproduzindo vídeo final:', window.JORNADA_FINAL_VIDEO);
          } else {
            window.showSection('section-final');
          }
          return;
        }

        const currentBloco = content.querySelector('.j-bloco:not(.hidden)') || content.querySelector(`[data-bloco="${window.JC.currentBloco || 0}"]`);
        if (!currentBloco) {
          console.error('Bloco atual não encontrado para bloco', window.JC.currentBloco);
          window.JC.nextSection = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Reproduzindo vídeo final:', window.JORNADA_FINAL_VIDEO);
          } else {
            window.showSection('section-final');
          }
          return;
        }

        const perguntas = currentBloco.querySelectorAll('.j-pergunta') || [];
        const currentPergunta = currentBloco.querySelector('.j-pergunta.active') || perguntas[0];
        const currentPerguntaIdx = parseInt(currentPergunta?.dataset.pergunta || '0', 10);

        if (perguntas.length === 0) {
          console.error('Nenhuma pergunta encontrada no bloco', window.JC.currentBloco);
          window.JC.nextSection = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Reproduzindo vídeo final:', window.JORNADA_FINAL_VIDEO);
          } else {
            window.showSection('section-final');
          }
          return;
        }

        if (currentPerguntaIdx < perguntas.length - 1) {
          currentPergunta.classList.remove('active');
          currentPergunta.style.display = 'none';
          perguntas[currentPerguntaIdx + 1].classList.add('active');
          perguntas[currentPerguntaIdx + 1].style.display = 'block';
          window.runTyping && window.runTyping(perguntas[currentPerguntaIdx + 1]);
          log('Avançando para pergunta', currentPerguntaIdx + 1, 'no bloco', window.JC.currentBloco);
        } else if (window.JORNADA_BLOCKS && window.JC.currentBloco < window.JORNADA_BLOCKS.length - 1) {
          currentBloco.style.display = 'none';
          window.JC.currentBloco = (window.JC.currentBloco || 0) + 1;
          const nextBloco = content.querySelector(`[data-bloco="${window.JC.currentBloco}"]`);
          if (nextBloco) {
            nextBloco.style.display = 'block';
            const first = nextBloco.querySelector('.j-pergunta');
            if (first) {
              first.classList.add('active');
              first.style.display = 'block';
              window.runTyping && window.runTyping(nextBloco);
            }
            const video = currentBloco.dataset.video;
            if (video && window.playVideo) {
              window.JC.nextSection = 'section-perguntas';
              window.playVideo(video);
              log('Reproduzindo vídeo após bloco', window.JC.currentBloco - 1, ':', video);
              return;
            }
          }
        } else {
          window.JC.nextSection = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Reproduzindo vídeo final:', window.JORNADA_FINAL_VIDEO);
            return;
          }
        }
      }

      const nextSection = window.JC.nextSection || sections[currentIdx + 1];
      if (nextSection) {
        window.JC.nextSection = null;
        window.showSection && window.showSection(nextSection);
        log('Navegando de', currentSection, 'para', nextSection);
      } else {
        log('Nenhuma seção seguinte encontrada para', currentSection);
      }
    }
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="avancar"], .btn-avancar, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney');
    if (btn) {
      log('Clique no botão avançar:', btn.id || btn.className);
      if (window.JC && window.JC.goNext) {
        window.JC.goNext();
      } else {
        console.error('window.JC.goNext não definido');
        window.toast && window.toast('Erro ao avançar. Tente recarregar a página.');
      }
    }
  });

  log('jornada-controller.js carregado');
})();
