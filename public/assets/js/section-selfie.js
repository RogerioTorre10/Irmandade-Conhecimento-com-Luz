/* section-selfie.js — FINAL CORRIGIDO */
(function (global) {
  'use strict';
  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__final) return;
  NS.__final = true;

  const FINAL_ZOOM = 0.65; // Ideal pro card

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
    const a = +document.getElementById('zoomAll').value;
    const x = +document.getElementById('zoomX').value;
    const y = +document.getElementById('zoomY').value;
    document.getElementById('zoomAllVal').textContent = a.toFixed(2) + '×';
    document.getElementById('zoomXVal').textContent = x.toFixed(2) + '×';
    document.getElementById('zoomYVal').textContent = y.toFixed(2) + '×';

    const sx = a * x, sy = a * y;
    [videoEl, canvasEl].forEach(el => {
      if (el) el.style.transform = `translate(-50%,-50%) scaleX(${sx}) scaleY(${sy})`;
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
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
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

  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId !== 'section-selfie') return;

    videoEl = document.getElementById('selfieVideo');
    canvasEl = document.getElementById('selfieCanvas');
    previewImg = document.getElementById('selfiePreview');

    const title = document.getElementById('selfie-title');
    const texto = document.getElementById('selfieTexto');
    const name = getName();

    setTimeout(() => {
      typeWriter(title, title.dataset.text, 40);
      const fullText = `${name}, afaste um pouco o celular. O enquadramento será ajustado automaticamente.`;
      typeWriter(texto, fullText, 36);
      speak(fullText);
    }, 300);

    document.querySelectorAll('input[type=range]').forEach(input => input.oninput = updateZoom);
    updateZoom();

    document.getElementById('startCamBtn').onclick = startCamera;
    document.getElementById('btn-selfie-capture').onclick = capture;
    document.getElementById('btn-selfie-confirm').onclick = () => playTransitionAndGo(true);
    document.getElementById('btn-skip-selfie').onclick = () => { stopCamera(); playTransitionAndGo(false); };
  });

  document.addEventListener('sectionWillHide', e => {
    if (e.detail?.sectionId === 'section-selfie') stopCamera();
  });
})(window);
