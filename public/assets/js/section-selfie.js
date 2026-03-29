/* section-selfie.js — VERSÃO ESTÁVEL FINAL */
(function (window) {
  'use strict';

  const NS = (window.JCSelfie = window.JCSelfie || {});
  if (NS.__final) return;
  NS.__final = true;

  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/videos/filme-card-dourado.mp4';
  const FINAL_ZOOM = 0.65;

  let zoomState = { all: FINAL_ZOOM, x: 1, y: 1 };

  let stream = null;
  let videoEl = null;
  let canvasEl = null;
  let previewImg = null;
  let lastCapture = null;

  const toast = (msg) => window.toast?.(msg) || alert(msg);

  window.DEBUG_JC = () => {
    console.log('JC.data:', window.JC?.data);
    console.log('sessionStorage.jornada.guia:', sessionStorage.getItem('jornada.guia'));
    console.log('localStorage.jc.nome:', localStorage.getItem('jc.nome'));
  };

  function getById(id) {
    return document.getElementById(id);
  }

  function getFrameEl() {
    return (
      getById('selfieFrame') ||
      getById('selfiePreviewWrap') ||
      document.querySelector('#section-selfie .preview-frame') ||
      videoEl?.parentElement ||
      canvasEl?.parentElement ||
      previewImg?.parentElement
    );
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    const ssNome = sessionStorage.getItem('jornada.nome');
    const ssGuia = sessionStorage.getItem('jornada.guia');

    if (ssNome && ssNome.trim()) nome = ssNome.trim();
    if (ssGuia && ssGuia.trim()) guia = ssGuia.trim().toLowerCase();

    if (!ssNome || !ssGuia) {
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');
      if (lsNome) nome = lsNome;
      if (lsGuia) guia = lsGuia;
    }

    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      sessionStorage.setItem('jornada.nome', nome);
      sessionStorage.setItem('jornada.guia', guia);
    } catch (e) {
      console.warn('[SELFIE] Não foi possível persistir nome/guia.', e);
    }

    return { nome, guia };
  }

  function typeWriter(el, text, speed = 35) {
    if (!el) return;
    el.textContent = '';
    el.style.opacity = '1';

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i++];
      } else {
        clearInterval(timer);
      }
    }, speed);
  }

  function speak(text) {
    if (window.speak) {
      window.speak(text);
      return;
    }

    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR';
      u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  }

  function applyLiveStyle(el) {
    if (!el) return;
    el.style.position = 'absolute';
    el.style.top = '50%';
    el.style.left = '50%';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.maxWidth = 'none';
    el.style.maxHeight = 'none';
    el.style.display = 'block';
    el.style.margin = 'auto';
    el.style.objectFit = 'cover';
    el.style.objectPosition = 'center center';
    el.style.transformOrigin = 'center center';
    el.style.background = '#000';
    el.style.zIndex = '12';
  }

  function applyCapturedCanvasStyle(el) {
    if (!el) return;
    el.style.position = 'absolute';
    el.style.top = '0';
    el.style.left = '0';
    el.style.width = '100%';
    el.style.height = '100%';
    el.style.display = 'block';
    el.style.margin = 'auto';
    el.style.transform = 'none';
    el.style.background = '#000';
    el.style.zIndex = '20';
  }

  function clearPreviewState() {
    lastCapture = null;

    if (previewImg) {
      previewImg.onload = null;
      previewImg.style.display = 'none';
      previewImg.removeAttribute('src');
      previewImg.src = '';
    }

    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      try {
        ctx.clearRect(0, 0, canvasEl.width || 1, canvasEl.height || 1);
      } catch {}
      canvasEl.width = 1;
      canvasEl.height = 1;
      canvasEl.style.display = 'none';
      canvasEl.style.opacity = '0';
      canvasEl.style.visibility = 'hidden';
    }

    if (videoEl) {
      videoEl.style.display = 'block';
      videoEl.style.opacity = '1';
      videoEl.style.visibility = 'visible';
    }

    const confirmBtn = getById('btn-selfie-confirm');
    if (confirmBtn) confirmBtn.disabled = true;
  }

  function fixSelfieLayout() {
    const section = getById('section-selfie');
    if (!section) return;

    const panel = section.querySelector('.j-panel-glow.selfie-panel') || section.querySelector('.j-panel-glow');
    const inner = section.querySelector('.j-perg-v-inner');
    const card = section.querySelector('.j-arcane-card');
    const content =
      section.querySelector('.conteudo-pergaminho') ||
      section.querySelector('.pergaminho-content');
    const frame = getFrameEl();

    section.style.overflowX = 'hidden';
    section.style.boxSizing = 'border-box';
    section.style.overflowY = 'auto';
    section.style.minHeight = '100vh';
    section.style.height = 'auto';
    section.style.paddingBottom = '40px';
    section.style.webkitOverflowScrolling = 'touch';
    section.style.paddingLeft = '6px';
    section.style.paddingRight = '6px';

    [panel, inner, card, content].forEach((el) => {
      if (!el) return;
      el.style.boxSizing = 'border-box';
      el.style.marginLeft = 'auto';
      el.style.marginRight = 'auto';
      el.style.maxWidth = '100%';
    });

    if (panel && window.innerWidth <= 768) {
     panel.style.width = 'calc(100vw - 18px)';
     panel.style.maxWidth = '420px';
     panel.style.marginLeft = 'auto';
     panel.style.marginRight = 'auto';
     panel.style.transform = 'translateX(-8px)';
     panel.style.overflow = 'visible';
   }

    if (frame) {
      frame.style.position = 'relative';
      frame.style.overflow = 'hidden';
      frame.style.marginLeft = 'auto';
      frame.style.marginRight = 'auto';
      frame.style.marginBottom = '10px';
      frame.style.width = 'min(100%, 320px)';
      frame.style.maxWidth = '320px';
      frame.style.height = '360px';
      frame.style.maxHeight = '360px';
      frame.style.background = '#000';
      frame.style.zIndex = '10';
    }

    const slidersWrap =
      section.querySelector('.ranges-panel') ||
      section.querySelector('.selfie-sliders') ||
      section.querySelector('.camera-sliders') ||
      section.querySelector('.ajustes-camera');

    if (slidersWrap) {
      slidersWrap.style.width = 'min(100%, 320px)';
      slidersWrap.style.maxWidth = '320px';
      slidersWrap.style.marginLeft = 'auto';
      slidersWrap.style.marginRight = 'auto';
      slidersWrap.style.marginTop = '8px';
      slidersWrap.style.marginBottom = '24px';
      slidersWrap.style.paddingBottom = '20px';
      slidersWrap.style.position = 'relative';
      slidersWrap.style.zIndex = '40';
      slidersWrap.style.pointerEvents = 'auto';
    }

    section.querySelectorAll('input[type="range"]').forEach((el) => {
      el.style.width = '100%';
      el.style.position = 'relative';
      el.style.zIndex = '60';
      el.style.pointerEvents = 'auto';
      el.style.touchAction = 'pan-x';
    });

    if (content) {
      content.style.paddingBottom = '32px';
      content.style.overflow = 'visible';
    }
  }

  function renderLivePreviewScale() {
  const allInput = getById('zoomAll');
  const xInput = getById('zoomX');
  const yInput = getById('zoomY');

  const all = clamp(parseFloat(allInput?.value || FINAL_ZOOM), 0.2, 3);
  const x = clamp(parseFloat(xInput?.value || 1), 0.2, 3);
  const y = clamp(parseFloat(yInput?.value || 1), 0.2, 3);

  zoomState.all = all;
  zoomState.x = x;
  zoomState.y = y;

  const zoomAllVal = getById('zoomAllVal');
  const zoomXVal = getById('zoomXVal');
  const zoomYVal = getById('zoomYVal');

  if (zoomAllVal) zoomAllVal.textContent = `${all.toFixed(2)}×`;
  if (zoomXVal) zoomXVal.textContent = `${x.toFixed(2)}×`;
  if (zoomYVal) zoomYVal.textContent = `${y.toFixed(2)}×`;

  const scaleX = clamp(all * x, 0.2, 3);
  const scaleY = clamp(all * y, 0.2, 3);

  if (videoEl && videoEl.style.display !== 'none') {
    applyLiveStyle(videoEl);
    videoEl.style.transformOrigin = 'center center';
    videoEl.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`;
    videoEl.style.display = 'block';
    videoEl.style.opacity = '1';
    videoEl.style.visibility = 'visible';
  }
}

  function updateZoom() {
    renderLivePreviewScale();
  }

  async function startCamera() {
    stopCamera();

    try {
      lastCapture = null;

      if (previewImg) {
        previewImg.onload = null;
        previewImg.style.display = 'none';
        previewImg.removeAttribute('src');
        previewImg.src = '';
      }

      if (canvasEl) {
        const ctx = canvasEl.getContext('2d');
        try {
          ctx.clearRect(0, 0, canvasEl.width || 1, canvasEl.height || 1);
        } catch {}
        canvasEl.width = 1;
        canvasEl.height = 1;
        canvasEl.style.display = 'none';
        canvasEl.style.opacity = '0';
        canvasEl.style.visibility = 'hidden';
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 }
        },
        audio: false
      });

      if (!videoEl) return;

      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      videoEl.style.opacity = '1';
      videoEl.style.visibility = 'visible';
      videoEl.style.zIndex = '12';

      const captureBtn = getById('btn-selfie-capture');
      const confirmBtn = getById('btn-selfie-confirm');
      const errorEl = getById('selfie-error');

      if (captureBtn) captureBtn.disabled = false;
      if (confirmBtn) confirmBtn.disabled = true;
      if (errorEl) errorEl.style.display = 'none';

      await videoEl.play().catch(() => {});
      renderLivePreviewScale();
    } catch (e) {
      console.error('[SELFIE] Erro ao iniciar câmera:', e);
      toast('Câmera bloqueada. Ative as permissões.');
      const errorEl = getById('selfie-error');
      if (errorEl) errorEl.style.display = 'block';
    }
  }

  async function showLivePreview() {
    lastCapture = null;

    if (previewImg) {
      previewImg.onload = null;
      previewImg.style.display = 'none';
      previewImg.removeAttribute('src');
      previewImg.src = '';
    }

    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      try {
        ctx.clearRect(0, 0, canvasEl.width || 1, canvasEl.height || 1);
      } catch {}
      canvasEl.width = 1;
      canvasEl.height = 1;
      canvasEl.style.display = 'none';
      canvasEl.style.opacity = '0';
      canvasEl.style.visibility = 'hidden';
    }

    if (videoEl) {
      videoEl.style.display = 'block';
      videoEl.style.opacity = '1';
      videoEl.style.visibility = 'visible';
      videoEl.style.zIndex = '12';
    }

    const confirmBtn = getById('btn-selfie-confirm');
    if (confirmBtn) confirmBtn.disabled = true;

    await startCamera();
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    stream = null;

    if (videoEl) {
      videoEl.pause?.();
      videoEl.srcObject = null;
    }
  }

  function computeCoverCrop(sourceW, sourceH, targetW, targetH, zoomFactor) {
    const baseScale = Math.max(targetW / sourceW, targetH / sourceH);
    const finalScale = baseScale * zoomFactor;

    const cropW = targetW / finalScale;
    const cropH = targetH / finalScale;

    const sx = (sourceW - cropW) / 2;
    const sy = (sourceH - cropH) / 2;

    return {
      sx: Math.max(0, sx),
      sy: Math.max(0, sy),
      sWidth: Math.min(sourceW, cropW),
      sHeight: Math.min(sourceH, cropH)
    };
  }

  function capture() {
    if (!videoEl || !canvasEl) {
      toast('Pré-visualização indisponível.');
      return;
    }

    if (!videoEl.videoWidth || !videoEl.videoHeight) {
      toast('A câmera ainda não está pronta. Tente novamente em um instante.');
      return;
    }

    const frame = getFrameEl();
    if (!frame) {
      toast('Moldura da selfie não encontrada.');
      return;
    }

    const ctx = canvasEl.getContext('2d');
    const w = Math.max(1, Math.round(frame.clientWidth));
    const h = Math.max(1, Math.round(frame.clientHeight));

    canvasEl.width = w;
    canvasEl.height = h;

    const zoomFactor = clamp(zoomState.all * Math.min(zoomState.x, zoomState.y), 0.2, 3);

    const crop = computeCoverCrop(
      videoEl.videoWidth,
      videoEl.videoHeight,
      w,
      h,
      zoomFactor
    );

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);

    ctx.drawImage(
      videoEl,
      crop.sx,
      crop.sy,
      crop.sWidth,
      crop.sHeight,
      0,
      0,
      w,
      h
    );

    lastCapture = canvasEl.toDataURL('image/jpeg', 0.92);

    if (videoEl) {
      videoEl.style.display = 'none';
      videoEl.style.opacity = '0';
      videoEl.style.visibility = 'hidden';
    }

    applyCapturedCanvasStyle(canvasEl);
    canvasEl.style.display = 'block';
    canvasEl.style.opacity = '1';
    canvasEl.style.visibility = 'visible';
    canvasEl.style.zIndex = '20';

    const confirmBtn = getById('btn-selfie-confirm');
    if (confirmBtn) confirmBtn.disabled = false;
  }

  function playTransitionThenGo() {
    console.log(`[SELFIE] Transição → ${NEXT_SECTION_ID}`);

    if (window.playTransitionVideo) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    const v = document.createElement('video');
    v.src = VIDEO_SRC;
    v.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
    v.muted = true;
    v.playsInline = true;
    v.onended = () => {
      v.remove();
      goTo(NEXT_SECTION_ID);
    };

    document.body.appendChild(v);
    v.play().catch(() => {
      v.remove();
      goTo(NEXT_SECTION_ID);
    });
  }

  function goTo(id) {
    if (window.JC?.show) {
      window.JC.show(id, { force: true });
    } else {
      forceShow(id);
    }
  }

  function forceShow(id) {
    const el = document.getElementById(id);
    if (!el) return;

    el.classList.remove('hidden');
    el.classList.add('active');
    el.scrollIntoView({ behavior: 'smooth' });
    el.dispatchEvent(
      new CustomEvent('sectionLoaded', { detail: { sectionId: id } })
    );
  }

  function confirmAndGo() {
    if (!lastCapture) {
      toast('Tire uma foto primeiro.');
      return;
    }

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.selfieDataUrl = lastCapture;

    try {
      localStorage.setItem('jc.selfieDataUrl', lastCapture);
    } catch (e) {
      console.warn('[SELFIE] Não foi possível salvar selfie no localStorage.', e);
    }

    window.dispatchEvent(
      new CustomEvent('selfie:captured', { detail: { dataUrl: lastCapture } })
    );

    stopCamera();
    playTransitionThenGo();
  }

  function bindRangeInputs() {
    document.querySelectorAll('#section-selfie input[type="range"]').forEach((input) => {
      input.removeEventListener('input', updateZoom);
      input.addEventListener('input', updateZoom);
    });
  }

  function bindButtons() {
    const previewBtn =
      getById('btn-selfie-preview') ||
      getById('btn-preview-selfie') ||
      Array.from(document.querySelectorAll('#section-selfie button')).find(
        (btn) => /prévia|previa/i.test((btn.textContent || '').trim())
      );

    const startBtn = getById('startCamBtn');
    const captureBtn = getById('btn-selfie-capture');
    const confirmBtn = getById('btn-selfie-confirm');
    const skipBtn = getById('btn-skip-selfie');

    if (previewBtn) previewBtn.onclick = showLivePreview;
    if (startBtn) startBtn.onclick = startCamera;
    if (captureBtn) captureBtn.onclick = capture;
    if (confirmBtn) confirmBtn.onclick = confirmAndGo;
    if (skipBtn) {
      skipBtn.onclick = () => {
        stopCamera();
        playTransitionThenGo();
      };
    }
  }

  function initSectionSelfie() {
    videoEl = getById('selfieVideo');
    canvasEl = getById('selfieCanvas');
    previewImg = getById('selfiePreview');

    fixSelfieLayout();

    if (videoEl) applyLiveStyle(videoEl);

    if (canvasEl) {
      applyCapturedCanvasStyle(canvasEl);
      canvasEl.style.display = 'none';
      canvasEl.style.opacity = '0';
      canvasEl.style.visibility = 'hidden';
    }

    if (previewImg) {
      previewImg.style.display = 'none';
      previewImg.removeAttribute('src');
    }

    const title = getById('selfie-title');
    const texto = getById('selfieTexto');
    const { nome, guia } = getUserData();

    setTimeout(() => {
      if (title && !title.classList.contains('typed')) {
        const titleText = (title.dataset.text || 'Prepare sua selfie').trim();
        title.textContent = '';
        typeWriter(title, titleText, 40);
        title.classList.add('typed');
      }

      if (texto && !texto.classList.contains('typed')) {
        const guiaNomeMap = {
          arian: 'Arian',
          lumen: 'Lumen',
          zion: 'Zion'
        };

        const guiaNome = guiaNomeMap[guia] || 'Guia';
        const fullText = `${nome}, afaste o celular e posicione o rosto. ${guiaNome} te guiará.`;

        texto.textContent = '';
        typeWriter(texto, fullText, 36);
        speak(fullText);
        texto.classList.add('typed');
      }
    }, 300);

    bindRangeInputs();
    bindButtons();
    updateZoom();
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId !== 'section-selfie') return;
    initSectionSelfie();
  });

  document.addEventListener('sectionWillHide', (e) => {
    if (e.detail?.sectionId === 'section-selfie') {
      stopCamera();
    }
  });

  window.addEventListener('resize', () => {
    if (!document.getElementById('section-selfie')?.classList.contains('active')) return;
    fixSelfieLayout();
    renderLivePreviewScale();
  });

  const section = document.getElementById('section-selfie');
  if (section && section.classList.contains('active')) {
    setTimeout(() => {
      document.dispatchEvent(
        new CustomEvent('sectionLoaded', {
          detail: { sectionId: 'section-selfie' }
        })
      );
    }, 100);
  }

  (function () {
    'use strict';

    function applyThemeFromSession() {
      const guiaRaw = sessionStorage.getItem('jornada.guia');
      const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

      let main = '#ffd700';
      let g1 = 'rgba(255,230,180,0.85)';
      let g2 = 'rgba(255,210,120,0.75)';

      if (guia === 'lumen') {
        main = '#00ff9d';
        g1 = 'rgba(0,255,157,0.90)';
        g2 = 'rgba(120,255,200,0.70)';
      }

      if (guia === 'zion') {
        main = '#00aaff';
        g1 = 'rgba(0,170,255,0.90)';
        g2 = 'rgba(255,214,91,0.70)';
      }

      if (guia === 'arian') {
        main = '#ff00ff';
        g1 = 'rgba(255,120,255,0.95)';
        g2 = 'rgba(255,180,255,0.80)';
      }

      document.documentElement.style.setProperty('--theme-main-color', main);
      document.documentElement.style.setProperty('--progress-main', main);
      document.documentElement.style.setProperty('--progress-glow-1', g1);
      document.documentElement.style.setProperty('--progress-glow-2', g2);
      document.documentElement.style.setProperty('--guide-color', main);

      if (guia) {
        document.body.setAttribute('data-guia', guia);
      }
    }

    document.addEventListener('DOMContentLoaded', applyThemeFromSession);
    document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
    document.addEventListener('guia:changed', applyThemeFromSession);
  })();
})(window);
