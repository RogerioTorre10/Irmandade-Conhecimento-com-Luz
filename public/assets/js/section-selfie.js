/* section-selfie.js — VERSÃO CORRIGIDA E ESTÁVEL */
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

  function getById(id) {
    return document.getElementById(id);
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

    const guiaNomeMap = {
      lumen: 'Lumen',
      zion: 'Zion',
      arian: 'Arian'
    };

    const guiaNome = guiaNomeMap[guia] || 'Guia';

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;
    window.JC.data.guiaNome = guiaNome;

    try {
      sessionStorage.setItem('jornada.nome', nome);
      sessionStorage.setItem('jornada.guia', guia);
    } catch (e) {
      console.warn('[SELFIE] Não foi possível persistir nome/guia.', e);
    }

    return { nome, guia, guiaNome };
  }

  function typeWriter(el, text, speed = 35) {
    if (!el) return;
    el.classList.remove('typing-done', 'type-done');
    el.classList.add('typing-active');
    el.textContent = '';

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i++];
      } else {
        clearInterval(timer);
        el.classList.remove('typing-active');
        el.classList.add('typing-done');
      }
    }, speed);
  }

  function speak(text) {
    if (window.EffectCoordinator?.speak) {
      window.EffectCoordinator.speak(text, { rate: 0.95 });
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = document.documentElement.lang || 'pt-BR';
      u.rate = 0.95;
      speechSynthesis.cancel();
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
      previewImg.style.display = 'none';
      previewImg.removeAttribute('src');
    }
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      ctx.clearRect(0, 0, canvasEl.width || 1, canvasEl.height || 1);
      canvasEl.style.display = 'none';
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

    const panel = section.querySelector('.j-panel-glow');
    if (panel) {
      panel.style.width = 'min(92%, 620px)';
      panel.style.maxWidth = '620px';
      panel.style.margin = '0 auto';
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

    const scaleX = clamp(all * x, 0.2, 3);
    const scaleY = clamp(all * y, 0.2, 3);

    if (videoEl && videoEl.style.display !== 'none') {
      applyLiveStyle(videoEl);
      videoEl.style.transformOrigin = '50% 50%';
      videoEl.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`;
    }
  }

  async function startCamera() {
    stopCamera();

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 } },
        audio: false
      });

      if (!videoEl) return;

      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      videoEl.style.opacity = '1';
      videoEl.style.visibility = 'visible';

      await videoEl.play().catch(() => {});
      renderLivePreviewScale();
    } catch (e) {
      console.error('[SELFIE] Erro ao iniciar câmera:', e);
      toast('Não foi possível acessar a câmera.');
    }
  }

  function capture() {
    if (!videoEl || !canvasEl) return;

    const frame = document.querySelector('#section-selfie .preview-frame') || videoEl.parentElement;
    const w = Math.round(frame.clientWidth);
    const h = Math.round(frame.clientHeight);

    canvasEl.width = w;
    canvasEl.height = h;

    const ctx = canvasEl.getContext('2d');
    const zoomFactor = clamp(zoomState.all * Math.min(zoomState.x, zoomState.y), 0.2, 3);

    ctx.drawImage(videoEl, 0, 0, w, h);

    lastCapture = canvasEl.toDataURL('image/jpeg', 0.92);

    videoEl.style.display = 'none';
    canvasEl.style.display = 'block';

    const confirmBtn = getById('btn-selfie-confirm');
    if (confirmBtn) confirmBtn.disabled = false;
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
    } catch (e) {}

    stopCamera();

    if (window.playTransitionVideo) {
      window.playTransitionVideo('/assets/videos/filme-card-dourado.mp4', NEXT_SECTION_ID);
    } else if (window.JC?.show) {
      window.JC.show(NEXT_SECTION_ID);
    } else {
      location.hash = '#' + NEXT_SECTION_ID;
    }
  }

  function bindButtons() {
    const captureBtn = getById('btn-selfie-capture');
    const confirmBtn = getById('btn-selfie-confirm');
    const skipBtn = getById('btn-skip-selfie');

    if (captureBtn) captureBtn.addEventListener('click', capture);
    if (confirmBtn) confirmBtn.addEventListener('click', confirmAndGo);
    if (skipBtn) skipBtn.addEventListener('click', () => {
      stopCamera();
      if (window.JC?.show) window.JC.show(NEXT_SECTION_ID);
    });
  }

  function initSectionSelfie() {
    videoEl = getById('selfieVideo');
    canvasEl = getById('selfieCanvas');
    previewImg = getById('selfiePreview');

    fixSelfieLayout();

    const { nome, guiaNome } = getUserData();

    // Título
    const title = getById('selfie-title');
    if (title) {
      title.textContent = 'Prepare sua selfie';
      title.setAttribute('data-typing', 'true');
      typeWriter(title, 'Prepare sua selfie', 40);
    }

    // Texto principal com nome e guia
   // Texto principal com nome e guia (corrigido)
const texto = getById('selfieTexto');
if (texto) {
  let instruction = window.i18n?.t?.('selfie.instruction') 
    || "{nome}, afaste um pouco o celular e posicione seu rosto. {guia} vai conduzir você.";

  // Substitui os placeholders com segurança
  instruction = instruction
    .replaceAll('{nome}', nome || 'Caminhante')
    .replaceAll('{guia}', guiaNome || 'Guia');

  texto.textContent = '';
  texto.setAttribute('data-typing', 'true');
  
  typeWriter(texto, instruction, 36);

  // Fala o texto completo
  setTimeout(() => {
    speak(instruction);
  }, 450);
}
    bindButtons();
    renderLivePreviewScale();

    // Inicia câmera automaticamente
    setTimeout(() => {
      startCamera();
    }, 800);
  }

  // Inicialização
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail?.sectionId === 'section-selfie') {
      initSectionSelfie();
    }
  });

  // Cleanup ao sair da seção
  document.addEventListener('sectionWillHide', (e) => {
    if (e.detail?.sectionId === 'section-selfie') {
      if (stream) stream.getTracks().forEach(t => t.stop());
    }
  });

  // Bind inicial
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      if (document.getElementById('section-selfie')?.classList.contains('active')) {
        initSectionSelfie();
      }
    });
  } else {
    if (document.getElementById('section-selfie')?.classList.contains('active')) {
      initSectionSelfie();
    }
  }

})(window);
