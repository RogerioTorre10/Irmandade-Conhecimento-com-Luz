// /assets/js/video-transicao.js — PORTAL DOURADO + GLAMOUR + LIMELIGHT (corrigido)
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);

  let isPlaying = false;

  // ----------------------------- UTILIDADES -----------------------------
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

  // Ajusta moldura à proporção real do vídeo
  function fitFrameToVideo(frame, video) {
    if (!frame || !video) return;

    const vw = window.innerWidth * 0.96;
    const vh = window.innerHeight * 0.96;

    const w = video.videoWidth || 16;
    const h = video.videoHeight || 9;
    const ar = w / h;

    let width;
    let height;

    if (vw / ar <= vh) {
      width = vw;
      height = vw / ar;
    } else {
      height = vh;
      width = vh * ar;
    }

    frame.style.width = Math.round(width) + 'px';
    frame.style.height = Math.round(height) + 'px';
  }

  // ---------------------------- LIMPEZA --------------------------------
  function cleanup() {
    try {
      const overlay = document.getElementById('vt-overlay');
      const frame = document.getElementById('vt-frame');
      const video = document.getElementById('vt-video');
      const ambient = document.getElementById('vt-ambient');

      try {
        if (video) {
          video.pause();
          video.removeAttribute('src');
          video.load();
        }
      } catch (e) {}

      try {
        if (ambient) {
          ambient.pause();
          ambient.removeAttribute('src');
          ambient.load();
        }
      } catch (e) {}

      try { video?.remove(); } catch (e) {}
      try { ambient?.remove(); } catch (e) {}
      try { frame?.remove(); } catch (e) {}
      try { overlay?.remove(); } catch (e) {}

      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';

      document.removeEventListener('keydown', onKeydown, true);

      window.__TRANSITION_LOCK = false;
      isPlaying = false;

      document.dispatchEvent(new CustomEvent('transition:ended'));
      log('Overlay removido e estado resetado');
    } catch (e) {
      warn('Erro no cleanup:', e);
    }
  }

  // -------------------------- PORTAL DOURADO ---------------------------
  function buildPortal() {
    // Overlay fullscreen real
    const overlay = document.createElement('div');
    overlay.id = 'vt-overlay';
    overlay.className = 'jp-video-overlay';
    overlay.setAttribute('role', 'dialog');

    Object.assign(overlay.style, {
      position: 'fixed',
      inset: '0',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'rgba(0,0,0,0.88)',
      zIndex: '2147483647',
      overflow: 'hidden'
    });

    // Frame central
    const frame = document.createElement('div');
    frame.id = 'vt-frame';
    frame.className = 'jp-video-frame';

    Object.assign(frame.style, {
      position: 'relative',
      display: 'block',
      maxWidth: '96vw',
      maxHeight: '96vh',
      borderRadius: '18px',
      overflow: 'hidden'
    });

    // Vídeo ambiente
    const ambient = document.createElement('video');
    ambient.id = 'vt-ambient';
    ambient.className = 'jp-video-ambient';
    ambient.playsInline = true;
    ambient.autoplay = false;
    ambient.controls = false;
    ambient.muted = true;
    ambient.loop = true;
    ambient.preload = 'auto';

    Object.assign(ambient.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      filter: 'blur(18px) brightness(0.7)',
      transform: 'scale(1.08)',
      opacity: '0.9'
    });

    // Vídeo principal
    const video = document.createElement('video');
    video.id = 'vt-video';
    video.className = 'jp-video-main';
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
      objectFit: 'cover'
    });

    // Botão pular
    const skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.className = 'jp-video-skip';

    Object.assign(skip.style, {
      position: 'absolute',
      top: '14px',
      right: '14px',
      zIndex: '3',
      padding: '8px 14px',
      borderRadius: '999px',
      border: '0',
      cursor: 'pointer'
    });

    frame.appendChild(ambient);
    frame.appendChild(video);
    frame.appendChild(skip);

    overlay.appendChild(frame);
    document.documentElement.appendChild(overlay);

    requestAnimationFrame(() => overlay.classList.add('show'));

    return { overlay, frame, video, ambient, skip };
  }

  // ------------------------- PLAYER PRINCIPAL ---------------------------
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

    document.body.classList.remove('vt-fade-in');
    document.body.classList.add('vt-fade-out');

    window.__TRANSITION_LOCK = true;
    document.dispatchEvent(new CustomEvent('transition:started'));

    try {
      window.speechSynthesis?.cancel();
    } catch {}

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, frame, video, ambient, skip } = buildPortal();

    fitFrameToVideo(frame, { videoWidth: 16, videoHeight: 9 });

    const onResize = () => fitFrameToVideo(frame, video);
    window.addEventListener('resize', onResize);

    const finishAndGo = safeOnce(() => {
      window.removeEventListener('resize', onResize);

      try { ambient.pause(); } catch {}

      overlay.classList.remove('show');
      overlay.classList.add('hide');
   
     setTimeout(() => {
     navigateTo(nextSectionId);
     requestAnimationFrame(() => {
     cleanup();
     document.body.classList.remove('vt-fade-out');
     document.body.classList.add('vt-fade-in');
     setTimeout(() => document.body.classList.remove('vt-fade-in'), 650);
     });
    }, 360);
   });

    skip.addEventListener('click', finishAndGo);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finishAndGo();
    });

    document.addEventListener('keydown', onKeydown, true);

    const onCanPlay = safeOnce(() => {
      log('Vídeo carregado, iniciando reprodução:', href);

      try {
        fitFrameToVideo(frame, video);
      } catch {}

      ambient.play().catch(() => {});

      video.play().catch((err) => {
        warn('Falha ao dar play (autoplay?):', err);
        video.muted = true;
        ambient.muted = true;
        ambient.play().catch(() => {});
        video.play().catch(() => warn('Play ainda bloqueado.'));
      });
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
  }
 
  // ----------------- API PÚBLICA -----------------
  window.playTransitionVideo = playTransitionVideo;

  window.playTransition = function (nextSectionId) {
    log('Transição simples (sem vídeo) para:', nextSectionId);
    navigateTo(nextSectionId);
  };

  /* ======================================================================================
   * Runner global para transição ENTRE BLOCOS
   * ====================================================================================== */
  (function ensurePlayBlockTransition() {
    if (typeof window.playBlockTransition === 'function') return;

    if (typeof window.playTransitionVideo !== 'function') {
      console.warn('[VIDEO_TRANSICAO] playTransitionVideo não disponível; playBlockTransition não instalado.');
      window.playBlockTransition = function (_videoSrc, done) {
        if (typeof done === 'function') done();
      };
      return;
    }

    const install = function () {
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
          console.warn('[VIDEO_TRANSICAO] Falha ao iniciar playTransitionVideo:', e);
          finish();
        }

        setTimeout(() => {
          document.removeEventListener('transition:ended', onEnded, true);
          finish();
        }, 12000);
      };

      console.log('[VIDEO_TRANSICAO] playBlockTransition instalado (runner de blocos).');
    };

    try {
      Object.defineProperty(window, 'playBlockTransition', {
        value: undefined,
        writable: true,
        configurable: true,
        enumerable: true
      });
      install();
    } catch (_) {
      try {
        install();
      } catch (e2) {
        console.warn('[VIDEO_TRANSICAO] Não foi possível instalar playBlockTransition:', e2);
        window.playBlockTransition = function (_videoSrc, done) {
          if (typeof done === 'function') done();
        };
      }
    }
  })();

})();
