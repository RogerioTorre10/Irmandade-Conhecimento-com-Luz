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
window.playTransitionVideo = function playTransitionVideo(src, nextSectionId) {
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

  // 🔥 Cria o overlay ANTES de qualquer uso (resolve o ReferenceError)
  let overlay = document.getElementById('transition-video-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'transition-video-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: black;
      opacity: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: auto;
    `;
    document.body.appendChild(overlay);
  }

  // Limpa conteúdo antigo do overlay
  overlay.innerHTML = '';

  // Cria frame dourado (mantido)
  let frame = overlay.querySelector('.jp-video-frame');
  if (!frame) {
    frame = document.createElement('div');
    frame.className = 'jp-video-frame';
    overlay.appendChild(frame);
  }

  const video = document.createElement('video');
  video.autoplay = true;
  video.muted = true;
  video.playsInline = true;
  video.style.cssText = 'width:100%;height:100%;object-fit:cover;';
  frame.appendChild(video);

  const skip = document.createElement('button');
  skip.textContent = 'Pular';
  skip.style.cssText = `
    position: absolute;
    bottom: 20px;
    right: 20px;
    padding: 10px 20px;
    background: rgba(0,0,0,0.6);
    color: white;
    border: 1px solid white;
    border-radius: 8px;
    cursor: pointer;
    z-index: 10000;
  `;
  overlay.appendChild(skip);

  // Cache-buster
  const finalSrc = src + (src.includes('?') ? '&' : '?') + 't=' + Date.now();
  video.src = finalSrc;

  // Função para finalizar transição
  const finishAndGo = () => {
    if (cleaned) return;
    cleaned = true;

    // 🔥 ANTI-VAZAMENTO: esconde seção atual ANTES de navegar
    document.querySelectorAll('[id^="section-"], .current-section, [data-section-visible="true"]').forEach(sec => {
      sec.style.display = 'none !important';
      sec.style.opacity = '0 !important';
      sec.classList.add('hidden');
    });

    document.body.style.overflow = 'hidden !important';

    navigateTo(nextSectionId);

    // Fade out suave do overlay
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.body.style.overflow = 'auto !important';
      isPlaying = false;
    }, 600);
  };

  // Eventos
  video.onended = finishAndGo;
  skip.addEventListener('click', finishAndGo);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) finishAndGo();
  });

  video.addEventListener('canplaythrough', () => {
    log('Vídeo carregado, iniciando reprodução');
    video.play().catch(err => warn('Play bloqueado:', err));
  }, { once: true });

  video.addEventListener('error', (ev) => {
    warn('Erro no vídeo:', ev);
    finishAndGo();
  }, { once: true });

  video.load();
};

  // ----------------- API PÚBLICA -----------------
  window.playTransitionVideo = playTransitionVideo;

  window.playTransition = function (nextSectionId) {
    log('Transição simples (sem vídeo) para:', nextSectionId);
    navigateTo(nextSectionId);
  };
})();
