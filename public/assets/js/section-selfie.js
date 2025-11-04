/* section-selfie.js — VERSÃO LIMPA E TOTALMENTE FUNCIONAL */
(function (global) {
  'use strict';
  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__loaded) return;
  NS.__loaded = true;

  const SECTION_ID = 'section-selfie';
  const NEXT_ID = 'section-card';
  const TRANSITION_VIDEO = '/assets/videos/filme-card-dourado.mp4';

  let stream = null, videoEl, canvasEl, previewImg;
  let lastCapture = null;

  // Utils
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const toast = msg => global.toast?.(msg) || alert(msg);

  function getName() {
    const jc = global.JC?.data || {};
    let name = jc.nome || jc.participantName;
    if (!name) name = localStorage.getItem('jc.nome') || 'AMOR';
    name = name.toUpperCase().trim();
    global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
    global.JC.data.nome = name;
    try { localStorage.setItem('jc.nome', name); } catch {}
    return name;
  }

  // Typing
  function typeWriter(el, text, speed = 35) {
    el.textContent = '';
    el.style.opacity = '1';
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

  // Zoom
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

  // Câmera
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

    const vw = video.videoWidth, vh = video.videoHeight;
    const arV = vw/vh, arC = w/h;
    let sx, sy, sw, sh;
    if (arV > arC) { sh = vh; sw = vh * arC; sx = (vw - sw)/2; sy = 0; }
    else { sw = vw; sh = vw / arC; sx = 0; sy = (vh - sh)/2; }

    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, w, h);
    lastCapture = canvas.toDataURL('image/jpeg', 0.92);

    videoEl.style.display = 'none';
    canvasEl.style.display = 'block';
  }

  // Navegação
  function playTransitionAndGo(nextId, savePhoto = false) {
    if (savePhoto && lastCapture) {
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.selfieDataUrl = lastCapture;
      try { localStorage.setItem('jc.selfieDataUrl', lastCapture); } catch {}
    } else {
      try { delete global.JC.data.selfieDataUrl; global.JC.data.selfieSkipped = true; } catch {}
    }

    if (global.VideoTransicao?.play) {
      global.VideoTransicao.play({ src: TRANSITION_VIDEO, onEnd: () => goTo(nextId) });
    } else {
      const v = document.createElement('video');
      v.src = TRANSITION_VIDEO;
      v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
      v.muted = v.playsInline = true;
      v.onended = () => { v.remove(); goTo(nextId); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); goTo(nextId); });
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

  // Init
  async function init() {
    const section = document.getElementById(SECTION_ID);
    if (!section) return;

    // Elementos
    videoEl = section.querySelector('#selfieVideo');
    canvasEl = section.querySelector('#selfieCanvas');
    previewImg = section.querySelector('#selfiePreview');

    const title = section.querySelector('#selfie-title');
    const texto = section.querySelector('#selfieTexto');
    const name = getName();

    // Typing
    setTimeout(() => {
      typeWriter(title, title.dataset.text, 40);
      const fullText = `${name}, posicione-se em frente à câmera e centralize o rosto na chama dourada. Use boa luz.`;
      texto.dataset.text = fullText;
      typeWriter(texto, fullText, 36);
      speak(fullText);
    }, 300);

    // Zoom
    section.querySelectorAll('input[type=range]').forEach(input => {
      input.oninput = updateZoom;
    });
    updateZoom();

    // Botões
    section.querySelector('#startCamBtn').onclick = async () => {
      await startCamera();
      section.querySelector('#btn-selfie-previa').disabled = false;
    };

    section.querySelector('#btn-selfie-previa').onclick = () => {
      if (videoEl.style.display !== 'none') {
        capture();
        section.querySelector('#btn-selfie-confirm').disabled = false;
        this.textContent = 'Nova Foto';
      } else {
        startCamera();
        this.textContent = 'Prévia/Nova Foto';
        section.querySelector('#btn-selfie-confirm').disabled = true;
      }
    };

    section.querySelector('#btn-selfie-confirm').onclick = () => {
      playTransitionAndGo(NEXT_ID, true);
    };

    section.querySelector('#btn-skip-selfie').onclick = () => {
      stopCamera();
      playTransitionAndGo(NEXT_ID, false);
    };

    // Limpeza
    document.addEventListener('sectionWillHide', e => {
      if (e.detail?.sectionId === SECTION_ID) stopCamera();
    });
  }

  document.addEventListener('sectionLoaded', e => {
    if (e.detail?.sectionId === SECTION_ID) init();
  });

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

  // Debug
  NS.startCamera = startCamera;
  NS.capture = capture;
  NS.playTransitionAndGo = playTransitionAndGo;

})(window);
