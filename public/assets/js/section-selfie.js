/* /assets/js/section-selfie.js — FASE 4.3
   - UX mobile e máscara corrigidas
   - Botões redefinidos e dinâmicos:
     • Prévia → ativa câmera; depois vira “Prévia/Repetir”
     • Foto → captura frame
     • Iniciar → confirma e segue (antes: Confirmar/Iniciar)
     • Header: “Não quero Foto” (antes: Não quero Foto / Iniciar)
   - Container de enquadramento mantido (guia)
   - Máscara responsiva (MASK_URL + MASK_SIZE)
   - Transição de vídeo preservada
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase43_bound) return; // idempotente
  NS.__phase43_bound = true;

  // ---- Constantes de integração ----
  const MOD = 'section-selfie.js';
  const SECTION_ID = 'section-selfie';
  const NEXT_SECTION_ID = 'section-card';
  const VIDEO_SRC = '/assets/video/filme-eu-na-irmandade.mp4';

  // Ajuste aqui sua máscara e escala padrão
  const MASK_URL = '/assets/img/chama-mask.png'; // PNG/SVG com fundo TRANSPARENTE e silhueta BRANCA
  const MASK_SIZE = '80%'; // tamanho relativo da máscara dentro da prévia (mobile-friendly)

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // Estado de câmera
  let stream = null;
  let usingFront = true;
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
      <button id="btn-skip-selfie" class="btn btn-stone">Não quero Foto</button>`;

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
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;font-family:Cardo,serif;font-size:14px;position:relative;z-index:60}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px;border-radius:2px;background:#555;outline:none}
      #selfieControls input[type=range]::-webkit-slider-thumb{background:#f9e7c2;border-radius:50%;width:14px;height:14px}
      #selfieButtons{position:relative;z-index:60}
      #selfieFrameBox{position:relative;margin:6px auto 6px;width:92%;max-width:820px;height:clamp(140px, 16vh, 220px);border:1px dashed rgba(249,231,194,.35);border-radius:12px;pointer-events:none;}
      #selfieFrameBox .guide{position:absolute;inset:6px;background-repeat:no-repeat;background-position:center;background-size:contain;opacity:.75;filter:drop-shadow(0 2px 6px rgba(0,0,0,.6));}
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

    // Guia
    let fb = document.querySelector('#selfieFrameBox');
    if (!fb) {
      fb = document.createElement('div');
      fb.id = 'selfieFrameBox';
      section.appendChild(fb);
    }
    fb.style.position = 'relative'; fb.style.zIndex = '60';
    fb.innerHTML = `<div class="guide" style="background-image:url(${MASK_URL})"></div>`;
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
        #selfieButtons{display:grid;grid-template-columns:repeat(3, minmax(140px,1fr));gap:8px;margin:8px auto;width:92%;max-width:820px}
        #selfieButtons .btn{height:36px;line-height:36px;padding:0 10px;font-size:14px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s}
        #selfieButtons .btn:disabled{opacity:.5;cursor:not-allowed}
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
        // Inicia/repete a câmera
        await startCamera(true);
        // Troca rótulo após primeira execução
        if (btnPreview.textContent !== 'Prévia/Repetir') btnPreview.textContent = 'Prévia/Repetir';
        // Habilita os outros botões
        btnShot.disabled = false;
        btnConfirm.disabled = false;
      };
      btnShot.onclick = () => capturePhoto();
      btnConfirm.onclick = () => confirmPhoto();
    }

    div.style.position = 'relative';
    div.style.zIndex = '60';
  }

  // ---------- Prévia (rodapé) + Máscara responsiva ----------
  function ensurePreview(section) {
    if (section.querySelector('#selfiePreviewWrap')) return;

    const style = document.createElement('style');
    style.textContent = `
      #selfiePreviewWrap{position:fixed;left:0;right:0;bottom:12px;width:100%;max-height:clamp(240px, 38vh, 420px);background:rgba(0,0,0,.55);backdrop-filter:blur(2px);border-top:1px solid rgba(255,255,255,.08);z-index:40}
      #selfiePreview{position:relative;margin:8px auto;width:92%;max-width:820px;height:calc(clamp(240px, 38vh, 420px) - 16px);overflow:hidden;border-radius:14px;border:1px solid rgba(255,255,255,.08);background:#000}
      #selfieViewport{position:absolute;inset:0}
      #selfieVideo,#selfieCanvas{position:absolute;top:50%;left:50%;transform:translate(-50%, -50%);min-width:100%;min-height:100%;}
      .masked #selfieVideo, .masked #selfieCanvas{
        -webkit-mask-image: url(${MASK_URL});
        mask-image: url(${MASK_URL});
        -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
        -webkit-mask-position: center; mask-position: center;
        -webkit-mask-size: ${MASK_SIZE} auto; mask-size: ${MASK_SIZE} auto;
      }
    `;
    document.head.appendChild(style);

    previewWrap = document.createElement('div');
    previewWrap.id = 'selfiePreviewWrap';
    previewWrap.innerHTML = `
      <div id="selfiePreview" class="masked">
        <div id="selfieViewport">
          <video id="selfieVideo" autoplay playsinline muted></video>
          <canvas id="selfieCanvas"></canvas>
        </div>
      </div>`;
    section.appendChild(previewWrap);

    previewBox = previewWrap.querySelector('#selfiePreview');
    videoEl = previewWrap.querySelector('#selfieVideo');
    canvasEl = previewWrap.querySelector('#selfieCanvas');
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
      // Clique no vídeo captura
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

    NS._lastCapture = dataUrl;
  }

  function retakePhoto() {
    if (!videoEl) return;
    canvasEl.style.display = 'none';
    videoEl.style.display = 'block';
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
