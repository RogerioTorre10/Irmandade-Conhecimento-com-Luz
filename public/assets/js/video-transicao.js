(function () {
  'use strict';

  const log = (...args) => console.log('[VIDEO_TRANSICAO]', ...args);
  let isPlaying = false;

  function playTransitionVideo(src, nextSectionId) {
    if (isPlaying) {
      log('Já reproduzindo vídeo, ignorando...');
      return;
    }
    isPlaying = true;

    log('Tentando reproduzir:', src);
    let overlay = document.getElementById('videoOverlay');
    let video = document.getElementById('videoTransicao');
    let fallback = document.getElementById('videoFallback');

    if (!overlay || !video) {
      log('Criando elementos de vídeo dinamicamente');
      overlay = document.createElement('div');
      overlay.id = 'videoOverlay';
      overlay.style.cssText = 'position: fixed; inset: 0; background: #000; z-index: 9999; display: none;';
      video = document.createElement('video');
      video.id = 'videoTransicao';
      video.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
      fallback = document.createElement('div');
      fallback.id = 'videoFallback';
      fallback.classList.add('hidden');
      fallback.style.display = 'none';
      const skipButton = document.createElement('button');
      skipButton.id = 'skipVideo';
      skipButton.textContent = 'Pular';
      skipButton.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 8px; background: #fff; color: #000;';
      overlay.appendChild(video);
      overlay.appendChild(fallback);
      overlay.appendChild(skipButton);
      document.body.appendChild(overlay);
    }

    let done = false;
    const cleanup = () => {
      if (done) return;
      done = true;
      try {
        video.pause();
        video.src = '';
      } catch (e) {
        console.error('[VIDEO_TRANSICAO] Erro ao pausar vídeo:', e);
      }
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
      fallback.classList.add('hidden');
      video.classList.remove('hidden');
      isPlaying = false;
      log('Transição concluída, navegando para:', nextSectionId);
      if (typeof window.JC?.show === 'function') {
        window.JC.show(nextSectionId);
      } else {
        console.warn('[VIDEO_TRANSICAO] Fallback navigation to:', nextSectionId);
        window.location.href = `jornada-conhecimento-com-luz1.html#${nextSectionId}`;
      }
    };

    video.src = src;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.controls = false;

    video.addEventListener('loadeddata', () => {
      log('Vídeo carregado, iniciando reprodução');
      overlay.classList.remove('hidden');
      overlay.style.display = 'block';
      video.play().catch(e => {
        console.warn('[VIDEO_TRANSICAO] Erro ao iniciar vídeo:', e);
        fallback.classList.remove('hidden');
        video.classList.add('hidden');
        window.toast?.('Erro ao reproduzir vídeo de transição. Usando fallback.', 'error');
        setTimeout(cleanup, 2000); // Delay de 2s no fallback
      });
    }, { once: true });

    video.addEventListener('ended', () => {
      log('Vídeo finalizado:', src);
      cleanup();
    }, { once: true });

    video.addEventListener('error', (e) => {
      console.error('[VIDEO_TRANSICAO] Erro ao carregar vídeo:', src, e);
      fallback.classList.remove('hidden');
      video.classList.add('hidden');
      window.toast?.('Erro ao carregar vídeo de transição. Usando fallback.', 'error');
      setTimeout(cleanup, 2000); // Delay de 2s no fallback
    }, { once: true });

    // Verificação via fetch
    fetch(src, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) throw new Error('Vídeo não encontrado');
        log('Iniciando reprodução:', src);
      })
      .catch(e => {
        console.error('[VIDEO_TRANSICAO] Erro ao verificar vídeo:', src, e);
        window.toast?.('Vídeo de transição não encontrado.', 'error');
        setTimeout(cleanup, 2000); // Delay de 2s no fallback
      });

    // Listener para o botão de pular
    const skipButton = overlay.querySelector('#skipVideo');
    if (skipButton) {
      skipButton.addEventListener('click', () => {
        if (!skipButton.dataset.clicked) {
          skipButton.dataset.clicked = 'true';
          log('Vídeo pulado pelo usuário');
          cleanup();
          setTimeout(() => delete skipButton.dataset.clicked, 1000); // Reativar após 1s
        }
      }, { once: true });
    }
  }

  // Exportar a função globalmente
  window.playTransitionVideo = playTransitionVideo;

  log('jornada-video-transicao.js carregado');
})();
