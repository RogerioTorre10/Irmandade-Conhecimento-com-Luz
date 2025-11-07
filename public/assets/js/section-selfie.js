/* section-selfie.js — VERSÃO FINAL (mobile zoom + cover + transição)
   Mantém a base do teu arquivo, com melhorias de zoom/captura. */

(function (window) {
  'use strict';

  const NS = (window.JCSelfie = window.JCSelfie || {});
  if (NS.__final) return;
  NS.__final = true;

  // === PADRÃO DE TRANSIÇÃO (igual ao section-card.js) ===
  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/videos/filme-card-dourado.mp4';

  // Zoom inicial “neutro”
  const DEFAULTS = { all: 1.00, x: 1.00, y: 1.00 };

  let stream = null, videoEl, canvasEl, previewWrap;
  let lastCapture = null;

  const toast = msg => window.toast?.(msg) || alert(msg);

  // === DEBUG NO CONSOLE ===
  window.DEBUG_JC = () => {
    console.log('JC.data:', window.JC?.data);
    console.log('sessionStorage.jornada.guia:', sessionStorage.getItem('jornada.guia'));
    console.log('localStorage.jc.nome:', localStorage.getItem('jc.nome'));
  };

  // === LEITURA FORÇADA DE NOME E GUIA (PRIORIDADE: sessionStorage) ===
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    // 1) PRIORIDADE: sessionStorage
    const ssNome = sessionStorage.getItem('jornada.nome');
    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssNome && ssNome.trim()) nome = ssNome.trim();
    if (ssGuia && ssGuia.trim()) guia = ssGuia.trim().toLowerCase();

    // 2) Fallback: localStorage
    if (!ssNome || !ssGuia) {
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');
      if (lsNome) nome = lsNome;
      if (lsGuia) guia = lsGuia;
    }

    // 3) Normaliza e publica
    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      sessionStorage.setItem('jornada.nome', nome);
      sessionStorage.setItem('jornada.guia', guia);
    } catch {}

    console.log(`%c[SELFIE] Dados finais → Nome: ${nome}, Guia: ${guia}`, 'color: cyan; font-weight: bold');
    return { nome, guia };
  }

  // ——— Datilografia + TTS simples ———
  function typeWriter(el, text, speed = 35) {
    if (!el) return;
    el.textContent = ''; el.style.opacity = '1';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) el.textContent += text[i++];
      else clearInterval(timer);
    }, speed);
  }
  function speak(text) {
    if (!text) return;
    if (window.speak) window.speak(text);
    else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; u.rate = 0.96; u.pitch = 1.0;
      speechSynthesis.cancel?.();
      speechSynthesis.speak(u);
    }
  }

  // ——— Estado de zoom e vínculos nas labels ———
  const Z = { all: DEFAULTS.all, x: DEFAULTS.x, y: DEFAULTS.y };
  function reflectValues() {
    const fmt = v => `${(+v).toFixed(2)}×`;
    document.getElementById('zoomAllVal')?.replaceChildren(document.createTextNode(fmt(Z.all)));
    document.getElementById('zoomXVal')?.replaceChildren(document.createTextNode(fmt(Z.x)));
    document.getElementById('zoomYVal')?.replaceChildren(document.createTextNode(fmt(Z.y)));
  }

  // Aplica zoom visual (preview)
  function applyZoom() {
    if (!videoEl) return;
    const sx = Math.max(0.5, Z.all * Z.x);
    const sy = Math.max(0.5, Z.all * Z.y);
    // Centralização + escala (equivale ao object-fit cover escalado)
    videoEl.style.transform = `translate(-50%, -50%) scale(${sx}, ${sy})`;
    videoEl.style.willChange = 'transform';
  }

  // Vínculo sliders → estado
  function bindZoomSliders() {
    const slAll = document.getElementById('zoomAll') || document.getElementById('zoomGeral');
    const slX   = document.getElementById('zoomX')   || document.getElementById('zoomHorizontal');
    const slY   = document.getElementById('zoomY')   || document.getElementById('zoomVertical');

    [slAll, slX, slY].forEach(sl => {
      if (!sl) return;
      // Ranges úteis no celular
      if (!sl.min)  sl.min  = '0.80';
      if (!sl.max)  sl.max  = '1.60';
      if (!sl.step) sl.step = '0.01';
    });

    const onChange = () => {
      Z.all = parseFloat(slAll?.value || Z.all);
      Z.x   = parseFloat(slX?.value   || Z.x);
      Z.y   = parseFloat(slY?.value   || Z.y);
      applyZoom();
      reflectValues();
    };

    slAll?.addEventListener('input', onChange, { passive: true });
    slX  ?.addEventListener('input', onChange, { passive: true });
    slY  ?.addEventListener('input', onChange, { passive: true });
    slAll?.addEventListener('change', onChange, { passive: true });
    slX  ?.addEventListener('change', onChange, { passive: true });
    slY  ?.addEventListener('change', onChange, { passive: true });

    // Primeiro reflexo
    onChange();
  }

  // ——— Câmera ———
  async function startCamera() {
    stopCamera();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 1920 } },
        audio: false
      });
      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      canvasEl.style.display = 'none';
      document.getElementById('btn-selfie-capture').disabled = false;
      applyZoom();
      reflectValues();
    } catch (e) {
      console.error('[SELFIE] getUserMedia error:', e);
      toast('Câmera bloqueada. Ative as permissões.');
      document.getElementById('selfie-error')?.style && (document.getElementById('selfie-error').style.display = 'block');
    }
  }
  function stopCamera() {
    try { if (stream) stream.getTracks().forEach(t => t.stop()); } catch {}
    stream = null;
    if (videoEl) videoEl.srcObject = null;
  }

  // ——— Captura “cover” respeitando zoom aplicado ———
  function capture(targetW = 720, targetH = 960) {
    if (!videoEl || !canvasEl) return;
    const ctx = canvasEl.getContext('2d');
    if (!ctx || !videoEl.videoWidth || !videoEl.videoHeight) {
      toast('Abra a câmera antes de capturar.');
      return;
    }

    // Dimensiona o canvas (portrait 3:4)
    canvasEl.width = targetW;
    canvasEl.height = targetH;

    const effX = Math.max(0.5, Z.all * Z.x);
    const effY = Math.max(0.5, Z.all * Z.y);

    // Tamanho de origem após zoom
    const srcW = videoEl.videoWidth  / effX;
    const srcH = videoEl.videoHeight / effY;

    // “Cover”: recorta proporcionalmente para preencher todo o canvas
    const dstRatio = targetW / targetH;
    const srcRatio = srcW / srcH;

    let drawW, drawH;
    if (srcRatio > dstRatio) {
      // recorta laterais
      drawH = srcH;
      drawW = drawH * dstRatio;
    } else {
      // recorta topo/fundo
      drawW = srcW;
      drawH = drawW / dstRatio;
    }

    // Offset central (aplica o zoom efetivo)
    const srcX = (videoEl.videoWidth  - drawW * effX) / 2;
    const srcY = (videoEl.videoHeight - drawH * effY) / 2;

    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(
      videoEl,
      Math.max(0, srcX), Math.max(0, srcY),
      Math.min(videoEl.videoWidth,  drawW * effX),
      Math.min(videoEl.videoHeight, drawH * effY),
      0, 0, targetW, targetH
    );

    try { lastCapture = canvasEl.toDataURL('image/jpeg', 0.92); }
    catch { lastCapture = canvasEl.toDataURL(); }

    // Troca preview p/ a foto capturada
    videoEl.style.display = 'none';
    canvasEl.style.display = 'block';
    document.getElementById('btn-selfie-confirm').disabled = false;
  }

  // ——— TRANSIÇÃO PADRÃO ———
  function playTransitionThenGo() {
    console.log(`[SELFIE] Transição → ${NEXT_SECTION_ID}`);

    if (window.playTransitionVideo) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }
    if (window.VideoTransicao?.play) {
      window.VideoTransicao.play({
        src: VIDEO_SRC,
        onEnd: () => goTo(NEXT_SECTION_ID)
      });
      return;
    }

    // Fallback direto
    const v = document.createElement('video');
    v.src = VIDEO_SRC;
    v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
    v.muted = v.playsInline = true;
    v.onended = () => { v.remove(); goTo(NEXT_SECTION_ID); };
    document.body.appendChild(v);
    v.play().catch(() => { v.remove(); goTo(NEXT_SECTION_ID); });
  }

  function goTo(id) {
    if (window.JC?.show) window.JC.show(id, { force: true });
    else if (window.showSection) window.showSection(id);
    else forceShow(id);
  }
  function forceShow(id) {
    const el = document.getElementById(id);
    if (el) {
      el.classList.remove('hidden'); el.classList.add('active');
      el.scrollIntoView({ behavior: 'smooth' });
      el.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id } }));
    }
  }

  // ——— CONFIRMAR E IR ———
  function confirmAndGo() {
    if (!lastCapture) {
      toast('Tire uma foto primeiro.');
      return;
    }
    // Salva no estado global e localStorage (como antes)
    window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
    window.JC.data.selfieDataUrl = lastCapture;
    try { localStorage.setItem('jc.selfieDataUrl', lastCapture); } catch {}
    window.dispatchEvent(new CustomEvent('selfie:captured', { detail: { dataUrl: lastCapture } }));
    playTransitionThenGo();
  }

  // ——— INIT ———
  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId !== 'section-selfie') return;

    videoEl     = document.getElementById('selfieVideo');
    canvasEl    = document.getElementById('selfieCanvas');
    previewWrap = document.getElementById('selfiePreview'); // container

    // Garantias visuais (para caso o CSS ainda não esteja publicado)
    [videoEl, canvasEl].forEach(el => {
      if (!el) return;
      el.style.position = 'absolute';
      el.style.left = '50%';
      el.style.top = '50%';
      el.style.width = '100%';
      el.style.height = '100%';
      el.style.objectFit = 'cover';
      el.style.transform = 'translate(-50%, -50%)';
      el.style.transformOrigin = 'center center';
    });
    if (previewWrap && !previewWrap.style.position) previewWrap.style.position = 'relative';

    const title = document.getElementById('selfie-title');
    const texto = document.getElementById('selfieTexto');
    const { nome, guia } = getUserData();

    setTimeout(() => {
      if (title?.dataset?.text) typeWriter(title, title.dataset.text, 40);
      const guiaNome = { arian: 'Arian', lumen: 'Lumen', zion: 'Zion' }[guia] || 'Guia';
      const fullText = `${nome}, afaste um pouco o celular e posicione o rosto no centro. ${guiaNome} te guiará.`;
      typeWriter(texto, fullText, 36);
      speak(fullText);
    }, 250);

    bindZoomSliders();
    applyZoom();

    document.getElementById('startCamBtn')?.addEventListener('click', startCamera);
    document.getElementById('btn-selfie-capture')?.addEventListener('click', () => capture(720, 960));
    document.getElementById('btn-selfie-confirm')?.addEventListener('click', confirmAndGo);
    document.getElementById('btn-skip-selfie')?.addEventListener('click', () => {
      stopCamera();
      playTransitionThenGo();
    });

    // Em alguns devices o metadata chega depois — atualiza zoom quando vier
    videoEl?.addEventListener('loadedmetadata', () => {
      applyZoom();
      reflectValues();
    }, { once:true });
  });

  document.addEventListener('sectionWillHide', e => {
    if (e.detail?.sectionId === 'section-selfie') stopCamera();
  });

  // FORÇA INIT se a seção já estiver ativa
  const section = document.getElementById('section-selfie');
  if (section && section.classList.contains('active')) {
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: 'section-selfie' } }));
    }, 100);
  }
})(window);
