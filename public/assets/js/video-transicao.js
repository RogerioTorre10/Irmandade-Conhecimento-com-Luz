/* =========================================================
   VIDEO TRANSIÇÃO — robusto, fullscreen real, sem “placa preta”
   ========================================================= */
(function () {
  const OVERLAY_ID = 'videoOverlay';
  const VIDEO_ID = 'videoTransicao';

  const log = (...a) => console.log('[VIDEO_TRANSICAO]', ...a);

  function ensureVideoOverlay() {
    let overlay = document.getElementById(OVERLAY_ID);
    let video = document.getElementById(VIDEO_ID);

    if (!overlay || !video) {
      overlay = document.createElement('div');
      overlay.id = OVERLAY_ID;
      overlay.className = 'video-overlay';
      overlay.setAttribute('aria-hidden', 'true');

      video = document.createElement('video');
      video.id = VIDEO_ID;
      video.setAttribute('playsinline', '');
      video.preload = 'auto';

      overlay.appendChild(video);
      document.body.appendChild(overlay);
    }

    // garante que está no body (evita ficar preso em containers)
    if (overlay.parentElement !== document.body) document.body.appendChild(overlay);

    return { overlay, video };
  }

  function resolveVideoSrc(src) {
    if (!src) return '';
    // já é URL absoluta
    if (/^https?:\/\//i.test(src)) return src;
    // já é caminho absoluto do site
    if (src.startsWith('/')) return src;
    // fallback: assume pasta padrão
    return '/assets/videos/' + src.replace(/^\.?\//, '');
  }

  // helper: aplica CSS com IMPORTANT real
  const S = (el, prop, val) => el.style.setProperty(prop, val, 'important');

  function playVideoWithCallback(src, onEnded) {
    src = resolveVideoSrc(src);
    if (!src) { if (typeof onEnded === 'function') onEnded(); return; }

    const { overlay, video } = ensureVideoOverlay();

    // estado anterior (para restaurar com precisão)
    const prev = {
      htmlOverflow: document.documentElement.style.overflow,
      htmlHeight: document.documentElement.style.height,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      bodyHeight: document.body.style.height,
      scrollY: window.scrollY || 0,
    };

    // liga overlay (antes do play)
    overlay.classList.add('is-on');

    // trava scroll corretamente (ROOT + body fixed)
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${prev.scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // blindagem de fullscreen (mesmo se CSS falhar)
    S(overlay, 'position', 'fixed');
    S(overlay, 'inset', '0');
    S(overlay, 'width', '100vw');
    S(overlay, 'height', '100vh');
    S(overlay, 'background', 'rgba(0,0,0,0.98)');
    S(overlay, 'z-index', '2147483646');
    S(overlay, 'pointer-events', 'auto');

    S(video, 'position', 'fixed');
    S(video, 'inset', '0');
    S(video, 'width', '100vw');
    S(video, 'height', '100vh');
    S(video, 'object-fit', 'cover');
    S(video, 'object-position', 'center');
    S(video, 'background', '#000');
    S(video, 'display', 'block');

    // prepara vídeo
    try { video.pause(); } catch {}
    video.currentTime = 0;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const cleanup = () => {
      video.onended = null;
      video.onerror = null;

      try { video.pause(); } catch {}
      video.removeAttribute('src');
      video.load();

      // restaura scroll primeiro (evita o browser “segurar repaint”)
      document.body.style.overflow = prev.bodyOverflow || '';
      document.body.style.position = prev.bodyPosition || '';
      document.body.style.top = prev.bodyTop || '';
      document.body.style.width = prev.bodyWidth || '';
      document.body.style.height = prev.bodyHeight || '';
      document.documentElement.style.overflow = prev.htmlOverflow || '';
      document.documentElement.style.height = prev.htmlHeight || '';

      // volta scroll no lugar
      window.scrollTo(0, prev.scrollY);

      // IMPORTANTÍSSIMO: aguarda 2 frames antes de desligar overlay
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          overlay.classList.remove('is-on');
          if (typeof onEnded === 'function') onEnded();
        });
      });
    };

    video.onended = cleanup;
    video.onerror = cleanup;

    video.src = src;
    video.load();

    log('Reproduzindo:', src);

    const p = video.play();
    if (p && typeof p.catch === 'function') p.catch(cleanup);
  }

  // API pública esperada pelo paper-qa/perguntas
  function playBlockTransition(videoSrc, done) {
    playVideoWithCallback(videoSrc, done);
  }

  // expõe sem “congelar” (evita crash por read-only)
  try {
    window.playVideoWithCallback = playVideoWithCallback;
    window.playBlockTransition = playBlockTransition;
    window.resolveVideoSrc = resolveVideoSrc;
    window.ensureVideoOverlay = ensureVideoOverlay;
  } catch (e) {
    // se algum ambiente bloquear, não derruba a jornada
    console.warn('[VIDEO_TRANSICAO] Não foi possível expor funções no window:', e);
  }
})();
