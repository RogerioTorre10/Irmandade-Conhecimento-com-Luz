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

    // 🔥 ANTI-VAZAMENTO: esconde a seção atual IMEDIATAMENTE
    const currentSection = document.querySelector('.current-section, [data-section-visible="true"], #section-' + currentSectionId); // ajuste o seletor para o seu
    if (currentSection) {
      currentSection.style.display = 'none !important';
      currentSection.style.opacity = '0 !important';
      currentSection.classList.add('hidden');
    }

    // Esconde todo o conteúdo anterior (anti-flash)
    document.body.style.overflow = 'hidden'; // evita scroll durante transição
    const allSections = document.querySelectorAll('[id^="section-"]');
    allSections.forEach(sec => {
      if (sec.id !== 'section-' + nextSectionId) sec.style.display = 'none';
    });

    // Avança para a próxima
    if (window.JC?.show) {
      window.JC.show(nextSectionId);
    } else if (typeof window.showSection === 'function') {
      window.showSection(nextSectionId);
    }

    // Volta o body ao normal após 0.5s (tempo para a nova seção carregar)
    setTimeout(() => {
      document.body.style.overflow = 'auto';
    }, 500);
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

    // glamour fade-in do portal
    requestAnimationFrame(() => overlay.classList.add('show'));

    return { overlay, frame, video, ambient, skip };
  }

  // ------------------------- PLAYER PRINCIPAL ---------------------------
  function playTransitionVideo(src, nextSectionId) {
    log('Recebido src:', src, 'nextSectionId:', nextSectionId);

    // 🔥 REFORÇO NO OVERLAY: cobre 100% com fundo preto para evitar vazamento
    overlay.style.background = 'black';
    overlay.style.opacity = '1';
    overlay.style.transition = 'opacity 0.5s ease';

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
