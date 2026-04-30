// /assets/js/video-transicao.js — PORTAL ARCANUM FULL + LIMELIGHT (FINAL)
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log  = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);

  let isPlaying = false;
  let cleaned = false;
// trava scroll do ROOT durante a transição (evita “vazar” e evita pulo)
let prevScroll = null;

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
// restaura travas de scroll (se houver)
if (prevScroll) {
  document.body.style.position = prevScroll.bodyPosition || '';
  document.body.style.top = prevScroll.bodyTop || '';
  document.body.style.width = prevScroll.bodyWidth || '';
  document.body.style.height = prevScroll.bodyHeight || '';
  document.body.style.overflow = prevScroll.bodyOverflow || '';

  document.documentElement.style.overflow = prevScroll.htmlOverflow || '';
  document.documentElement.style.height = prevScroll.htmlHeight || '';

  // volta para o scroll exato
  window.scrollTo(0, prevScroll.scrollY || 0);
  prevScroll = null;
} else {
  document.documentElement.style.overflow = '';
}
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
    // força fullscreen real (blindagem contra CSS externo)
const S = (el, prop, val) => el.style.setProperty(prop, val, 'important');

S(overlay, 'position', 'fixed');
S(overlay, 'inset', '0');
S(overlay, 'width', '100vw');
S(overlay, 'height', '100vh');
S(overlay, 'z-index', '2147483647');
S(overlay, 'background', '#000');
S(overlay, 'pointer-events', 'auto');

S(frame, 'position', 'absolute');
S(frame, 'inset', '0');
S(frame, 'width', '100%');
S(frame, 'height', '100%');

S(video, 'position', 'absolute');
S(video, 'inset', '0');
S(video, 'width', '100%');
S(video, 'height', '100%');
S(video, 'object-fit', 'cover');
S(video, 'object-position', 'center');

S(ambient, 'position', 'absolute');
S(ambient, 'inset', '0');
S(ambient, 'width', '100%');
S(ambient, 'height', '100%');
S(ambient, 'object-fit', 'cover');
S(ambient, 'object-position', 'center');

    const skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.className = 'jp-video-skip';

    frame.appendChild(ambient);
    frame.appendChild(video);
    frame.appendChild(skip);
    overlay.appendChild(frame);
    document.body.appendChild(overlay);

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

// trava scroll do ROOT (evita “vazar” e evita pulo)
const scrollY = window.scrollY || window.pageYOffset || 0;
prevScroll = {
  scrollY,
  htmlOverflow: document.documentElement.style.overflow,
  htmlHeight: document.documentElement.style.height,
  bodyOverflow: document.body.style.overflow,
  bodyPosition: document.body.style.position,
  bodyTop: document.body.style.top,
  bodyWidth: document.body.style.width,
  bodyHeight: document.body.style.height
};

document.documentElement.style.overflow = 'hidden';
document.documentElement.style.height = '100%';

document.body.style.overflow = 'hidden';
document.body.style.position = 'fixed';
document.body.style.top = `-${scrollY}px`;
document.body.style.width = '100%';
document.body.style.height = '100%';
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
          window.JC?.state?.guia ||
          window.selectedGuide ||
          localStorage.getItem('guiaEscolhido');
        if (g) overlay.setAttribute('data-guia', g);
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
