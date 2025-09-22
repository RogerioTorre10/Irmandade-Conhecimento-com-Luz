// jornada-controller.js
(function() {
  const log = (...args) => console.log('[JORNADA_CONTROLLER]', ...args);

  // Função helper para playVideo com onended para vídeo final
  window.playVideo = window.playVideo || function(videoSrc) {
    const videoContainer = document.getElementById('video-container') || document.getElementById('transicao-video-container') || document.createElement('div'); // Fallback pro container
    if (!videoContainer.parentNode) document.body.appendChild(videoContainer);
    videoContainer.innerHTML = '';

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.controls = true;
    video.style.width = '100%';
    video.style.height = 'auto';

    // onended genérico: esconde vídeo e avança (específico pro final)
    video.onended = () => {
      videoContainer.style.display = 'none';
      log('Vídeo terminado:', videoSrc);
      if (videoSrc.includes('filme-5') || videoSrc === window.JORNADA_FINAL_VIDEO) {
        // Força avanço pro final após filme-5
        window.JC.nextSection = 'section-final';
        window.__currentSectionId = 'section-final';
        window.showSection && window.showSection('section-final');
        log('Avançando para section-final após vídeo final');
      } else {
        // Para outros vídeos, volta pro estado de perguntas ou próxima seção
        window.JC.nextSection = 'section-perguntas';
        window.showSection && window.showSection('section-perguntas');
        log('Voltando para section-perguntas após vídeo');
      }
    };

    // Erro no vídeo: força avanço pra evitar loop
    video.onerror = () => {
      log('Erro no vídeo:', videoSrc, '- Forçando avanço');
      videoContainer.style.display = 'none';
      if (videoSrc.includes('filme-5')) {
        window.showSection && window.showSection('section-final');
      }
    };

    videoContainer.appendChild(video);
    videoContainer.style.display = 'block';
    log('Reproduzindo vídeo:', videoSrc);
  };

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
        playVideo: !!window.playVideo
      };
      log('Dependências:', dependencies);

      if (route === 'section-perguntas' && window.loadDynamicBlocks) {
        window.loadDynamicBlocks();
        log('loadDynamicBlocks concluído');
      }

      window.showSection && window.showSection(route === 'intro' ? 'section-intro' : route);
    },
    goNext: () => {
      log('Iniciando goNext... Estado atual: currentBloco=', window.JC.currentBloco, ', blocos totais=', window.JORNADA_BLOCKS ? window.JORNADA_BLOCKS.length : 0);
      const currentSection = window.__currentSectionId || 'section-intro';
      const sections = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-selfie', 'section-perguntas', 'section-final'];
      const currentIdx = sections.indexOf(currentSection);
      if (currentIdx < 0) {
        console.warn('Seção atual não encontrada:', currentSection);
        return;
      }

      if (currentSection === 'section-perguntas') {
        if (!window.JORNADA_BLOCKS || window.JORNADA_BLOCKS.length === 0) {
          console.error('window.JORNADA_BLOCKS não definido ou vazio');
          window.JC.nextSection = 'section-final';
          window.showSection('section-final');
          return;
        }

        const content = document.getElementById('perguntas-container');
        if (!content) {
          console.error('perguntas-container não encontrado');
          window.JC.nextSection = 'section-final';
          window.showSection('section-final');
          return;
        }

        const currentBloco = content.querySelector('.j-bloco:not(.hidden)') || content.querySelector(`[data-bloco="${window.JC.currentBloco || 0}"]`);
        if (!currentBloco) {
          console.error('Bloco atual não encontrado para bloco', window.JC.currentBloco);
          // Força fim se bloco não encontrado (anti-loop)
          window.JC.currentBloco = window.JORNADA_BLOCKS.length; // Marca como "acabado"
          window.JC.nextSection = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
          } else {
            window.showSection('section-final');
          }
          return;
        }

        const perguntas = currentBloco.querySelectorAll('.j-pergunta') || [];
        if (perguntas.length === 0) {
          console.error('Nenhuma pergunta encontrada no bloco', window.JC.currentBloco);
          // Força próximo bloco ou final
          window.JC.currentBloco += 1;
          if (window.JC.currentBloco >= window.JORNADA_BLOCKS.length) {
            window.JC.nextSection = 'section-final';
            if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
              window.playVideo(window.JORNADA_FINAL_VIDEO);
            } else {
              window.showSection('section-final');
            }
          }
          return;
        }

        const currentPergunta = currentBloco.querySelector('.j-pergunta.active') || perguntas[0];
        const currentPerguntaIdx = parseInt(currentPergunta?.dataset.pergunta || '0', 10);

        if (currentPerguntaIdx < perguntas.length - 1) {
          // Avança pergunta no mesmo bloco
          currentPergunta.classList.remove('active');
          currentPergunta.style.display = 'none';
          const nextPergunta = perguntas[currentPerguntaIdx + 1];
          nextPergunta.classList.add('active');
          nextPergunta.style.display = 'block';
          window.JC.currentPergunta = currentPerguntaIdx + 1;
          window.runTyping && window.runTyping(nextPergunta);
          log('Avançando para pergunta', currentPerguntaIdx + 1, 'no bloco', window.JC.currentBloco);
        } else if (window.JC.currentBloco < window.JORNADA_BLOCKS.length - 1) {
          // Avança pro próximo bloco
          currentBloco.classList.add('hidden');
          window.JC.currentBloco += 1;
          window.JC.currentPergunta = 0;
          const nextBloco = content.querySelector(`[data-bloco="${window.JC.currentBloco}"]`);
          if (nextBloco) {
            nextBloco.classList.remove('hidden');
            const firstPergunta = nextBloco.querySelector('.j-pergunta');
            if (firstPergunta) {
              firstPergunta.classList.add('active');
              firstPergunta.style.display = 'block';
              window.runTyping && window.runTyping(firstPergunta);
            }
            const video = nextBloco.dataset.video;
            if (video && window.playVideo) {
              window.JC.nextSection = 'section-perguntas';
              window.playVideo(video);
              log('Reproduzindo vídeo após bloco', window.JC.currentBloco - 1, ':', video);
              return; // Para aqui e espera onended voltar
            }
          }
        } else {
          // Fim dos blocos: vídeo final e section-final
          log('Fim dos blocos! Iniciando vídeo final.');
          window.JC.nextSection = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Vídeo final iniciado - deve avançar no onended');
            return; // Para aqui, onended cuida do resto
          } else {
            // Fallback se sem vídeo
            window.showSection('section-final');
            log('Avanço direto pro final (sem vídeo)');
          }
        }
      } else {
        const nextSection = window.JC.nextSection || sections[currentIdx + 1];
        if (nextSection) {
          window.JC.nextSection = null;
          window.__currentSectionId = nextSection; // Atualiza o estado explicitamente
          window.showSection && window.showSection(nextSection);
          log('Navegando de', currentSection, 'para', nextSection);
        } else {
          log('Nenhuma seção seguinte encontrada para', currentSection);
        }
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
