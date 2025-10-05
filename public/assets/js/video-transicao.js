(function() {
  const log = (...args) => console.log('[VIDEO_TRANSICAO]', ...args);
  let isPlaying = false;

  window.playTransitionVideo = function(videoSrc = '/assets/videos/conhecimento-com-luz-jardim.mp4') {
    if (isPlaying) {
      log('Já está reproduzindo um vídeo, ignorando:', videoSrc);
      return;
    }
    isPlaying = true;

    const overlay = document.getElementById('videoOverlay');
    const video = document.getElementById('videoTransicao');
    const fallback = document.getElementById('videoFallback');
    if (!overlay || !video) {
      console.error('[VIDEO_TRANSICAO] Elementos de vídeo não encontrados', { overlay: !!overlay, video: !!video });
      window.toast && window.toast('Erro ao reproduzir vídeo de transição.');
      isPlaying = false;
      window.JC.goNext();
      log('Avançando para próxima seção (sem elementos de vídeo)');
      return;
    }
    log('Tentando reproduzir:', videoSrc);

    try {
      fetch(videoSrc, { method: 'HEAD' })
        .then(response => {
          if (!response.ok) throw new Error('Vídeo não encontrado');
          video.src = videoSrc;
          video.onended = () => {
            log('Vídeo finalizado:', videoSrc);
            overlay.classList.add('hidden');
            video.src = '';
            isPlaying = false;
            window.JC.goNext();
            log('Avançando para próxima seção após vídeo');
          };
          video.onerror = (e) => {
            console.error('[VIDEO_TRANSICAO] Erro ao carregar vídeo:', videoSrc, e);
            fallback.classList.remove('hidden');
            video.classList.add('hidden');
            window.toast && window.toast('Erro ao carregar vídeo de transição. Usando fallback.');
            setTimeout(() => {
              overlay.classList.add('hidden');
              fallback.classList.add('hidden');
              video.classList.remove('hidden');
              isPlaying = false;
              window.JC.goNext();
              log('Avançando para próxima seção após erro');
            }, 3000);
          };
          overlay.classList.remove('hidden');
          video.play().catch(e => {
            console.error('[VIDEO_TRANSICAO] Erro ao iniciar reprodução:', videoSrc, e);
            fallback.classList.remove('hidden');
            video.classList.add('hidden');
            window.toast && window.toast('Erro ao reproduzir vídeo de transição. Usando fallback.');
            setTimeout(() => {
              overlay.classList.add('hidden');
              fallback.classList.add('hidden');
              video.classList.remove('hidden');
              isPlaying = false;
              window.JC.goNext();
              log('Avançando para próxima seção após erro de reprodução');
            }, 3000);
          });
          log('Iniciando reprodução:', videoSrc);
        })
        .catch(e => {
          console.error('[VIDEO_TRANSICAO] Erro ao verificar vídeo:', videoSrc, e);
          window.toast && window.toast('Vídeo de transição não encontrado.');
          isPlaying = false;
          window.JC.goNext();
          log('Avançando para próxima seção (vídeo não encontrado)');
        });
    } catch (e) {
      console.error('[VIDEO_TRANSICAO] Erro inesperado:', videoSrc, e);
      window.toast && window.toast('Erro ao reproduzir vídeo de transição.');
      isPlaying = false;
      window.JC.goNext();
      log('Avançando para próxima seção (erro inesperado)');
    }
  };

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('#skipVideo');
    if (btn) {
      const overlay = document.getElementById('videoOverlay');
      const video = document.getElementById('videoTransicao');
      if (overlay && video) {
        log('Vídeo pulado pelo usuário');
        video.pause();
        video.src = '';
        overlay.classList.add('hidden');
        isPlaying = false;
        window.JC.goNext();
        log('Avançando para próxima seção após skip');
      }
    }
  });

  log('jornada-video-transicao.js carregado');
})();
