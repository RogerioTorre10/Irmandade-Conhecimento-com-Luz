// /assets/js/video-transicao.js — PORTAL DOURADO + GLAMOUR + LIMELIGHT (versão final cinematográfica)
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log  = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);

  let isPlaying = false;
  let cleaned   = false;

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
  function fitFrameToVideo(frame, video) {
    const vw = window.innerWidth  * 0.96;
    const vh = window.innerHeight * 0.96;

    // fallback inicial (16:9) se metadata ainda não carregou
    const w = video.videoWidth  || 16;
    const h = video.videoHeight ||  9;

    const ar = w / h;

    let width, height;
    if (vw / ar <= vh) {
      width  = vw;
      height = vw / ar;
    } else {
      height = vh;
      width  = vh * ar;
    }

    frame.style.width  = Math.round(width)  + 'px';
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
  // Overlay escuro (FULLSCREEN de verdade, independente de CSS externo)
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
    zIndex: '2147483647',        // acima de tudo
    overflow: 'hidden'
  });

  // Moldura dourada (container central)
  const frame = document.createElement('div');
  frame.className = 'jp-video-frame';

  Object.assign(frame.style, {
    position: 'relative',
    display: 'block',
    maxWidth: '96vw',
    maxHeight: '96vh',
    borderRadius: '18px',
    overflow: 'hidden'
  });

  // Vídeo ambiente (limelight)
  const ambient = document.createElement('video');
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

  frame.appendChild(ambient);
  frame.appendChild(video);

  // Botão “Pular”
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

  frame.appendChild(skip);

  // Anexa no body por último (garante que fica acima)
  overlay.appendChild(frame);
  document.documentElement.appendChild(overlay);
  
  // Glamour: portal aparece suave (mantém seu CSS se existir)
  requestAnimationFrame(() => overlay.classList.add('show'));

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

    // fallback imediato para evitar "barra dourada"
    fitFrameToVideo(frame, { videoWidth: 16, videoHeight: 9 });

    // Ajuste responsivo do frame ao vídeo
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

      // moldura abraça proporção real
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
