/* /assets/js/section-selfie.js — FASE 4.0
   - Mantém v3.3+ (header, texto, controles, botões, ordem, TTS, tipo)
   - ADICIONA: Câmera frontal, prévia (rodapé), captura, refazer, confirmar, trocar câmera
   - Salva em JC.data.selfieDataUrl e localStorage ('jc.selfieDataUrl')
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase40_bound) return; // idempotente
  NS.__phase40_bound = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Estado de câmera
  let stream = null;
  let usingFront = true;
  let videoEl = null;
  let canvasEl = null;
  let previewWrap = null;

  // ---------- Nome ----------
  function getUpperName() {
    const jc = (global.JC && global.JC.data) ? global.JC.data : {};
    let name = jc.nome || jc.participantName;
    if (!name) {
      try {
        const ls = localStorage.getItem('jc.nome') || localStorage.getItem('jc.participantName');
        if (ls) name = ls;
      } catch {}
    }
    if (!name || typeof name !== 'string') name = 'ANJO';
    const upper = name.toUpperCase().trim();
    try {
      global.JC = global.JC || {}; 
      global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper; 
      global.JC.data.participantName = upper;
      try { localStorage.setItem('jc.nome', upper); } catch {}
    } catch {}
    return upper;
  }

  // ---------- Utils ----------
  const waitForElement = (sel, opt={}) => new Promise((res, rej) => {
    let t = 0;
    const i = setInterval(() => {
      const e = document.querySelector(sel);
      if (e) { clearInterval(i); res(e); }
      else if (++t > 100) { clearInterval(i); rej(new Error('Timeout waiting for ' + sel)); }
    }, opt.interval || 80);
  });

  const placeAfter = (ref, node) => {
    if (!ref || !ref.parentElement) return;
    if (ref.nextSibling) ref.parentElement.insertBefore(node, ref.nextSibling);
    else ref.parentElement.appendChild(node);
  };

  const toast = msg => {
    if (global.toast) return global.toast(msg);
    console.log('[Toast]', msg);
    alert(msg);
  };

  // ---------- Typing Effect ----------
  async function runTyping(el) {
    if (!el) return;
    const text = (el.dataset.text || el.textContent || '').trim();
    if (!text) return;
    el.textContent = '';
    el.style.opacity = '1';
    const speed = +el.dataset.speed || 35;
    const chars = [...text];
    let i = 0;
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (i < chars.length) el.textContent += chars[i++];
        else { clearInterval(interval); resolve(); }
      }, speed);
    });
  }

  // ---------- TTS (Leitura de Voz) ----------
  function speak(text) {
    if (!text) return;
    if (global.speak) {
      global.speak(text);
    } else if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 0.9;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    } else {
      console.log('[TTS Fallback]', text);
    }
  }

  // ---------- Header ----------
  function ensureHeader(section) {
    let head = section.querySelector('.selfie-header');
    if (!head) {
      head = document.createElement('header');
      head.className = 'selfie-header';
      head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;';
      head.innerHTML = `
        <h2 data-text="Tirar sua Foto" data-typing="true" data-speed="40">Tirar sua Foto ✨</h2>
        <button id="btn-skip-selfie" class="btn btn-stone-espinhos">Não quero foto / Iniciar</button>`;
      head.querySelector('#btn-skip-selfie').onclick = onSkip;
      section.prepend(head);
    }
    return head;
  }

  // ---------- Texto de Orientação ----------
  async function ensureTexto(section) {
    const upper = getUpperName();
    let wrap = section.querySelector('#selfieOrientWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'selfieOrientWrap';
      wrap.style.cssText = `margin:16px auto 12px;width:92%;max-width:820px;text-align:left;padding:0 12px;box-sizing:border-box;`;
      section.appendChild(wrap);
    }
    const existing = wrap.querySelector('#selfieTexto');
    if (existing) existing.remove();

    const p = document.createElement('p');
    p.id = 'selfieTexto';
    p.style.cssText = `color:#f9e7c2;font-family:Cardo,serif;font-size:15px;line-height:1.5;margin:0;opacity:0;transition:opacity .5s ease;text-align:left;white-space:normal;word-wrap:break-word;`;
    const fullText = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
    p.dataset.text = fullText; p.dataset.speed = '30'; p.textContent = '';
    wrap.appendChild(p);
    setTimeout(() => { p.style.opacity = '1'; startTyping(p, fullText, 30); speak(fullText); }, 150);
    return p;
  }
  function startTyping(el, text, speed) {
    const chars = [...text]; let i = 0; el.textContent = '';
    const interval = setInterval(() => { if (i < chars.length) el.textContent += chars[i++]; else clearInterval(interval); }, speed);
  }

  // ---------- Controles (Zoom) ----------
  function ensureControls(section) {
    if (section.querySelector('#selfieControls')) return;
    const style = document.createElement('style');
    style.textContent = `
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;font-family:Cardo,serif;font-size:14px}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px;border-radius:2px;background:#555;outline:none}
      #selfieControls input[type=range]::-webkit-slider-thumb{background:#f9e7c2;border-radius:50%;width:14px;height:14px}
    `;
    document.head.appendChild(style);

    const c = document.createElement('div');
    c.id = 'selfieControls';
    c.innerHTML = `
      <div class="row"><label>Zoom Geral</label><input id="zoomAll" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomAllVal">1.00×</span></div>
      <div class="row"><label>Zoom Horizontal</label><input id="zoomX" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomXVal">1.00×</span></div>
      <div class="row"><label>Zoom Vertical</label><input id="zoomY" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomYVal">1.00×</span></div>`;
    section.appendChild(c);

    const zoomAll = c.querySelector('#zoomAll');
    const zoomX = c.querySelector('#zoomX');
    const zoomY = c.querySelector('#zoomY');
    const zoomAllVal = c.querySelector('#zoomAllVal');
    const zoomXVal = c.querySelector('#zoomXVal');
    const zoomYVal = c.querySelector('#zoomYVal');

    const update = () => {
      const a = +zoomAll.value, x = +zoomX.value, y = +zoomY.value;
      zoomAllVal.textContent = a.toFixed(2) + '×';
      zoomXVal.textContent = x.toFixed(2) + '×';
      zoomYVal.textContent = y.toFixed(2) + '×';
      applyPreviewTransform(a, x, y);
    };
    zoomAll.oninput = update; zoomX.oninput = update; zoomY.oninput = update; update();
  }

  function applyPreviewTransform(a=1, x=1, y=1) {
    if (!videoEl) return;
    const sx = a * x;
    const sy = a * y;
    videoEl.style.transform = `translate(-50%, -50%) scaleX(${sx}) scaleY(${sy})`;
  }

  // ---------- Botões ----------
  function ensureButtons(section) {
    let div = section.querySelector('#selfieButtons');
    if (!div) {
      const css = document.createElement('style');
      css.textContent = `
        #selfieButtons{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin:8px auto;width:92%;max-width:820px}
        #selfieButtons .btn{height:36px;line-height:36px;padding:0 10px;font-size:14px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s}
        #selfieButtons .btn:disabled{opacity:.5;cursor:not-allowed}
      `;
      document.head.appendChild(css);
      div = document.createElement('div');
      div.id = 'selfieButtons';
      div.innerHTML = `
        <button id="btn-prev" class="btn btn-stone-espinhos">Prévia</button>
        <button id="btn-retake" class="btn btn-stone-espinhos" disabled>Tirar outra</button>
        <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>
        <button id="btn-switch" class="btn btn-stone-espinhos" disabled>Trocar câmera</button>`;
      section.appendChild(div);
    }
  }

  // ---------- Prévia (rodapé) ----------
  function ensurePreview(section) {
    if (section.querySelector('#selfiePreviewWrap')) return;

    const style = document.createElement('style');
    style.textContent = `
      #selfiePreviewWrap{position:fixed;left:0;right:0;bottom:0;width:100%;max-height:42vh;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);border-top:1px solid rgba(255,255,255,.08);z-index:9999}
      #selfiePreview{position:relative;margin:8px auto;width:92%;max-width:820px;height:calc(42vh - 16px);overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#000}
      #selfieVideo{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);min-width:100%;min-height:100%;}
      #selfieCanvas{display:none}
      #maskFrame{position:absolute;inset:0;pointer-events:none;background-repeat:no-repeat;background-position:center;background-size:contain;}
    `;
    document.head.appendChild(style);

    previewWrap = document.createElement('div');
    previewWrap.id = 'selfiePreviewWrap';
    previewWrap.innerHTML = `
      <div id="selfiePreview">
        <video id="selfieVideo" autoplay playsinline muted></video>
        <canvas id="selfieCanvas"></canvas>
        <div id="maskFrame"></div>
      </div>`;
    section.appendChild(previewWrap);

    videoEl = previewWrap.querySelector('#selfieVideo');
    canvasEl = previewWrap.querySelector('#selfieCanvas');

    // Moldura/chama
    const mask = previewWrap.querySelector('#maskFrame');
    mask.style.backgroundImage = 'url(/assets/img/chama-card.png)';
  }

  // ---------- Câmera ----------
  async function startCamera(useFront = true) {
    stopCamera();
    usingFront = !!useFront;
    if (!navigator.mediaDevices?.getUserMedia) { toast('Câmera não suportada neste dispositivo.'); return; }
    const constraints = {
      audio: false,
      video: { facingMode: useFront ? 'user' : { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
    };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.srcObject = stream;
      enableButtons({ preview:true, retake:false, confirm:false, switch:true });
    } catch (e) {
      console.error('getUserMedia error', e);
      toast('Não foi possível acessar a câmera. Verifique permissões.');
    }
  }

  function stopCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (videoEl) videoEl.srcObject = null;
  }

  function toggleCamera() { startCamera(!usingFront); }

  // ---------- Captura ----------
  function capturePhoto() {
    if (!videoEl) return;
    const vw = videoEl.videoWidth || 1280;
    const vh = videoEl.videoHeight || 720;
    const maxW = 1080; // limite
    const scale = Math.min(1, maxW / vw);
    const w = Math.floor(vw * scale);
    const h = Math.floor(vh * scale);

    canvasEl.width = w; canvasEl.height = h;
    const ctx = canvasEl.getContext('2d');
    ctx.drawImage(videoEl, 0, 0, w, h);

    const dataUrl = canvasEl.toDataURL('image/jpeg', 0.92);
    const img = new Image();
    img.onload = () => { videoEl.style.display = 'none'; canvasEl.style.display = 'block'; };
    img.src = dataUrl;

    enableButtons({ preview:false, retake:true, confirm:true, switch:true });
    NS._lastCapture = dataUrl;
  }

  function retakePhoto() {
    if (!videoEl) return;
    canvasEl.style.display = 'none';
    videoEl.style.display = 'block';
    enableButtons({ preview:true, retake:false, confirm:false, switch:true });
  }

  function confirmPhoto() {
    const dataUrl = NS._lastCapture;
    if (!dataUrl) { toast('Tire uma foto primeiro.'); return; }
    try {
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.selfieDataUrl = dataUrl;
      try { localStorage.setItem('jc.selfieDataUrl', dataUrl); } catch {}
    } catch {}
    if (global.JC?.show) global.JC.show('section-card');
    else if (global.showSection) global.showSection('section-card');
  }

  function enableButtons(state) {
    const btnPrev = document.getElementById('btn-prev');
    const btnRetake = document.getElementById('btn-retake');
    const btnConfirm = document.getElementById('btn-confirm');
    const btnSwitch = document.getElementById('btn-switch');
    if (btnPrev) btnPrev.disabled = state.preview === false;
    if (btnRetake) btnRetake.disabled = state.retake === false;
    if (btnConfirm) btnConfirm.disabled = state.confirm === false;
    if (btnSwitch) btnSwitch.disabled = state.switch === false;
  }

  // ---------- Pular Selfie ----------
  function onSkip() {
    if (global.JC?.show) global.JC.show('section-card');
    else if (global.showSection) global.showSection('section-card');
  }

  // ---------- Forçar Ordem ----------
  function enforceOrder(section) {
    const order = [
      '.selfie-header',
      '#selfieOrientWrap',
      '#selfieControls',
      '#selfieButtons',
      '#selfiePreviewWrap'
    ];
    let attempts = 0, maxAttempts = 10;
    const tryEnforce = () => {
      let prev = null, changed = false;
      order.forEach(sel => {
        const el = section.querySelector(sel);
        if (el && prev && el.previousElementSibling !== prev) { el.remove(); placeAfter(prev, el); changed = true; }
        prev = el || prev;
      });
      attempts++; if (changed && attempts < maxAttempts) setTimeout(tryEnforce, 50);
    };
    tryEnforce(); setTimeout(tryEnforce, 300);
  }

  let orderObserver = null;
  function startOrderObserver(section) {
    if (orderObserver) orderObserver.disconnect();
    orderObserver = new MutationObserver(() => enforceOrder(section));
    orderObserver.observe(section, { childList:true, subtree:true });
    setTimeout(() => { if (orderObserver) orderObserver.disconnect(); }, 3000);
  }

  // ---------- INIT (play) ----------
  async function play(section) {
    const header = ensureHeader(section);
    const title = header.querySelector('h2');
    if (title.dataset.typing === 'true') { runTyping(title); speak(title.dataset.text); }

    ensureTexto(section);
    ensureControls(section);
    ensureButtons(section);
    ensurePreview(section);

    // Wire dos botões
    const btnPrev = section.querySelector('#btn-prev');
    const btnRetake = section.querySelector('#btn-retake');
    const btnConfirm = section.querySelector('#btn-confirm');
    const btnSwitch = section.querySelector('#btn-switch');

    if (btnPrev) btnPrev.onclick = () => startCamera(true);
    if (btnRetake) btnRetake.onclick = () => retakePhoto();
    if (btnConfirm) btnConfirm.onclick = () => confirmPhoto();
    if (btnSwitch) btnSwitch.onclick = () => toggleCamera();

    // Captura ao tocar/clicar na prévia (opcional)
    if (videoEl) videoEl.addEventListener('click', () => capturePhoto());

    // Ordem
    await sleep(100);
    startOrderObserver(section);
    enforceOrder(section);

    // Estado inicial: sem câmera ligada
    enableButtons({ preview:true, retake:false, confirm:false, switch:false });
  }

  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      await play(section);
    } catch (err) {
      console.error('Erro ao carregar section-selfie:', err);
    }
  }

  // Encerrar câmera ao trocar de seção
  document.addEventListener('sectionWillHide', e => { if (e?.detail?.sectionId === 'section-selfie') stopCamera(); });

  // Eventos de ciclo de vida
  document.addEventListener('sectionLoaded', e => { if (e?.detail?.sectionId === 'section-selfie') init(); });
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
