// /assets/js/video-transicao.js
(function () {
  'use strict';

  const NS = '[VIDEO_TRANSICAO]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);

  let isPlaying = false;
  let cleaned = false;

  // Utilidades
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

  function buildOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'vt-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.style.cssText = [
      'position:fixed','inset:0','z-index:99999',
      'background:rgba(0,0,0,.8)','display:flex',
      'align-items:center','justify-content:center'
    ].join(';');

    const wrap = document.createElement('div');
    wrap.style.cssText = 'width:100%;max-width:1200px;aspect-ratio:16/9;background:#000;position:relative;';

    const video = document.createElement('video');
    video.id = 'vt-video';
    video.playsInline = true;
    video.autoplay = false;
    video.controls = false;
    video.muted = false; // ajuste conforme quiser iniciar com som
    video.style.cssText = 'width:100%;height:100%;object-fit:cover;background:#000;';

    const skip = document.createElement('button');
    skip.textContent = 'Pular';
    skip.setAttribute('aria-label', 'Pular vídeo');
    skip.style.cssText = [
      'position:absolute','right:12px','top:12px','z-index:2',
      'padding:8px 12px','border:0','border-radius:10px',
      'background:rgba(255,255,255,.15)','backdrop-filter:blur(6px)',
      'color:#fff','font-weight:700','cursor:pointer'
    ].join(';');

    wrap.appendChild(video);
    wrap.appendChild(skip);
    overlay.appendChild(wrap);
    document.body.appendChild(overlay);

    return { overlay, wrap, video, skip };
  }

  function cleanup(overlay) {
    if (cleaned) return;
    cleaned = true;
    try {
      document.removeEventListener('keydown', onKeydown, true);
      if (overlay?.parentNode) overlay.parentNode.removeChild(overlay);
    } catch {}
    isPlaying = false;
    log('Overlay removido e estado resetado');
  }

  function onKeydown(e) {
    if (e.key === 'Escape') {
      log('Vídeo pulado pelo usuário (Esc)');
      const overlay = document.getElementById('vt-overlay');
      cleanup(overlay);
    }
  }

  /**
   * Reproduz um vídeo MP4 de transição. Se `src` não for MP4,
   * não tenta reproduzir: navega direto para `nextSectionId`.
   *
   * @param {string} src - caminho do vídeo (relativo ou absoluto)
   * @param {string} nextSectionId - id da próxima seção/âncora/página
   */
  function playTransitionVideo(src, nextSectionId) {
    log('Recebido src:', src, 'nextSectionId:', nextSectionId, { caller: new Error().stack });

    if (!src || !isMp4(src)) {
      warn('Fonte não é MP4 (ou ausente). Pulando player e navegando diretamente…');
      navigateTo(nextSectionId);
      return;
    }

    if (isPlaying) {
      log('Já reproduzindo vídeo, ignorando chamada duplicada…');
      return;
    }
    isPlaying = true;
    cleaned = false;

    const href = resolveHref(src);
    log('Vídeo resolvido para:', href);

    const { overlay, video, skip } = buildOverlay();

    // Eventos (garantir disparo único)
    const finishAndGo = safeOnce(() => {
      cleanup(overlay);
      navigateTo(nextSectionId);
    });

    // Skip por clique no botão ou clique no fundo escuro
    skip.addEventListener('click', finishAndGo);
    overlay.addEventListener('click', (e) => {
      // clique fora do vídeo
      if (e.target === overlay) finishAndGo();
    });
    document.addEventListener('keydown', onKeydown, true);

    // Preparar e reproduzir
    const onCanPlay = safeOnce(() => {
      log('Vídeo carregado, iniciando reprodução:', href);
      video.play().catch(err => {
        warn('Falha ao dar play (autoplay bloqueado?):', err);
        // Tenta iniciar com mute true se o navegador exigir interação
        video.muted = true;
        video.play().catch(() => {
          warn('Play ainda bloqueado — permitindo pular/navegar…');
        });
      });
    });

    const onEnded = safeOnce(() => {
      log('Vídeo finalizado:', href);
      finishAndGo();
    });

    const onError = safeOnce((ev) => {
      warn('Erro ao carregar vídeo:', href, ev);
      // Em caso de erro, limpa e avança
      finishAndGo();
    });

    video.addEventListener('canplaythrough', onCanPlay, { once: true });
    video.addEventListener('loadeddata', onCanPlay, { once: true });
    video.addEventListener('ended', onEnded, { once: true });
    video.addEventListener('error', onError, { once: true });

    // Carrega a fonte
    video.src = href;
    video.load();
  }

  // API pública
  window.playTransitionVideo = playTransitionVideo;

  // Opcional: helper para “transição sem vídeo” (HTML/section)
  window.playTransition = function(nextSectionId) {
    log('Transição simples (sem vídeo) para:', nextSectionId);
    navigateTo(nextSectionId);
  };
})();
