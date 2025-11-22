// /assets/js/video-transicao.js — PORTAL DOURADO (versão unificada)
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
  /**
   * Cria o overlay + frame dourado + vídeo
   */
  function buildPortal() {
    // Overlay escuro
    const overlay = document.createElement('div');
    overlay.id = 'vt-overlay';
    overlay.className = 'jp-video-overlay'; // CSS do portal dourado
    overlay.setAttribute('role', 'dialog');

    // Moldura dourada
    const frame = document.createElement('div');
    frame.className = 'jp-video-frame'; // CSS com borda dourada

    // Vídeo
    const video = document.createElement('video');
    video.id = 'vt-video';
    video.playsInline = true;
    video.autoplay = false;
    video.controls = false;
    video.muted = true;
    video.preload = 'auto';

    // Inject vídeo dentro da moldura
    frame.appendChild(video);

    // Botão “Pular”
    const skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.className = 'jp-video-skip'; // classe que cria estilo bonito via CSS
    frame.appendChild(skip);

    overlay.appendChild(frame);
    document.body.appendChild(overlay);

    document.documentElement.style.overflow = 'hidden';

    return { overlay, frame, video, skip };
  }

  // ------------------------- PLAYER PRINCIPAL ---------------------------
  /**
   * Reproduz um vídeo MP4 usando o portal dourado.
   */
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
    cleaned = false;

    // 🔒 trava transições e cancela TTS
    window.__TRANSITION_LOCK = true;
    document.dispatchEvent(new CustomEvent('transition:started'));

    try { window.speechSynthesis?.cancel(); } catch {}
    document.documentElement.style.overflow = 'hidden';

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, video, skip } = buildPortal();

    const finishAndGo = safeOnce(() => {
      cleanup(overlay);
      navigateTo(nextSectionId);
    });

    skip.addEventListener('click', finishAndGo);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finishAndGo();
    });

    document.addEventListener('keydown', onKeydown, true);

    // EVENTOS
    const onCanPlay = safeOnce(() => {
      log('Vídeo carregado, iniciando reprodução:', href);
      video.play().catch(err => {
        warn('Falha ao dar play (autoplay?):', err);
        video.muted = true;
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

    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onCanPlay, { once: true });
    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Cache-buster para evitar travas de Range/codec
    video.src = href + (href.includes('?') ? '&' : '?') + 't=' + Date.now();
    video.load();
  }

  // ----------------- API PÚBLICA -----------------
  window.playTransitionVideo = playTransitionVideo;

  window.playTransition = function (nextSectionId) {
    log('Transição simples (sem vídeo) para:', nextSectionId);
    navigateTo(nextSectionId);
  };
})();
