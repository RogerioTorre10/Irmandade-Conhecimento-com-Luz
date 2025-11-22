// /assets/js/video-transicao.js — PORTAL DOURADO + GLAMOUR + LIMELIGHT
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);

  let isPlaying = false;
  let cleaned = false;

  // ----------------------------- UTILIDADES -----------------------------
  const isMp4 = (src) => /\.mp4(\?|#|$)/i.test(src || '');
  const resolveHref = (src) => {
    try { return new URL(src, window.location.origin).href; }
    catch { return src; }
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
      try { fn(...args); } catch (e) { warn('Erro no safeOnce:', e); }
    };
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      log('Vídeo pulado pelo usuário (Esc)');
      const overlay = document.getElementById('vt-overlay');
      cleanup(overlay);
    }
  }

  // Ajusta moldura à proporção real do vídeo (sem fullscreen nativo)
  function fitFrameToVideo(frame, video){
    const vw = window.innerWidth * 0.96;
    const vh = window.innerHeight * 0.96;

    const ar = (video.videoWidth && video.videoHeight)
      ? (video.videoWidth / video.videoHeight)
      : (16/9);

    let width, height;

    if (vw / ar <= vh) {
      width  = vw;
      height = vw / ar;
    } else {
      height = vh;
      width  = vh * ar;
    }

    frame.style.width  = Math.round(width) + 'px';
    frame.style.height = Math.round(height) + 'px';
  }

  // ---------------------------- LIMPEZA --------------------------------
  function cleanup(overlay) {
    if (cleaned) return;
    cleaned = true;

    try {
      document.removeEventListener('keydown', onKeydown, true);
      window.__TRANSITION_LOCK = false;
      document.dispatchEvent(new CustomEvent('transition:ended'));
      document.documentElement.style.overflow = '';
      if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
    } catch {}

    isPlaying = false;
    log('Overlay removido e estado resetado');
  }

  // -------------------------- PORTAL DOURADO ---------------------------
  function buildPortal() {
    // Overlay escuro
    const overlay = document.createElement('div');
    overlay.id = 'vt-overlay';
    overlay.className = 'jp-video-overlay';
    overlay.setAttribute('role', 'dialog');

    // Moldura dourada
    const frame = document.createElement('div');
    frame.className = 'jp-video-frame';

    // Vídeo do fundo (limelight)
    const ambient = document.createElement('video');
    ambient.className = 'jp-video-ambient';
    ambient.playsInline = true;
    ambient.autoplay = false;
    ambient.controls = false;
    ambient.muted = true;
    ambient.loop = true;
    ambient.preload = 'auto';

    // Vídeo principal (o que o usuário vê)
    const video = document.createElement('video');
    video.id = 'vt-video';
    video.playsInline = true;
    video.autoplay = false;
    video.controls = false;
    video.muted = true;     // autoplay confiável
    video.preload = 'auto';

    // Injeta vídeos dentro da moldura
    frame.appendChild(ambient); // fundo primeiro
    frame.appendChild(video);   // principal por cima

    // Botão “Pular”
    const skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.className = 'jp-video-skip';
    frame.appendChild(skip);

    // Adiciona frame e overlay no body
    overlay.appendChild(frame);
    document.body.appendChild(overlay);

    // Glamour: portal aparece suave
    requestAnimationFrame(() => {
      overlay.classList.add('show');
    });

    return { overlay, frame, video, ambient, skip };
  }

  // ------------------------- PLAYER PRINCIPAL ---------------------------
  function playTransitionVideo(src, nextSectionId) {
    log('Recebido src:', src, 'nextSectionId:', nextSectionId);

    // Se não for MP4 → navega direto
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
    cleaned = false;

    // Glamour: some a página antes do filme
    document.body.classList.remove('vt-fade-in');
    document.body.classList.add('vt-fade-out');

    // 🔒 trava transições e cancela TTS
    window.__TRANSITION_LOCK = true;
    document.dispatchEvent(new CustomEvent('transition:started'));
    try { window.speechSynthesis?.cancel(); } catch {}
    document.documentElement.style.overflow = 'hidden';

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, frame, video, ambient, skip } = buildPortal();

    // Ajuste responsivo do frame ao vídeo (sem fullscreen nativo)
    const onResize = () => fitFrameToVideo(frame, video);
    window.addEventListener('resize', onResize);

    const finishAndGo = safeOnce(() => {
      window.removeEventListener('resize', onResize);
      try { ambient.pause(); } catch {}

      // Glamour: portal sai suave
      overlay.classList.remove('show');
      overlay.classList.add('hide');

      setTimeout(() => {
        cleanup(overlay);
        navigateTo(nextSectionId);

        // Glamour: nova página entra suave
        document.body.classList.remove('vt-fade-out');
        document.body.classList.add('vt-fade-in');
        setTimeout(() => document.body.classList.remove('vt-fade-in'), 650);
      }, 360);
    });

    skip.addEventListener('click', finishAndGo);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finishAndGo();
    });
    document.addEventListener('keydown', onKeydown, true);

    // EVENTOS
    const onCanPlay = safeOnce(() => {
      log('Vídeo carregado, iniciando reprodução:', href);

      // moldura abraça a proporção real
      try { fitFrameToVideo(frame, video); } catch {}

      // toca fundo + principal
      ambient.play().catch(()=>{});
      video.play().catch(err => {
        warn('Falha ao dar play (autoplay?):', err);
        video.muted = true;
        ambient.muted = true;
        ambient.play().catch(()=>{});
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

    // Cache-buster para evitar travas de Range/codec
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

})();
