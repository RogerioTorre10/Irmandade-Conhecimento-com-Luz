// /assets/js/video-transicao.js — PORTAL DOURADO + AMBIENT BLUR FULLSCREEN BLINDADO
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);

  let isPlaying = false;

  const isMp4 = (src) => /\.mp4(\?|#|$)/i.test(src || '');

  const resolveHref = (src) => {
    try {
      return new URL(src, window.location.origin).href;
    } catch {
      return src;
    }
  };

  function navigateTo(nextSectionId) {
    if (!nextSectionId) return;
    log('Transição concluída, navegando para:', nextSectionId);

    if (window.JC?.show) {
      window.JC.show(nextSectionId);
    } else if (typeof window.showSection === 'function') {
      window.showSection(nextSectionId);
    } else {
      window.location.hash = `#${nextSectionId}`;
    }
  }

  function safeOnce(fn) {
    let done = false;
    return (...args) => {
      if (done) return;
      done = true;
      try {
        fn(...args);
      } catch (e) {
        warn('Erro no safeOnce:', e);
      }
    };
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      log('Vídeo pulado pelo usuário (Esc)');
      cleanup();
    }
  }

  function fitFrameToVideo(frame, video) {
  if (!frame) return;

  const isMobile = window.innerWidth < 768;
  const maxVW = window.innerWidth * (isMobile ? 0.98 : 0.94);
  const maxVH = window.innerHeight * (isMobile ? 0.58 : 0.72);

  const w = (video && video.videoWidth) ? video.videoWidth : 16;
  const h = (video && video.videoHeight) ? video.videoHeight : 9;
  const ar = w / h;

  let width = maxVW;
  let height = width / ar;

  if (height > maxVH) {
    height = maxVH;
    width = height * ar;
  }

  frame.style.width = `${Math.max(220, Math.round(width))}px`;
  frame.style.height = `${Math.max(140, Math.round(height))}px`;
  frame.style.maxWidth = isMobile ? '98vw' : '94vw';
  frame.style.maxHeight = isMobile ? '58vh' : '72vh';
  frame.style.display = 'block';
  frame.style.visibility = 'visible';
  frame.style.opacity = '1';
}

  function cleanup() {
    try {
      const overlay = document.getElementById('vt-overlay');
      const frame = document.getElementById('vt-frame');
      const video = document.getElementById('vt-video');
      const ambient = document.getElementById('vt-ambient');
      const veil = document.getElementById('vt-veil');

      try {
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
      } catch (_) {}

      try {
        if (ambient) {
          ambient.pause();
          ambient.removeAttribute('src');
          ambient.load();
        }
      } catch (_) {}

      try { video?.remove(); } catch (_) {}
      try { ambient?.remove(); } catch (_) {}
      try { veil?.remove(); } catch (_) {}
      try { frame?.remove(); } catch (_) {}
      try { overlay?.remove(); } catch (_) {}

      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      document.removeEventListener('keydown', onKeydown, true);

      window.__TRANSITION_LOCK = false;
      window.JORNADA_TRANSICAO_ATIVA = false;
      isPlaying = false;

      document.dispatchEvent(new CustomEvent('transition:ended'));
      window.dispatchEvent(new CustomEvent('jornada:transicao:end'));

      log('Overlay removido e estado resetado');
    } catch (e) {
      warn('Erro no cleanup:', e);
    }
  }

  function buildPortal() {
  document.getElementById('videoOverlay')?.remove();
  document.getElementById('global-video-overlay')?.remove();
  document.getElementById('vt-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'vt-overlay';
  overlay.className = 'vt-video-overlay';
  overlay.setAttribute('role', 'dialog');

  Object.assign(overlay.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0,0,0,0.35)',
    zIndex: '2147483647',
    overflow: 'hidden',
    opacity: '1',
    transition: 'opacity 600ms ease'
  });

  const ambient = document.createElement('video');
  ambient.id = 'vt-ambient';
  ambient.className = 'vt-video-ambient';
  ambient.playsInline = true;
  ambient.autoplay = false;
  ambient.controls = false;
  ambient.muted = true;
  ambient.loop = true;
  ambient.preload = 'auto';

  Object.assign(ambient.style, {
    position: 'fixed',
    inset: '0',
    width: '100vw',
    height: '100vh',
    objectFit: 'cover',
    filter: 'blur(30px) brightness(0.78) saturate(1.28)',
    transform: 'scale(1.22)',
    opacity: '1',
    zIndex: '1',
    pointerEvents: 'none'
  });

  // primeiro cria o frame
const frame = document.createElement('div');
frame.id = 'vt-frame';
frame.className = 'vt-video-frame';

// AGORA sim calcula as dimensões (depois do frame existir)
const _isMobile = window.innerWidth < 768;
const _vw = window.innerWidth * (_isMobile ? 0.96 : 0.94);
const _maxH = window.innerHeight * (_isMobile ? 0.70 : 0.72);
const _ar = 16 / 9;
let _fw = _vw;
let _fh = _fw / _ar;
if (_fh > _maxH) { _fh = _maxH; _fw = _fh * _ar; }

Object.assign(frame.style, {
  position: 'relative',
  display: 'block',
  width: `${Math.round(_fw)}px`,
  height: `${Math.round(_fh)}px`,
  maxWidth: _isMobile ? '96vw' : '94vw',
  maxHeight: _isMobile ? '70vh' : '72vh',
  borderRadius: '18px',
  overflow: 'hidden',
  background: 'rgba(0,0,0,0.45)',
  boxShadow: '0 0 0 2px rgba(212,175,55,.82), 0 0 42px rgba(212,175,55,.45)',
  zIndex: '5'
});

  const video = document.createElement('video');
  video.id = 'vt-video';
  video.className = 'vt-video-main';
  video.playsInline = true;
  video.autoplay = false;
  video.controls = false;
  video.muted = true;
  video.preload = 'auto';

  Object.assign(video.style, {
    position: 'absolute',
    inset: '0',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    background: 'transparent',
    zIndex: '6'
  });

  const skip = document.createElement('button');
  skip.id = 'vt-skip';
  skip.textContent = 'Pular';
  skip.setAttribute('aria-label', 'Pular vídeo');
  skip.className = 'vt-video-skip';

  Object.assign(skip.style, {
    position: 'absolute',
    top: '14px',
    right: '14px',
    zIndex: '10',
    padding: '8px 14px',
    borderRadius: '999px',
    border: '1px solid rgba(255,215,0,0.85)',
    background: 'rgba(0,0,0,0.72)',
    color: '#ffd700',
    cursor: 'pointer',
    boxShadow: '0 0 14px rgba(255,215,0,0.32)'
  });

  frame.appendChild(video);
  frame.appendChild(skip);

  overlay.appendChild(ambient);
  overlay.appendChild(frame);

  document.body.appendChild(overlay);

  requestAnimationFrame(() => overlay.classList.add('show'));

  return { overlay, frame, video, ambient, skip };
}

  function playTransitionVideo(src, nextSectionId) {
    log('Recebido src:', src, 'nextSectionId:', nextSectionId);

    if (!src || !isMp4(src)) {
      warn('Fonte não é MP4 (ou ausente). Pulando player e navegando direto…');
      navigateTo(nextSectionId);
      return;
    }

    if (isPlaying) {
      log('Já reproduzindo vídeo, ignorando chamada duplicada…');
      return;
    }

    isPlaying = true;
    window.JORNADA_TRANSICAO_ATIVA = true;  
    
    document.body.classList.remove('vt-fade-in');
    document.body.classList.add('vt-fade-out');

    try { window.speechSynthesis?.cancel(); } catch {}

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, frame, video, ambient, skip } = buildPortal();

    fitFrameToVideo(frame, { videoWidth: 16, videoHeight: 9 });

    const onResize = () => fitFrameToVideo(frame, video);
    window.addEventListener('resize', onResize);

    const finishAndGo = safeOnce(() => {
      window.removeEventListener('resize', onResize);

      try { ambient.pause(); } catch (_) {}

      setTimeout(() => {
        navigateTo(nextSectionId);

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            overlay.classList.remove('show');
            overlay.classList.add('hide');
            overlay.style.opacity = '0';
          });
        });
     }, 80);

    skip.addEventListener('click', finishAndGo);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finishAndGo();
    });

    document.addEventListener('keydown', onKeydown, true);

    const waitMediaReady = (media, timeout = 1800) => {
      return new Promise((resolve) => {
       if (!media) return resolve();

       if (media.readyState >= 2) return resolve();

       let done = false;

       const finish = () => {
         if (done) return;
         done = true;
         media.removeEventListener('loadedmetadata', finish);
         media.removeEventListener('canplay', finish);
         resolve();
       };

       media.addEventListener('loadedmetadata', finish, { once: true });
       media.addEventListener('canplay', finish, { once: true });

       try { media.load(); } catch (_) {}

       setTimeout(finish, timeout);
     });
    };

    const resetMedia = async (media) => {
       if (!media) return;

       try { media.pause(); } catch (_) {}

       try {
         media.currentTime = 0;
       } catch (_) {}

       await waitMediaReady(media);

       try {
         media.currentTime = 0;
       } catch (_) {}
    };

    const tryPlayBoth = async () => {
       await resetMedia(ambient);
       await resetMedia(video);

       try {
         await ambient.play();
         log('Ambient tocando.');
       } catch (err) {
         warn('Falha ao tocar ambient:', err?.message || err);
       }

       try {
         await video.play();
         log('Vídeo principal tocando.');
       } catch (err) {
         warn('Falha ao tocar vídeo principal:', err?.message || err);

         video.muted = true;
         ambient.muted = true;

       try { await ambient.play(); } catch (_) {}
       try { await video.play(); } catch (_) {}
      }
    };

    const onCanPlay = safeOnce(() => {
      log('Vídeo carregado, iniciando reprodução:', href);
      try { fitFrameToVideo(frame, video); } catch (_) {}
      tryPlayBoth();
    });

    const onEnded = safeOnce(() => {
      log('Vídeo finalizado:', href);
      finishAndGo();
    });

    const onError = safeOnce((ev) => {
      warn('Erro ao carregar vídeo:', href, ev);
      finishAndGo();
    });

    video.addEventListener('loadedmetadata', () => fitFrameToVideo(frame, video), { once: true });
    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onCanPlay, { once: true });
    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });

    const finalSrc = href + (href.includes('?') ? '&' : '?') + 't=' + Date.now();

    video.src = finalSrc;
    ambient.src = finalSrc;

    video.load();
    ambient.load();

    setTimeout(() => {
      if (!video.paused) return;
      warn('Fallback play acionado.');
      tryPlayBoth();
    }, 800);

    setTimeout(() => {
      if (isPlaying) {
        warn('Timeout de segurança da transição.');
        finishAndGo();
      }
    }, 18000);
  }

  window.playTransitionVideo = playTransitionVideo;

  window.playTransition = function (nextSectionId) {
    log('Transição simples (sem vídeo) para:', nextSectionId);
    navigateTo(nextSectionId);
  };

  (function ensurePlayBlockTransition() {
    if (typeof window.playBlockTransition === 'function') return;

    if (typeof window.playTransitionVideo !== 'function') {
      warn('playTransitionVideo não disponível; playBlockTransition não instalado.');
      window.playBlockTransition = function (_videoSrc, done) {
        if (typeof done === 'function') done();
      };
      return;
    }

    window.playBlockTransition = function (videoSrc, done) {
      let called = false;

      const finish = () => {
        if (called) return;
        called = true;
        if (typeof done === 'function') done();
      };

      const onEnded = () => {
        document.removeEventListener('transition:ended', onEnded, true);
        finish();
      };

      document.addEventListener('transition:ended', onEnded, true);

      try {
        window.playTransitionVideo(videoSrc, null);
      } catch (e) {
        document.removeEventListener('transition:ended', onEnded, true);
        warn('Falha ao iniciar playTransitionVideo:', e);
        finish();
      }

      setTimeout(() => {
        document.removeEventListener('transition:ended', onEnded, true);
        finish();
      }, 19000);
    };

    log('playBlockTransition instalado (runner de blocos).');
  })();
})();
