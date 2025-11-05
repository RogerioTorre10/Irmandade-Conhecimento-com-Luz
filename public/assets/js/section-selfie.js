/* section-selfie.js — VERSÃO FINAL 100% FUNCIONAL */
(function (global) {
  'use strict';
  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__final) return;
  NS.__final = true;

  const FINAL_ZOOM = 0.65;
  let stream = null, videoEl, canvasEl, previewImg;
  let lastCapture = null;

  const toast = msg => global.toast?.(msg) || alert(msg);

  // === NOME + GUIA ===
  function getUserData() {
    const jc = global.JC?.data || {};
    let nome = jc.nome || jc.participantName || localStorage.getItem('jc.nome') || 'AMOR';
    let guia = sessionStorage.getItem('jornada.guia') || 'zion'; // pega do sessionStorage

    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    // Garante no JC
    global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
    global.JC.data.nome = nome;
    global.JC.data.guia = guia;

    try {
      localStorage.setItem('jc.nome', nome);
      sessionStorage.setItem('jornada.guia', guia);
    } catch {}

    return { nome, guia };
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

  // === ZOOM X/Y FUNCIONANDO ===
  function updateZoom() {
    const all = +document.getElementById('zoomAll').value;
    const x = +document.getElementById('zoomX').value;
    const y = +document.getElementById('zoomY').value;

    document.getElementById('zoomAllVal').textContent = all.toFixed(2) + '×';
    document.getElementById('zoomXVal').textContent = x.toFixed(2) + '×';
    document.getElementById('zoomYVal').textContent = y.toFixed(2) + '×';

    const scaleX = all * x;
    const scaleY = all * y;

    [videoEl, canvasEl].forEach(el => {
      if (el) {
        el.style.transform = `translate(-50%, -50%) scaleX(${scaleX}) scaleY(${scaleY})`;
      }
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
      updateZoom();
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
    const w = canvas.parentElement.clientWidth;
    const h = canvas.parentElement.clientHeight;

    canvas.width = w; canvas.height = h;

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

  function playTransitionAndGo(save = false) {
    if (save && lastCapture) {
      global.JC.data.selfieDataUrl = lastCapture;
      try { localStorage.setItem('jc.selfieDataUrl', lastCapture); } catch {}
    } else {
      try { delete global.JC.data.selfieDataUrl; global.JC.data.selfieSkipped = true; } catch {}
    }

    if (global.VideoTransicao?.play) {
      global.VideoTransicao.play({ src: '/assets/videos/filme-card-dourado.mp4', onEnd: () => goTo('section-card') });
    } else {
      const v = document.createElement('video');
      v.src = '/assets/videos/filme-card-dourado.mp4';
      v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
      v.muted = v.playsInline = true;
      v.onended = () => { v.remove(); goTo('section-card'); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); goTo('section-card'); });
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

  // === INIT ===
  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId !== 'section-selfie') return;

    videoEl = document.getElementById('selfieVideo');
    canvasEl = document.getElementById('selfieCanvas');
    previewImg = document.getElementById('selfiePreview');

    const title = document.getElementById('selfie-title');
    const texto = document.getElementById('selfieTexto');
    const { nome, guia } = getUserData();

    setTimeout(() => {
      typeWriter(title, title.dataset.text, 40);

      const guiaNome = {
        arian: 'Arian',
        lumen: 'Lumen',
        zion: 'Zion'
      }[guia] || 'Guia';

      const fullText = `${nome}, afaste um pouco o celular e posicione o rosto no centro. ${guiaNome} te guiará.`;
      typeWriter(texto, fullText, 36);
      speak(fullText);
    }, 300);

    document.querySelectorAll('input[type=range]').forEach(input => {
      input.oninput = updateZoom;
    });
    updateZoom();

    document.getElementById('startCamBtn').onclick = startCamera;
    document.getElementById('btn-selfie-capture').onclick = capture;
    document.getElementById('btn-selfie-confirm').onclick = () => playTransitionAndGo(true);
    document.getElementById('btn-skip-selfie').onclick = () => { stopCamera(); playTransitionAndGo(false); };
  });

  document.addEventListener('sectionWillHide', e => {
    if (e.detail?.sectionId === 'section-selfie') stopCamera();
  });

  // Força init se já estiver carregado
  if (document.getElementById('section-selfie')?.classList.contains('active')) {
    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: 'section-selfie' } }));
    }, 100);
  }
})(window);
