// jornada-controller.js
(function() {
  const log = (...args) => console.log('[JORNADA_CONTROLLER]', ...args);

  window.perguntasLoaded = false;

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

  window.showSection = window.showSection || function(sectionId) {
    document.querySelectorAll('.j-section, #videoOverlay, #video-container').forEach(elem => {
      elem.classList.add('hidden');
      elem.style.display = 'none';
    });
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.classList.remove('hidden');
      targetSection.style.display = 'block';
      const canvas = document.getElementById('jornada-canvas');
      if (sectionId === 'section-perguntas') {
        canvas.classList.remove('pergaminho-v');
        canvas.classList.add('pergaminho-h');
      } else {
        canvas.classList.remove('pergaminho-h');
        canvas.classList.add('pergaminho-v');
      }
      log('[showSection] Exibindo seção:', sectionId);
    } else {
      console.error('[showSection] Seção não encontrada:', sectionId);
    }
  };

  window.playVideo = function(videoSrc) {
    document.querySelectorAll('.j-section, #videoOverlay').forEach(elem => {
      elem.classList.add('hidden');
      elem.style.display = 'none';
    });
    log('Escondendo todas as seções e videoOverlay durante vídeo:', videoSrc);

    let videoContainer = document.getElementById('video-container');
    if (!videoContainer) {
      console.warn('[JORNADA_CONTROLLER] video-container não encontrado, criando dinamicamente');
      videoContainer = document.createElement('div');
      videoContainer.id = 'video-container';
      videoContainer.style.display = 'none';
      document.body.appendChild(videoContainer);
    }
    videoContainer.innerHTML = '';
    videoContainer.style.display = 'block';

    const video = document.createElement('video');
    video.src = videoSrc;
    video.autoplay = true;
    video.controls = true;
    video.className = 'video-player';
    video.style.width = '100%';
    video.style.height = 'auto';

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
        const finalText = document.querySelector('#section-final p[data-typing="true"]');
        if (finalText && window.runTyping) {
          window.runTyping(finalText);
          log('runTyping disparado para section-final (p)');
        }
      }
    }, 60000);

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
        const finalText = document.querySelector('#section-final p[data-typing="true"]');
        if (finalText && window.runTyping) {
          window.runTyping(finalText);
          log('runTyping disparado para section-final (p)');
        }
      }
    };

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
        const finalText = document.querySelector('#section-final p[data-typing="true"]');
        if (finalText && window.runTyping) {
          window.runTyping(finalText);
          log('runTyping disparado para section-final (p)');
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
      if (currentIdx < 0) {
        console.warn('Seção atual não encontrada:', currentSection);
        window.__currentSectionId = 'section-intro';
        window.showSection && window.showSection('section-intro');
        log('Reiniciando para section-intro');
        return;
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

      if (currentSection === 'section-senha') {
        const nextSection = sections[currentIdx + 1];
        window.JC.nextSection = nextSection;
        window.__currentSectionId = nextSection;
        window.showSection && window.showSection(nextSection);
        log('Avançando de', currentSection, 'para', nextSection);
        return;
      }

      if (currentSection === 'section-guia') {
        window.JC.nextSection = 'section-selfie';
        window.__currentSectionId = 'section-guia';
        window.showSection && window.showSection('section-guia');
        setTimeout(() => {
          window.playTransitionVideo();
          log('Reproduzindo transicao_selfie após section-guia');
        }, 500);
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
              const content = document.getElementById('perguntas-container');
              if (content) {
                const firstBloco = content.querySelector('[data-bloco="0"]');
                if (firstBloco) {
                  firstBloco.classList.remove('hidden');
                  const firstPergunta = firstBloco.querySelector('.j-pergunta[data-pergunta="0"]');
                  if (firstPergunta) {
                    firstPergunta.classList.add('active');
                    firstPergunta.style.display = 'block';
                    window.runTyping && window.runTyping(firstPergunta.querySelector('.pergunta-enunciado'));
                    log('Ativando primeira pergunta do bloco 0');
                  }
                }
              }
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
              const content = document.getElementById('perguntas-container');
              if (content) {
                const firstBloco = content.querySelector('[data-bloco="0"]');
                if (firstBloco) {
                  firstBloco.classList.remove('hidden');
                  const firstPergunta = firstBloco.querySelector('.j-pergunta[data-pergunta="0"]');
                  if (firstPergunta) {
                    firstPergunta.classList.add('active');
                    firstPergunta.style.display = 'block';
                    window.runTyping && window.runTyping(firstPergunta.querySelector('.pergunta-enunciado'));
                    log('Ativando primeira pergunta do bloco 0');
                  }
                }
              }
            }, 100);
            return;
          }
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
          window.JC.currentBloco = window.JORNADA_BLOCKS.length;
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

        const perguntas = currentBloco.querySelectorAll('.j-pergunta');
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
              if (video && window.playVideo) {
                window.JC.nextSection = 'section-perguntas';
                window.__currentSectionId = 'section-perguntas';
                window.playVideo(video);
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
            if (window.JORNADA_FINAL_VIDEO && window.playVideo) {
              window.playVideo(window.JORNADA_FINAL_VIDEO);
              log('Vídeo final iniciado (fim dos blocos)');
            } else {
              window.showSection && window.showSection('section-final');
              log('Avanço direto pro final (sem vídeo)');
              const finalText = document.querySelector('#section-final p[data-typing="true"]');
              if (finalText && window.runTyping) {
                window.runTyping(finalText);
                log('runTyping disparado para section-final (p)');
              }
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
              const content = document.getElementById('perguntas-container');
              if (content) {
                const firstBloco = content.querySelector('[data-bloco="0"]');
                if (firstBloco) {
                  firstBloco.classList.remove('hidden');
                  const firstPergunta = firstBloco.querySelector('.j-pergunta[data-pergunta="0"]');
                  if (firstPergunta) {
                    firstPergunta.classList.add('active');
                    firstPergunta.style.display = 'block';
                    window.runTyping && window.runTyping(firstPergunta.querySelector('.pergunta-enunciado'));
                    log('Ativando primeira pergunta do bloco 0');
                  }
                }
              }
            }, 100);
          } else if (nextSection === 'section-final') {
            const finalText = document.querySelector('#section-final p[data-typing="true"]');
            if (finalText && window.runTyping) {
              window.runTyping(finalText);
              log('runTyping disparado para section-final (p)');
            }
          }
        } else {
          log('Nenhuma seção seguinte encontrada para', currentSection);
        }
      }
    }
  };

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

  log('jornada-controller.js carregado');
})();
