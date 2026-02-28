// /assets/js/video-transicao.js — PORTAL ARCANUM FULL + LIMELIGHT (FINAL)
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log  = (...a) => console.log(NS, ...a);
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
document.body.classList.remove('vt-playing');
if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
} catch {}

    isPlaying = false;
    log('Overlay removido e estado resetado');
  }

  // -------------------------- PORTAL ARCANUM ---------------------------
  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'vt-overlay';
    overlay.className = 'jp-video-overlay';
    overlay.setAttribute('role', 'dialog');

    const frame = document.createElement('div');
    frame.className = 'jp-video-frame';

    // vídeo principal (miolo)
    const video = document.createElement('video');
    video.id = 'vt-video';
    video.playsInline = true;
    video.autoplay = false;
    video.controls = false;
    video.muted = true;
    video.preload = 'auto';
    video.className = 'jp-video-core';

    // “reflexo” desfocado pra preencher topo/baixo
    const ambient = document.createElement('video');
    ambient.className = 'jp-video-ambient';
    ambient.playsInline = true;
    ambient.autoplay = false;
    ambient.controls = false;
    ambient.muted = true;
    ambient.preload = 'auto';

    // botão pular
    const skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.className = 'jp-video-skip';

    frame.appendChild(ambient);
    frame.appendChild(video);
    frame.appendChild(skip);
   overlay.appendChild(frame);
document.body.appendChild(overlay);

// ===============================
// DIAMANTE: overlay acima de tudo
// ===============================
// DIAMANTE: overlay nunca pode empurrar layout
overlay.style.position = 'fixed';
overlay.style.inset = '0';
overlay.style.width = '100vw';
overlay.style.height = '100vh';
overlay.style.maxWidth = '100vw';
overlay.style.maxHeight = '100vh';
overlay.style.overflow = 'hidden';
overlay.style.zIndex = '2147483647';

document.body.classList.add('vt-playing');

// glamour fade-in do portal
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
    cleaned = false;

    // Glamour: some a página antes do filme
    document.body.classList.remove('vt-fade-in');
    document.body.classList.add('vt-fade-out');

    // 🔒 trava transições e cancela TTS
    window.__TRANSITION_LOCK = true;
    document.dispatchEvent(new CustomEvent('transition:started'));
    try { window.speechSynthesis?.cancel(); } catch {}

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, video, ambient, skip } = buildOverlay();

    // Cache-buster (mesmo src pros dois)
    const finalSrc = href + (href.includes('?') ? '&' : '?') + 't=' + Date.now();
    video.src = finalSrc;
    ambient.src = finalSrc;

    // ---------------- EVENTOS (SÓ 1 onCanPlay!) ----------------
    const onCanPlay = safeOnce(() => {
      log('Vídeo carregado, iniciando reprodução:', finalSrc);

      // limelight: cor do guia no overlay (se já escolhido)
      try {
        const g =
  window.JORNADA_STATE?.guiaSelecionado ||
  window.JORNADA_STATE?.guia ||
  window.JC?.data?.guiaSelecionado ||
  window.JC?.data?.guia ||
  sessionStorage.getItem('JORNADA_GUIA') ||
  localStorage.getItem('JORNADA_GUIA') ||
  localStorage.getItem('jc.guiaSelecionado') ||
  localStorage.getItem('jc.guia') ||
  sessionStorage.getItem('jornada.guia') ||
  localStorage.getItem('guiaEscolhido');

if (g) overlay.setAttribute('data-guia', String(g).toLowerCase());
} catch {}

      // luz viva enquanto toca
      try { window.Luz?.startPulse({ min: 1, max: 1.5, speed: 120 }); } catch {}

      // play core + reflexo
      video.play().catch(err => {
        warn('Falha ao dar play (autoplay?):', err);
        video.muted = true;
        video.play().catch(() => warn('Play ainda bloqueado.'));
      });
      ambient.play().catch(() => {});
    });

    const finishAndGo = safeOnce(() => {
      overlay.classList.remove('show');
      overlay.classList.add('hide');

      setTimeout(() => {
        try { window.Luz?.stopPulse(); } catch {}
        cleanup(overlay);
        navigateTo(nextSectionId);

        // glamour fade-in na página nova
        document.body.classList.remove('vt-fade-out');
        document.body.classList.add('vt-fade-in');
        setTimeout(() => document.body.classList.remove('vt-fade-in'), 650);
      }, 360);
    });

    const onEnded = safeOnce(() => {
      log('Vídeo finalizado:', finalSrc);
      finishAndGo();
    });

    const onError = safeOnce((ev) => {
      warn('Erro ao carregar vídeo:', finalSrc, ev);
      finishAndGo();
    });

    skip.addEventListener('click', finishAndGo);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) finishAndGo();
    });
    document.addEventListener('keydown', onKeydown, true);

    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onCanPlay, { once: true });
    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });

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
