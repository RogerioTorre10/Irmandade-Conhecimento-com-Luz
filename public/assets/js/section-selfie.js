// /assets/js/section-selfie.js
(function () {
  'use strict';

  const SECTION_ID       = 'section-selfie';
  const NEXT_SECTION_ID  = 'section-card';
  const TRANSITION_VIDEO = '/assets/videos/filme-card-dourado.mp4'; // FILME DE TRANSIÇÃO
  const HIDE_CLASS       = 'hidden';

  if (window.JCSelfie?.__bound) return { console.log('[JCSelfie] já carregado'); return; }
  window.JCSelfie = window.JCSelfie || {};
  window.JCSelfie.__bound = true;

  // ---------- utils ----------
  const q  = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function show(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.style.display = '';
    el.style.opacity = '';
    el.style.visibility = '';
    el.setAttribute('aria-hidden', 'false');
  }

  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;
    await Promise.race([
      new Promise(res => document.addEventListener('transition:ended', res, { once: true })),
      sleep(timeoutMs)
    ]);
  }

  // ---------- PLAY TRANSITION VIDEO ----------
  function playTransitionVideo(src, nextId) {
    if (!src) return;
    
    const overlay = document.createElement('div');
    overlay.id = 'transition-overlay';
    overlay.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: #000; z-index: 9999; display: flex; justify-content: center; align-items: center;
    `;

    const video = document.createElement('video');
    video.src = src;
    video.autoplay = true;
    video.muted = true;
    video.playsInline = true;
    video.style.cssText = `max-width: 100%; max-height: 100%; object-fit: contain;`;

    video.onended = () => {
      document.body.removeChild(overlay);
      window.__TRANSITION_LOCK = false;
      document.dispatchEvent(new CustomEvent('transition:ended'));
      window.JC?.show?.(nextId) ?? (location.hash = `#${nextId}`);
    };

    overlay.appendChild(video);
    document.body.appendChild(overlay);
  }

  // ---------- typing ----------
  async function typeOnce(el, text, { speed = 34, speak = true } = {}) {
    if (!el) return;
    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if (!msg) return;

    el.classList.add('typing-active'); el.classList.remove('typing-done');
    el.textContent = '';

    for (let i = 0; i < msg.length; i++) {
      el.textContent += msg[i];
      await sleep(speed);
    }

    el.classList.remove('typing-active'); el.classList.add('typing-done');

    if (speak && window.EffectCoordinator?.speak) {
      try { await window.EffectCoordinator.speak(msg, { lang: 'pt-BR', rate: 1.05 }); }
      catch {}
    }
  }

  async function initSelfieText(root) {
    const el = q('#selfieTexto', root);
    if (!el) return;
    show(el);
    const nome = (window.JC?.data?.nome || sessionStorage.getItem('jornada.nome') || 'AMIGO(A)').toUpperCase();
    const base = el.dataset?.text?.trim() || `${nome}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
    const msg = base.replace(/\{\{\s*NOME\s*\}\}/gi, nome);
    await typeOnce(el, msg, { speed: Number(el.dataset.speed || 34), speak: true });
  }

  // ---------- câmera + zoom ----------
  let stream = null;
  const zoom = { all: 1, x: 1, y: 1 };

  function applyZoom() {
    const video = q('#selfieVideo');
    const canvas = q('#selfieCanvas');
    if (!video && !canvas) return;
    const sx = zoom.all * zoom.x;
    const sy = zoom.all * zoom.y;
    [video, canvas].forEach(el => el && (el.style.transform = `scale(${sx}, ${sy})`));
  }

  async function startCamera(root) {
    const video = q('#selfieVideo', root);
    if (!video) return false;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      video.srcObject = stream;
      await video.play();
      show(video);
      return true;
    } catch (e) {
      console.warn('[Selfie] Câmera falhou:', e);
      return false;
    }
  }

  function captureToCanvas(video, canvas) {
    const OUT_W = 768, OUT_H = 1152;
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    canvas.width = OUT_W; canvas.height = OUT_H;
    const ctx = canvas.getContext('2d');

    const sx = zoom.all * zoom.x, sy = zoom.all * zoom.y;
    const pivotY = 0.58;
    const cx = vw / 2, cy = vh * pivotY;

    ctx.save();
    ctx.translate(OUT_W / 2, OUT_H * pivotY);
    ctx.scale(sx, sy);
    const scaleBase = Math.max(OUT_W / vw, OUT_H / vh);
    ctx.scale(scaleBase, scaleBase);
    ctx.translate(-cx, -cy);
    ctx.drawImage(video, 0, 0, vw, vh);
    ctx.restore();

    return canvas.toDataURL('image/jpeg', 0.92);
  }

  // ---------- init ----------
  async function initOnce(root) {
    if (!root || root.dataset.selfieInitialized === 'true') return;
    root.dataset.selfieInitialized = 'true';

    await waitForTransitionUnlock();

    show(root);
    ['.selfie-header', '.moldura-orientacao', '.selfie-controls', '.selfie-actions'].forEach(sel => show(q(sel, root)));

    const title = q('.titulo-pergaminho', root);
    const video = q('#selfieVideo', root);
    const canvas = q('#selfieCanvas', root);
    const btnPreview = q('#btn-preview-selfie', root);
    const btnRetake = q('#btn-retake-selfie', root) || q('#btn-tirar-outra', root);
    const btnConfirm = q('#btn-send-selfie', root);
    const btnNext = q('#btn-start-next', root);
    const btnSkip = q('#btn-skip-selfie', root);

    const zoomAll = q('#zoomAll', root);
    const zoomX = q('#zoomX', root);
    const zoomY = q('#zoomY', root);

    // Título
    if (title && !title.classList.contains('typing-done')) {
      await typeOnce(title, null, { speed: 32, speak: true });
    }
    await initSelfieText(root);

    // Zoom
    const updateZoom = () => {
      zoom.all = Number(zoomAll?.value || 1);
      zoom.x = Number(zoomX?.value || 1);
      zoom.y = Number(zoomY?.value || 1);
      applyZoom();
      window.JCSelfieZoom = { ...zoom };
    };
    [zoomAll, zoomX, zoomY].forEach(input => input?.addEventListener('input', updateZoom));
    updateZoom();

    // Iniciar câmera automaticamente
    startCamera(root).then(ok => {
      if (ok) btnPreview.disabled = false;
    });

    // Prévia
    btnPreview.onclick = () => {
      if (!video.srcObject) return;
      const dataUrl = captureToCanvas(video, canvas);
      canvas.style.display = 'block';
      video.style.display = 'none';
      btnRetake.disabled = false;
      btnConfirm.disabled = false;
      window.JC.data.selfiePreview = dataUrl;
    };

    // Tirar outra
    btnRetake.onclick = () => {
      canvas.style.display = 'none';
      video.style.display = 'block';
      btnRetake.disabled = true;
      btnConfirm.disabled = true;
      delete window.JC.data.selfie;
    };

    // Confirmar
    btnConfirm.onclick = () => {
      const dataUrl = window.JC.data.selfiePreview;
      if (!dataUrl) return;
      window.JC.data.selfie = dataUrl;
      localStorage.setItem('jornada.selfie', dataUrl);
      btnNext.disabled = false;
      btnNext.classList.add('btn-ready-pulse');
      setTimeout(() => btnNext.classList.remove('btn-ready-pulse'), 900);
    };

    // Avançar com filme dourado
    btnNext.onclick = () => {
      window.__TRANSITION_LOCK = true;
      document.dispatchEvent(new CustomEvent('transition:started'));
      playTransitionVideo(TRANSITION_VIDEO, NEXT_SECTION_ID);
    };

    // Pular
    btnSkip.onclick = () => {
      btnNext.disabled = false;
      playTransitionVideo(TRANSITION_VIDEO, NEXT_SECTION_ID);
    };

    // Limpar câmera
    document.addEventListener('section:shown', (e) => {
      if (e.detail?.sectionId !== SECTION_ID && stream) {
        stream.getTracks().forEach(t => t.stop());
        stream = null;
      }
    });

    console.log('[JCSelfie] Inicializado com filme de transição dourado');
  }

  // Eventos
  document.addEventListener('section:shown', (e) => {
    if (e.detail?.sectionId === SECTION_ID) initOnce(e.detail.node || document.getElementById(SECTION_ID));
  });

// FORÇA EXIBIÇÃO IMEDIATA
setTimeout(() => {
  const els = document.querySelectorAll('#section-selfie, #section-selfie *');
  els.forEach(el => {
    el.style.display = 'block';
    el.style.opacity = '1';
    el.style.visibility = 'visible';
  });
  console.log('FORÇA VISUAL APLICADA');
}, 100);

  const current = document.getElementById(SECTION_ID);
  if (current && !current.classList.contains(HIDE_CLASS)) initOnce(current);

})();
