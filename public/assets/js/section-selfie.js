/* /assets/js/section-selfie.js — FASE 4.4 (sem máscara, com enquadramento por container)
   - Remove totalmente o uso de mask-image (mobile-safe)
   - Mantém 3 botões: Prévia/Repetir · Foto · Iniciar
   - Prévia fixa no rodapé com "aspect-ratio" 3:4 (a mesma métrica do CARD)
   - Captura em canvas com recorte tipo "cover" (sem distorcer) para caber no CARD
   - Botões responsivos (mobile): menores e lado a lado sem quebrar layout
   - Transição de vídeo preservada
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase44_bound) return; // idempotente
  NS.__phase44_bound = true;

  // ---- Constantes de integração ----
  const MOD = 'section-selfie.js';
  const SECTION_ID = 'section-selfie';
  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/video/filme-eu-na-irmandade.mp4';

  // Preview/CARD: proporção 3:4 (vertical). Ajuste aqui se o CARD mudar.
  const PREVIEW_MIN_H = 240;            // px
  const PREVIEW_MAX_H = 420;            // px
  const PREVIEW_VH   = 38;              // % da viewport height
  const PREVIEW_AR_W = 3;               // aspect-ratio width
  const PREVIEW_AR_H = 4;               // aspect-ratio height

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Estado de câmera
  let stream = null;
  let videoEl = null;
  let canvasEl = null;
  let previewWrap = null;
  let previewBox = null;

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
    if (!name || typeof name !== 'string') name = 'AMOR';
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
      utter.rate = 0.9; utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    } else { console.log('[TTS Fallback]', text); }
  }

  // ---------- Header ----------
  function ensureHeader(section) {
    let head = section.querySelector('.selfie-header');
    if (!head) {
      head = document.createElement('header');
      head.className = 'selfie-header';
      head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;position:relative;z-index:60;';
      head.innerHTML = `
        <h2 data-text="Tirar sua Foto" data-typing="true" data-speed="40">Tirar sua Foto ✨</h2>
        <button id="btn-skip-selfie" class="btn btn-stone-espinhos">Não quero Foto</button>`;
      head.querySelector('#btn-skip-selfie').onclick = onSkip;
      section.prepend(head);
    } else {
      const skip = head.querySelector('#btn-skip-selfie');
      if (skip) skip.textContent = 'Não quero Foto';
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
      wrap.style.cssText = `margin:16px auto 12px;width:92%;max-width:820px;text-align:left;padding:0 12px;box-sizing:border-box;position:relative;z-index:60;`;
      section.appendChild(wrap);
    }
    const existing = wrap.querySelector('#selfieTexto');
    if (existing) existing.remove();

    const p = document.createElement('p');
    p.id = 'selfieTexto';
    p.style.cssText = `color:#f9e7c2;font-family:Cardo,serif;font-size:15px;line-height:1.5;margin:0;opacity:0;transition:opacity .5s ease;text-align:left;white-space:normal;word-wrap:break-word;`;
    const fullText = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro do enquadramento. Use boa luz e evite sombras.`;
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
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;font-family:Cardo,serif;font-size:14px;position:relative;z-index:60}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px;border-radius:2px;background:#555;outline:none}
      #selfieControls input[type=range]::-webkit-slider-thumb{background:#f9e7c2;border-radius:50%;width:14px;height:14px}
      #selfieButtons{position:relative;z-index:60}
      #selfieFrameBox{position:relative;margin:6px auto 6px;width:92%;max-width:820px;aspect-ratio:${PREVIEW_AR_W}/${PREVIEW_AR_H};border:1px dashed rgba(249,231,194,.35);border-radius:12px;pointer-events:none;}
      #selfieFrameBox .guide{position:absolute;inset:6px;border-radius:10px;opacity:.55}
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

    // Guia simples com a mesma razão 3:4 (apenas retângulo)
    let fb = document.querySelector('#selfieFrameBox');
    if (!fb) {
      fb = document.createElement('div');
      fb.id = 'selfieFrameBox';
      fb.innerHTML = '<div class="guide"></div>';
      section.appendChild(fb);
    }
    fb.style.position = 'relative'; fb.style.zIndex = '60';
  }

  function applyPreviewTransform(a=1, x=1, y=1) {
    if (!videoEl || !canvasEl) return;
    const sx = a * x; const sy = a * y;
    videoEl.style.transform = `translate(-50%, -50%) scaleX(${sx}) scaleY(${sy})`;
    canvasEl.style.transform = `translate(-50%, -50%) scaleX(${sx}) scaleY(${sy})`;
  }

  // ---------- Botões (dinâmica nova) ----------
  function ensureButtons(section) {
    let div = section.querySelector('#selfieButtons');
    if (!div) {
      const css = document.createElement('style');
      css.textContent = `
        #selfieButtons{display:grid;grid-template-columns:repeat(3, minmax(110px,1fr));gap:8px;margin:8px auto;width:92%;max-width:820px}
        #selfieButtons .btn{height:34px;line-height:34px;padding:0 8px;font-size:13px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s}
        #selfieButtons .btn:disabled{opacity:.5;cursor:not-allowed}
        @media (max-width: 480px){
          #selfieButtons{gap:6px}
          #selfieButtons .btn{height:32px;line-height:32px;font-size:12px;padding:0 6px}
        }
      `;
      document.head.appendChild(css);
      div = document.createElement('div');
      div.id = 'selfieButtons';
      div.innerHTML = `
        <button id="btn-preview" class="btn btn-stone-espinhos">Prévia</button>
        <button id="btn-shot" class="btn btn-stone-espinhos" disabled>Foto</button>
        <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Iniciar</button>`;
      section.appendChild(div);
    }

    if (!NS._buttonsReady) {
      NS._buttonsReady = true;
      const btnPreview = div.querySelector('#btn-preview');
      const btnShot = div.querySelector('#btn-shot');
      const btnConfirm = div.querySelector('#btn-confirm');

      btnPreview.onclick = async () => {
        await startCamera();
        if (btnPreview.textContent !== 'Prévia/Repetir') btnPreview.textContent = 'Prévia/Repetir';
        btnShot.disabled = false;
        btnConfirm.disabled = false;
      };
      btnShot.onclick = () => capturePhoto();
      btnConfirm.onclick = () => confirmPhoto();
    }

    div.style.position = 'relative';
    div.style.zIndex = '60';
  }

  // ---------- Prévia (rodapé) sem máscara (enquadramento por container) ----------
  function ensurePreview(section) {
    if (section.querySelector('#selfiePreviewWrap')) return;

    const style = document.createElement('style');
    style.textContent = `
      #selfiePreviewWrap{position:fixed;left:0;right:0;bottom:12px;width:100%;max-height:clamp(${PREVIEW_MIN_H}px, ${PREVIEW_VH}vh, ${PREVIEW_MAX_H}px);background:rgba(0,0,0,.55);backdrop-filter:blur(2px);border-top:1px solid rgba(255,255,255,.08);z-index:40}
      #selfiePreview{position:relative;margin:8px auto;width:92%;max-width:820px;height:calc(clamp(${PREVIEW_MIN_H}px, ${PREVIEW_VH}vh, ${PREVIEW_MAX_H}px) - 16px);overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#000;aspect-ratio:${PREVIEW_AR_W}/${PREVIEW_AR_H}}
      #selfieViewport{position:absolute;inset:0;overflow:hidden}
      #selfieVideo,#selfieCanvas{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);min-width:100%;min-height:100%;}
    `;
    document.head.appendChild(style);

    previewWrap = document.createElement('div');
    previewWrap.id = 'selfiePreviewWrap';
    previewWrap.innerHTML = `
      <div id="selfiePreview">
        <div id="selfieViewport">
          <video id="selfieVideo" autoplay playsinline muted></video>
          <canvas id="selfieCanvas" style="display:none"></canvas>
        </div>
      </div>`;
    section.appendChild(previewWrap);

    previewBox = previewWrap.querySelector('#selfiePreview');
    videoEl = previewWrap.querySelector('#selfieVideo');
    canvasEl = previewWrap.querySelector('#selfieCanvas');
  }

  // ---------- Câmera ----------
  async function startCamera() {
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) { toast('Câmera não suportada neste dispositivo.'); return; }
    const constraints = {
      audio: false,
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    };
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
      videoEl.style.display = 'block';
      canvasEl.style.display = 'none';
      videoEl.srcObject = stream;
      // Clique no vídeo também captura
      videoEl.addEventListener('click', capturePhoto, { once:false });
    } catch (e) {
      console.error('getUserMedia error', e);
      toast('Não foi possível acessar a câmera. Verifique permissões.');
    }
  }

  function stopCamera() {
    if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; }
    if (videoEl) videoEl.srcObject = null;
  }

  // --- Helper: desenhar vídeo no canvas com recorte tipo "cover" ---
  function drawCover(video, ctx, cw, ch) {
    const vw = video.videoWidth || 1280;
    const vh = video.videoHeight || 720;
    const arVideo = vw / vh;
    const arCanvas = cw / ch;
    let sx, sy, sw, sh;
    if (arVideo > arCanvas) {
      // vídeo mais "largo" que o canvas → corta nas laterais
      sh = vh;
      sw = Math.floor(vh * arCanvas);
      sx = Math.floor((vw - sw) / 2);
      sy = 0;
    } else {
      // vídeo mais "alto" → corta em cima/baixo
      sw = vw;
      sh = Math.floor(vw / arCanvas);
      sx = 0;
      sy = Math.floor((vh - sh) / 2);
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, cw, ch);
  }

  // ---------- Captura ----------
  function capturePhoto() {
    if (!videoEl) return;
    // Canvas do tamanho exato do container (CARD metric)
    const cw = Math.floor(previewBox.clientWidth);
    const ch = Math.floor(previewBox.clientHeight);
    canvasEl.width = cw; canvasEl.height = ch;

    const ctx = canvasEl.getContext('2d');
    drawCover(videoEl, ctx, cw, ch);

    const dataUrl = canvasEl.toDataURL('image/jpeg', 0.92);
    videoEl.style.display = 'none';
    canvasEl.style.display = 'block';

    NS._lastCapture = dataUrl;
  }

  // ---- Navegação/Transição ----
  function goNext(id) {
    if (global.JC?.show) global.JC.show(id);
    else if (global.showSection) global.showSection(id);
  }
  function playTransitionThenGo(id) {
    if (global.VideoTransicao?.play) {
      try { global.VideoTransicao.play({ src: VIDEO_SRC, onEnd: () => goNext(id) }); }
      catch { goNext(id); }
    } else { goNext(id); }
  }

  function confirmPhoto() {
    const dataUrl = NS._lastCapture;
    if (!dataUrl) { toast('Tire uma foto primeiro.'); return; }
    try {
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.selfieDataUrl = dataUrl;
      try { localStorage.setItem('jc.selfieDataUrl', dataUrl); } catch {}
    } catch {}
    playTransitionThenGo(NEXT_SECTION_ID);
  }

  // ---------- Pular Selfie ----------
  function onSkip() { playTransitionThenGo(NEXT_SECTION_ID); }

  // ---------- Forçar Ordem ----------
  function enforceOrder(section) {
    const order = [
      '.selfie-header',
      '#selfieOrientWrap',
      '#selfieControls',
      '#selfieButtons',
      '#selfieFrameBox',
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

    // Ordem
    await sleep(100);
    startOrderObserver(section);
    enforceOrder(section);
  }

  async function init() {
    try {
      const section = await waitForElement('#' + SECTION_ID);
      await play(section);
    } catch (err) {
      console.error('Erro ao carregar ' + MOD + ':', err);
    }
  }

  // Encerrar câmera ao trocar de seção
  document.addEventListener('sectionWillHide', e => { if (e?.detail?.sectionId === SECTION_ID) stopCamera(); });

  // Eventos de ciclo de vida
  document.addEventListener('sectionLoaded', e => { if (e?.detail?.sectionId === SECTION_ID) init(); });
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
