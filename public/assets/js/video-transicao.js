(function() {
  'use strict';

  const log = (...args) => console.log('[VIDEO_TRANSICAO]', ...args);
  let isPlaying = false;

window.playTransitionVideo = function(videoSrc = '/assets/videos/conhecimento-com-luz-jardim.mp4', nextSection) {
  if (isPlaying) {
    log('Já está reproduzindo um vídeo, ignorando:', videoSrc);
    return;
  }
  isPlaying = true;

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

  log('Tentando reproduzir:', videoSrc);

  try {
    fetch(videoSrc, { method: 'HEAD' })
      .then(response => {
        if (!response.ok) throw new Error('Vídeo não encontrado');
        video.src = videoSrc;
        video.onended = () => {
          log('Vídeo finalizado:', videoSrc);
          overlay.classList.add('hidden');
          overlay.style.display = 'none';
          video.src = '';
          isPlaying = false;
          if (nextSection && typeof window.JC?.show === 'function') {
            window.JC.show(nextSection);
          } else {
            window.JC.goNext();
          }
          log('Avançando para próxima seção após vídeo');
        };
        video.onerror = (e) => {
          console.error('[VIDEO_TRANSICAO] Erro ao carregar vídeo:', videoSrc, e);
          fallback.classList.remove('hidden');
          video.classList.add('hidden');
          window.toast && window.toast('Erro ao carregar vídeo de transição. Usando fallback.');
          setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            fallback.classList.add('hidden');
            video.classList.remove('hidden');
            isPlaying = false;
            if (nextSection && typeof window.JC?.show === 'function') {
              window.JC.show(nextSection);
            } else {
              window.JC.goNext();
            }
            log('Avançando para próxima seção após erro');
          }, 8000);
        };
        overlay.classList.remove('hidden');
        overlay.style.display = 'block';
        video.play().catch(e => {
          console.error('[VIDEO_TRANSICAO] Erro ao iniciar reprodução:', videoSrc, e);
          fallback.classList.remove('hidden');
          video.classList.add('hidden');
          window.toast && window.toast('Erro ao reproduzir vídeo de transição. Usando fallback.');
          setTimeout(() => {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
            fallback.classList.add('hidden');
            video.classList.remove('hidden');
            isPlaying = false;
            if (nextSection && typeof window.JC?.show === 'function') {
              window.JC.show(nextSection);
            } else {
              window.JC.goNext();
            }
            log('Avançando para próxima seção após erro de reprodução');
          }, 8000);
        });
        log('Iniciando reprodução:', videoSrc);
      })
      .catch(e => {
        console.error('[VIDEO_TRANSICAO] Erro ao verificar vídeo:', videoSrc, e);
        window.toast && window.toast('Vídeo de transição não encontrado.');
        isPlaying = false;
        if (nextSection && typeof window.JC?.show === 'function') {
          window.JC.show(nextSection);
        } else {
          window.JC.goNext();
        }
        log('Avançando para próxima seção (vídeo não encontrado)');
      });
  } catch (e) {
    console.error('[VIDEO_TRANSICAO] Erro inesperado:', videoSrc, e);
    window.toast && window.toast('Erro ao reproduzir vídeo de transição.');
    isPlaying = false;
    if (nextSection && typeof window.JC?.show === 'function') {
      window.JC.show(nextSection);
    } else {
      window.JC.goNext();
    }
    log('Avançando para próxima seção (erro inesperado)');
  }
};

  document.addEventListener('click', (e) => {
  const btn = e.target.closest('#skipVideo');
  if (btn && !btn.dataset.clicked) {
    btn.dataset.clicked = 'true';
    const overlay = document.getElementById('videoOverlay');
    const video = document.getElementById('videoTransicao');
    if (overlay && video) {
      log('Vídeo pulado pelo usuário');
      video.pause();
      video.src = '';
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
      isPlaying = false;
      window.JC.goNext();
      log('Avançando para próxima seção após skip');
      setTimeout(() => delete btn.dataset.clicked, 1000); // Reativar após 1s
    }
  }
});
  log('jornada-video-transicao.js carregado');
})();
