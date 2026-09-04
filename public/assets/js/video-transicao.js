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
      
      window.__TRANSITION_LOCK = false;
      window.JORNADA_TRANSICAO_ATIVA = false;
      document.body.classList.remove('is-transitioning');
      document.body.classList.remove('transition-playing');
      
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

  const frame = document.createElement('div');
  frame.id = 'vt-frame';
  frame.className = 'vt-video-frame';

  Object.assign(frame.style, {
    position: 'relative',
    display: 'block',
    width: 'min(96vw, 1280px)',
    height: 'min(82vh, 720px)',
    maxWidth: '96vw',
    maxHeight: '82vh',
    borderRadius: '18px',
    overflow: 'hidden',
    background: 'rgba(0,0,0,0.45)',
    boxShadow:
      '0 0 0 2px rgba(212,175,55,.82), 0 0 42px rgba(212,175,55,.45)',
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

    window.__TRANSITION_LOCK = true;
    window.JORNADA_TRANSICAO_ATIVA = true;

    document.body.classList.add('is-transitioning');
    document.body.classList.add('transition-playing');
    document.body.classList.remove('vt-fade-in');
    document.body.classList.add('vt-fade-out');

    try { window.speechSynthesis?.cancel(); } catch {}

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, frame, video, ambient, skip } = buildPortal();

    overlay.style.opacity = '1';
    overlay.style.visibility = 'visible';
    overlay.style.pointerEvents = 'auto';
    
    fitFrameToVideo(frame, { videoWidth: 16, videoHeight: 9 });

    const onResize = () => fitFrameToVideo(frame, video);
    window.addEventListener('resize', onResize);

    const finishAndGo = safeOnce(() => {
      window.removeEventListener('resize', onResize);

      try { ambient.pause(); } catch (_) {}

      overlay.classList.remove('show');
      overlay.classList.add('hide');
      overlay.style.opacity = '0';

      setTimeout(() => {
        cleanup();

        document.body.classList.remove('vt-fade-out');
        document.body.classList.add('vt-fade-in');

        setTimeout(() => {
          navigateTo(nextSectionId);
        }, 180);

        setTimeout(() => {
          document.body.classList.remove('vt-fade-in');
        }, 650);
      }, 900);
    });
                                 
    skip.addEventListener('click', () => finishAndGo());

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finishAndGo();
    });
    
    let playStarted = false;
    let playAttemptInFlight = false;
    let playbackSafetyTimer = null;
    let loadSafetyTimer = null;

    const clearTransitionTimers = () => {
      if (playbackSafetyTimer) {
        clearTimeout(playbackSafetyTimer);
        playbackSafetyTimer = null;
      }
      if (loadSafetyTimer) {
        clearTimeout(loadSafetyTimer);
        loadSafetyTimer = null;
      }
    };

    const finishSafely = () => {
      clearTransitionTimers();
      finishAndGo();
    };

    // O relógio de segurança da exibição só nasce DEPOIS que o vídeo
    // realmente entrou em reprodução. Assim, tempo de rede/buffer não
    // consome o tempo visual da transição.
    const armPlaybackSafety = () => {
      if (playbackSafetyTimer) clearTimeout(playbackSafetyTimer);

      const durationMs = Number.isFinite(video.duration) && video.duration > 0
        ? Math.ceil(video.duration * 1000)
        : 10000;

      playbackSafetyTimer = setTimeout(() => {
        if (!isPlaying) return;
        warn('Timeout de segurança APÓS início real da reprodução.');
        finishSafely();
      }, durationMs + 5000);
    };

    const tryPlayBoth = async () => {
      if (playStarted || playAttemptInFlight) return;
      if (!document.body.contains(video)) return;

      playAttemptInFlight = true;

      try {
        // Não usamos pause() aqui: um pause durante uma Promise de play()
        // pendente é justamente o que produz "play() interrupted by pause()".
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
          playAttemptInFlight = false;
          return;
        }

        // Reinício absoluto antes do ÚNICO play válido.
        if (Math.abs(video.currentTime) > 0.05) {
          video.currentTime = 0;
        }

        overlay.classList.remove('hide');
        overlay.classList.add('show');
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';

        await new Promise(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(resolve));
        });

        if (!document.body.contains(video)) {
          playAttemptInFlight = false;
          return;
        }

        await video.play();

        // Só consideramos iniciado depois que play() realmente resolveu.
        playStarted = true;
        playAttemptInFlight = false;
        clearTimeout(loadSafetyTimer);
        loadSafetyTimer = null;

        // Ambient é apenas decorativo. Tenta acompanhar sem interferir no
        // vídeo principal; qualquer falha dele é ignorada.
        try {
          // O ambient nunca pode aparecer antes de estar sincronizado
          ambient.style.opacity = '0';
        
          if (ambient.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            ambient.currentTime = video.currentTime || 0;
        
            await ambient.play();
        
            // Só revela o blur depois que ambos já estão rodando juntos
            ambient.currentTime = video.currentTime || 0;
            ambient.style.opacity = '1';
          }
        } catch (_) {
          // Se o ambient falhar, preserva o vídeo principal normalmente.
          ambient.style.opacity = '0';
        }

        log(
          'Vídeo principal iniciado REALMENTE.',
          'currentTime=', video.currentTime,
          'duration=', video.duration,
          'readyState=', video.readyState
        );

        armPlaybackSafety();
      } catch (err) {
        playAttemptInFlight = false;
        playStarted = false;
        warn('Falha ao tocar vídeo principal:', err?.message || err);
      }
    };

    // loadeddata garante que já existe um frame real disponível.
    const onLoadedData = () => {
      try { fitFrameToVideo(frame, video); } catch (_) {}
      tryPlayBoth();
    };

    // canplay funciona como segunda porta de entrada, sem duplicar play().
    const onCanPlay = () => {
      log('Vídeo carregado e pronto:', href);
      try { fitFrameToVideo(frame, video); } catch (_) {}
      tryPlayBoth();
    };

    const onPlaying = () => {
      // Defesa extra contra navegadores que resolvem play() antes de o
      // primeiro frame avançar visualmente.
      if (!playStarted) {
        playStarted = true;
        playAttemptInFlight = false;
      }
      if (!playbackSafetyTimer) armPlaybackSafety();
      log('Evento playing confirmado em', video.currentTime);
    };

    const onWaiting = () => {
      log('Buffering detectado em', video.currentTime);
    };

    const onEnded = safeOnce(() => {
      log('Vídeo finalizado:', href);
      finishSafely();
    });

    const onError = safeOnce((ev) => {
      warn('Erro ao carregar vídeo:', href, ev);
      finishSafely();
    });

    video.addEventListener('loadedmetadata', () => {
      try {
        video.currentTime = 0;
        fitFrameToVideo(frame, video);
      } catch (_) {}
    }, { once: true });

    video.addEventListener('loadeddata', onLoadedData, { once: true });
    video.addEventListener('canplay', onCanPlay, { once: true });
    video.addEventListener('playing', onPlaying);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Cache-busting mantido, mas ambos recebem exatamente a mesma URL.
    const finalSrc = href + (href.includes('?') ? '&' : '?') + 't=' + Date.now();

    video.src = finalSrc;
    ambient.src = finalSrc;

    // Um único load por elemento.
    video.load();
    ambient.load();

    // Fallback de CARREGAMENTO, não de duração. Ele não encerra a
    // transição aos 18 s nem reinicia currentTime enquanto um play() existe.
    // Apenas tenta iniciar novamente caso eventos de mídia tenham sido
    // perdidos pelo navegador.
    loadSafetyTimer = setTimeout(() => {
      if (!isPlaying || playStarted || playAttemptInFlight) return;
      if (!document.body.contains(video)) return;

      warn('Fallback de carregamento acionado; tentando iniciar sem reset concorrente.');
      tryPlayBoth();
    }, 2500);

    // Última proteção contra arquivo/rede realmente travados ANTES do play.
    // Diferente do antigo timeout de 18 s, esta proteção só trata falha de
    // carregamento e não simula que o filme terminou normalmente.
    setTimeout(() => {
      if (!isPlaying || playStarted) return;
      warn('Vídeo não conseguiu iniciar após 20 s; liberando a jornada por segurança.');
      finishSafely();
    }, 20000);
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
      }, 40000);
    };

    log('playBlockTransition instalado (runner de blocos).');
  })();
})();
