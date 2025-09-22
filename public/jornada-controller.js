// jornada-controller.js
(function() {
  const log = (...args) => console.log('[JORNADA_CONTROLLER]', ...args);

  window.perguntasLoaded = false; // Flag pra controlar blocos

  // Debounce pra evitar cliques múltiplos
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

  // Função playVideo (filme-0 a filme-5)
  window.playVideo = function(videoSrc) {
    // Esconde todas as seções pra evitar overlapping
    document.querySelectorAll('.j-section').forEach(section => {
      section.style.display = 'none';
      section.classList.add('hidden');
    });
    log('Escondendo todas as seções durante vídeo:', videoSrc);

    const videoContainer = document.getElementById('video-container');
    if (!videoContainer) {
      console.error('[JORNADA_CONTROLLER] video-container não encontrado');
      const nextSection = videoSrc.includes('filme-5') ? 'section-final' : 'section-perguntas';
      window.JC.nextSection = nextSection;
      window.__currentSectionId = nextSection;
      window.showSection && window.showSection(nextSection);
      log('Forçando', nextSection, '(sem video-container)');
      if (nextSection === 'section-perguntas' && window.loadDynamicBlocks) {
        setTimeout(() => {
          window.loadDynamicBlocks();
          window.perguntasLoaded = true;
          log('loadDynamicBlocks chamado após erro no video-container');
        }, 100); // Delay pra DOM
      }
      return;
    }
    videoContainer.innerHTML = '';
    videoContainer.style.display = 'block';

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.controls = true;
    video.style.width = '100%';
    video.style.height = 'auto';

    // Timeout de segurança: 60 segundos
    const videoTimeout = setTimeout(() => {
      log('Timeout de segurança disparado para vídeo:', videoSrc);
      videoContainer.style.display = 'none';
      const nextSection = videoSrc.includes('filme-5') ? 'section-final' : 'section-perguntas';
      window.JC.nextSection = nextSection;
      window.__currentSectionId = nextSection;
      window.showSection && window.showSection(nextSection);
      log('Forçando', nextSection, 'após timeout');
      if (nextSection === 'section-perguntas' && window.loadDynamicBlocks) {
        setTimeout(() => {
          window.loadDynamicBlocks();
          window.perguntasLoaded = true;
          log('loadDynamicBlocks chamado após timeout');
        }, 100);
      } else if (nextSection === 'section-final') {
        const finalText = document.querySelector('#section-final [data-typing="true"]');
        if (finalText && window.runTyping) {
          window.runTyping(finalText);
          log('runTyping disparado para section-final');
        }
      }
    }, 60000);

    // onended: avança conforme vídeo
    video.onended = () => {
      clearTimeout(videoTimeout);
      videoContainer.style.display = 'none';
      log('Vídeo terminado:', videoSrc);
      const nextSection = videoSrc.includes('filme-5') ? 'section-final' : 'section-perguntas';
      window.JC.nextSection = nextSection;
      window.__currentSectionId = nextSection;
      window.showSection && window.showSection(nextSection);
      log('Avançando para', nextSection, 'após vídeo');
      if (nextSection === 'section-perguntas' && window.loadDynamicBlocks) {
        setTimeout(() => {
          window.loadDynamicBlocks();
          window.perguntasLoaded = true;
          log('loadDynamicBlocks chamado após vídeo');
        }, 100);
      } else if (nextSection === 'section-final') {
        const finalText = document.querySelector('#section-final [data-typing="true"]');
        if (finalText && window.runTyping) {
          window.runTyping(finalText);
          log('runTyping disparado para section-final');
        }
      }
    };

    // Erro no vídeo: força avanço
    video.onerror = () => {
      clearTimeout(videoTimeout);
      log('Erro no vídeo:', videoSrc, '- Forçando avanço');
      videoContainer.style.display = 'none';
      const nextSection = videoSrc.includes('filme-5') ? 'section-final' : 'section-perguntas';
      window.JC.nextSection = nextSection;
      window.__currentSectionId = nextSection;
      window.showSection && window.showSection(nextSection);
      log('Forçando', nextSection, 'após erro no vídeo');
      if (nextSection === 'section-perguntas' && window.loadDynamicBlocks) {
        setTimeout(() => {
          window.loadDynamicBlocks();
          window.perguntasLoaded = true;
          log('loadDynamicBlocks chamado após erro no vídeo');
        }, 100);
      } else if (nextSection === 'section-final') {
        const finalText = document.querySelector('#section-final [data-typing="true"]');
        if (finalText && window.runTyping) {
          window.runTyping(finalText);
          log('runTyping disparado para section-final');
        }
      }
    };

    videoContainer.appendChild(video);
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
        playVideo: !!window.playVideo,
        playTransitionVideo: !!window.playTransitionVideo
      };
      log('Dependências:', dependencies);

      window.perguntasLoaded = false; // Reset flag

      if (!window.JORNADA_BLOCKS || !window.JORNADA_VIDEOS) {
        console.error('JORNADA_BLOCKS ou JORNADA_VIDEOS não definido, pulando para section-final');
        window.__currentSectionId = 'section-final';
        window.showSection && window.showSection('section-final');
        return;
      }

      window.__currentSectionId = route === 'intro' ? 'section-intro' : route;
      if (route === 'section-guia' && window.playTransitionVideo) {
        window.playTransitionVideo();
        log('Reproduzindo transicao_selfie após section-guia');
      } else if (route === 'section-perguntas' && window.loadDynamicBlocks) {
        setTimeout(() => {
          window.loadDynamicBlocks();
          window.perguntasLoaded = true;
          window.showSection && window.showSection('section-perguntas');
          log('loadDynamicBlocks concluído no init');
        }, 100);
      } else {
        window.showSection && window.showSection(window.__currentSectionId);
        log('Seção inicial:', window.__currentSectionId);
      }
    },
    goNext: () => {
      log('Iniciando goNext... Estado atual: currentBloco=', window.JC.currentBloco, ', blocos totais=', window.JORNADA_BLOCKS ? window.JORNADA_BLOCKS.length : 0, ', currentSection=', window.__currentSectionId, ', perguntasLoaded=', window.perguntasLoaded);
      const currentSection = window.__currentSectionId || 'section-intro';
      const sections = ['section-intro', 'section-termos', 'section-senha', 'section-guia', 'section-selfie', 'section-perguntas', 'section-final'];
      const currentIdx = sections.indexOf(currentSection);
      if (currentIdx < 0) {
        console.warn('Seção atual não encontrada:', currentSection);
        window.__currentSectionId = 'section-intro';
        window.showSection && window.showSection('section-intro');
        log('Reiniciando para section-intro');
        return;
      }

      if (currentSection === 'section-termos' || currentSection === 'section-senha') {
        const nextSection = sections[currentIdx + 1];
        window.JC.nextSection = nextSection;
        window.__currentSectionId = nextSection;
        window.showSection && window.showSection(nextSection);
        log('Avançando de', currentSection, 'para', nextSection);
        if (nextSection === 'section-guia' && window.playTransitionVideo) {
          setTimeout(() => {
            window.playTransitionVideo();
            log('Reproduzindo transicao_selfie após', currentSection);
          }, 100);
        }
        return;
      }

      if (currentSection === 'section-guia') {
        if (window.playTransitionVideo) {
          window.playTransitionVideo();
          log('Reproduzindo transicao_selfie após section-guia');
          return;
        } else {
          window.JC.nextSection = 'section-selfie';
          window.__currentSectionId = 'section-selfie';
          window.showSection && window.showSection('section-selfie');
          log('Avançando para section-selfie (sem transicao_selfie)');
        }
        return;
      }

      if (currentSection === 'section-selfie') {
        if (window.JORNADA_VIDEOS?.intro) {
          window.JC.nextSection = 'section-perguntas';
          window.__currentSectionId = 'section-perguntas';
          window.playVideo(window.JORNADA_VIDEOS.intro);
          log('Reproduzindo filme-0 após section-selfie');
          return;
        } else {
          window.JC.nextSection = 'section-perguntas';
          window.__currentSectionId = 'section-perguntas';
          window.showSection && window.showSection('section-perguntas');
          log('Avançando para section-perguntas (sem filme-0)');
          if (window.loadDynamicBlocks) {
            setTimeout(() => {
              window.loadDynamicBlocks();
              window.perguntasLoaded = true;
              log('loadDynamicBlocks chamado após section-selfie');
            }, 100);
          }
        }
        return;
      }

      if (currentSection === 'section-perguntas') {
        if (!window.perguntasLoaded) {
          if (window.loadDynamicBlocks) {
            setTimeout(() => {
              window.loadDynamicBlocks();
              window.perguntasLoaded = true;
              log('loadDynamicBlocks chamado (flag false) - ignorando goNext por agora');
            }, 100);
          }
          return;
        }

        if (!window.JORNADA_BLOCKS || window.JORNADA_BLOCKS.length === 0) {
          console.error('window.JORNADA_BLOCKS não definido ou vazio');
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
          window.JC.currentBloco = window.JORNADA_BLOCKS.length; // Marca como acabado
          window.JC.nextSection = 'section-final';
          window.__currentSectionId = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Vídeo final iniciado (bloco não encontrado)');
          } else {
            window.showSection && window.showSection('section-final');
            log('Avanço direto pro final (sem vídeo, bloco não encontrado)');
          }
          return;
        }

        const perguntas = currentBloco.querySelectorAll('.j-pergunta') || [];
        if (perguntas.length === 0) {
          console.error('Nenhuma pergunta encontrada no bloco', window.JC.currentBloco);
          window.JC.currentBloco += 1;
          if (window.JC.currentBloco >= window.JORNADA_BLOCKS.length) {
            window.JC.nextSection = 'section-final';
            window.__currentSectionId = 'section-final';
            if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
              window.playVideo(window.JORNADA_FINAL_VIDEO);
              log('Vídeo final iniciado (sem perguntas)');
            } else {
              window.showSection && window.showSection('section-final');
              log('Avanço direto pro final (sem vídeo, sem perguntas)');
            }
          }
          return;
        }

        const currentPergunta = currentBloco.querySelector('.j-pergunta.active') || perguntas[0];
        const currentPerguntaIdx = parseInt(currentPergunta?.dataset.pergunta || '0', 10);

        if (currentPerguntaIdx < perguntas.length - 1) {
          currentPergunta.classList.remove('active');
          currentPergunta.style.display = 'none';
          const nextPergunta = perguntas[currentPerguntaIdx + 1];
          nextPergunta.classList.add('active');
          nextPergunta.style.display = 'block';
          window.JC.currentPergunta = currentPerguntaIdx + 1;
          window.runTyping && window.runTyping(nextPergunta);
          log('Avançando para pergunta', currentPerguntaIdx + 1, 'no bloco', window.JC.currentBloco);
        } else if (window.JC.currentBloco < window.JORNADA_BLOCKS.length - 1) {
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
              window.__currentSectionId = 'section-perguntas';
              window.playVideo(video);
              log('Reproduzindo vídeo após bloco', window.JC.currentBloco - 1, ':', video);
              return;
            }
          }
        } else {
          log('Fim dos blocos! Iniciando vídeo final.');
          window.JC.nextSection = 'section-final';
          window.__currentSectionId = 'section-final';
          if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
            window.playVideo(window.JORNADA_FINAL_VIDEO);
            log('Vídeo final iniciado - deve avançar no onended');
            return;
          } else {
            window.showSection && window.showSection('section-final');
            log('Avanço direto pro final (sem vídeo)');
            const finalText = document.querySelector('#section-final [data-typing="true"]');
            if (finalText && window.runTyping) {
              window.runTyping(finalText);
              log('runTyping disparado para section-final');
            }
          }
        }
      } else {
        const nextSection = window.JC.nextSection || sections[currentIdx + 1];
        if (nextSection) {
          window.JC.nextSection = null;
          window.__currentSectionId = nextSection;
          window.showSection && window.showSection(nextSection);
          log('Navegando de', currentSection, 'para', nextSection);
          if (nextSection === 'section-perguntas' && window.loadDynamicBlocks) {
            setTimeout(() => {
              window.loadDynamicBlocks();
              window.perguntasLoaded = true;
              log('loadDynamicBlocks chamado ao entrar em section-perguntas');
            }, 100);
          } else if (nextSection === 'section-final') {
            const finalText = document.querySelector('#section-final [data-typing="true"]');
            if (finalText && window.runTyping) {
              window.runTyping(finalText);
              log('runTyping disparado para section-final');
            }
          }
        } else {
          log('Nenhuma seção seguinte encontrada para', currentSection);
        }
      }
    }
  };

  // Event listener com debounce
  document.addEventListener('click', debounceClick((e) => {
    const btn = e.target.closest('[data-action="avancar"], .btn-avancar, #iniciar, [data-action="skip-selfie"], [data-action="select-guia"], #btnSkipSelfie, #btnStartJourney');
    if (btn) {
      log('Clique no botão avançar:', btn.id || btn.className, ', currentSection=', window.__currentSectionId);
      if (window.JC && window.JC.goNext) {
        window.JC.goNext();
      } else {
        console.error('window.JC.goNext não definido');
        window.toast && window.toast('Erro ao avançar. Tente recarregar a página.');
      }
    }
  }));

  log('jornada-controller.js carregado');
})();
