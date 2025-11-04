/* section-selfie.js — FINAL: ZOOM FIXO 0.75, SEM MOLDURA */
(function (global) {
  'use strict';
  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__final) return;
  NS.__final = true;

  const SECTION_ID = 'section-selfie';
  const NEXT_ID = 'section-card';
  const TRANSITION_VIDEO = '/assets/videos/filme-card-dourado.mp4';
  const FINAL_ZOOM = 0.75; // Zoom ideal para o card

  let stream = null, videoEl, canvasEl, previewImg;
  let lastCapture = null;

  const toast = msg => global.toast?.(msg) || alert(msg);

  function getName() {
    const jc = global.JC?.data || {};
    let name = jc.nome || jc.participantName || localStorage.getItem('jc.nome') || 'AMOR';
    name = name.toUpperCase().trim();
    global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
    global.JC.data.nome = name;
    try { localStorage.setItem('jc.nome', name); } catch {}
    return name;
  }

  function typeWriter(el, text, speed = 35) {
    el.textContent = ''; el.style.opacity = '1';
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) el.textContent += text[i++];
      else clearInterval(timer);
    }, speed);
  }

  function speak(text) {
    if (global.speak) global.speak(text);
    else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; u.rate = 0.9;
      speechSynthesis.speak(u);
    }
  }

  function updateZoom() {
    const zoom = +document.getElementById('zoomAll').value;
    document.getElementById('zoomAllVal').textContent = zoom.toFixed(2) + '×';
    [videoEl, canvasEl].forEach(el => {
      if (el) el.style.transform = `translate(-50%,-50%) scale(${zoom})`;
    });
  }

  async function startCamera() {
    stopCamera();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 } },
        audio: false
      });
      videoEl.srcObject = stream;
      videoEl.style.display = 'block';
      canvasEl.style.display = 'none';
      previewImg.style.display = 'none';
      document.getElementById('btn-selfie-capture').disabled = false;
    } catch (e) {
      toast('Câmera bloqueada. Ative as permissões.');
      document.getElementById('selfie-error').style.display = 'block';
    }
  }

  function stopCamera() {
    if (stream) stream.getTracks().forEach(t => t.stop());
    stream = null;
    if (videoEl) videoEl.srcObject = null;
  }

  function capture() {
    const canvas = canvasEl;
    const video = videoEl;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const w = container.clientWidth;
    const h = container.clientHeight;

    canvas.width = w; canvas.height = h;

    // Aplica zoom FIXO para o card
    const scale = FINAL_ZOOM;
    const sw = w / scale, sh = h / scale;
    const sx = (video.videoWidth - sw) / 2;
    const sy = (video.videoHeight - sh) / 2;

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    lastCapture = canvas.toDataURL('image/jpeg', 0.92);

    videoEl.style.display = 'none';
    canvasEl.style.display = 'block';
    document.getElementById('btn-selfie-confirm').disabled = false;
  }

  function playTransitionAndGo(savePhoto = false) {
    if (savePhoto && lastCapture) {
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.selfieDataUrl = lastCapture;
      try { localStorage.setItem('jc.selfieDataUrl', lastCapture); } catch {}
    } else {
      try { delete global.JC.data.selfieDataUrl; global.JC.data.selfieSkipped = true; } catch {}
    }

    if (global.VideoTransicao?.play) {
      global.VideoTransicao.play({ src: TRANSITION_VIDEO, onEnd: () => goTo(NEXT_ID) });
    } else {
      const v = document.createElement('video');
      v.src = TRANSITION_VIDEO;
      v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
      v.muted = v.playsInline = true;
      v.onended = () => { v.remove(); goTo(NEXT_ID); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); goTo(NEXT_ID); });
    }
  }

  function goTo(id) {
    if (global.JC?.show) global.JC.show(id, { force: true });
    else if (global.showSection) global.showSection(id);
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

  // INIT
  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId !== SECTION_ID) return;

    videoEl = document.getElementById('selfieVideo');
    canvasEl = document.getElementById('selfieCanvas');
    previewImg = document.getElementById('selfiePreview');

    const title = document.getElementById('selfie-title');
    const texto = document.getElementById('selfieTexto');
    const name = getName();

    setTimeout(() => {
      typeWriter(title, title.dataset.text, 40);
      const fullText = `${name}, posicione o rosto no centro. A foto será ajustada automaticamente.`;
      typeWriter(texto, fullText, 36);
      speak(fullText);
    }, 300);

    document.getElementById('zoomAll').oninput = updateZoom;
    updateZoom();

    document.getElementById('startCamBtn').onclick = startCamera;
    document.getElementById('btn-selfie-capture').onclick = capture;
    document.getElementById('btn-selfie-confirm').onclick = () => playTransitionAndGo(true);
    document.getElementById('btn-skip-selfie').onclick = () => { stopCamera(); playTransitionAndGo(false); };

    document.addEventListener('sectionWillHide', ev => {
      if (ev.detail?.sectionId === SECTION_ID) stopCamera();
    });
  });

  if (document.readyState !== 'loading') {
    const section = document.getElementById(SECTION_ID);
    if (section && section.classList.contains('active')) {
      setTimeout(() => document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: SECTION_ID } })), 100);
    }
  }
})(window);
