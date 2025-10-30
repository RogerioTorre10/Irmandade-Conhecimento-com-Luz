/* /assets/js/section-selfie.js — FASE 3.4 (Selfie final)
   - Texto com datilografia + voz (com microdelay para aparecer)
   - Header + Controles + Botões + Prévia (vídeo/canvas/máscara)
   - Câmera on/off, captura, retake e confirmar (segue para section-card)
   - Ordem garantida sem interferir nas demais seções
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase34_ready) return;
  NS.__phase34_ready = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

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
  function startTyping(el, text, speed) {
    const chars = [...text];
    let i = 0;
    el.textContent = '';
    const interval = setInterval(() => {
      if (i < chars.length) el.textContent += chars[i++];
      else clearInterval(interval);
    }, speed);
  }

  // ---------- TTS ----------
  function speak(text) {
    if (!text) return;
    if (global.speak) {
      global.speak(text);
      return;
    }
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'pt-BR'; u.rate = 0.9; u.pitch = 1;
      window.speechSynthesis.speak(u);
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
        <button id="btn-skip-selfie" class="btn btn-stone">Não quero foto / Iniciar</button>
      `;
      head.querySelector('#btn-skip-selfie').onclick = onSkip;
      section.prepend(head);
    }
    return head;
  }

  // ---------- Texto de orientação (visível + datilografia) ----------
  async function ensureTexto(section) {
    const upper = getUpperName();
    let wrap = section.querySelector('#selfieOrientWrap');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'selfieOrientWrap';
      wrap.style.cssText = `
        margin: 16px auto 12px;
        width: 92%;
        max-width: 820px;
        text-align: left;
        padding: 0 12px;
        box-sizing: border-box;
      `;
      section.appendChild(wrap);
    }

    const old = wrap.querySelector('#selfieTexto');
    if (old) old.remove();

    const p = document.createElement('p');
    p.id = 'selfieTexto';
    p.style.cssText = `
      color: #f9e7c2;
      font-family: Cardo, serif;
      font-size: 15px;
      line-height: 1.5;
      margin: 0;
      opacity: 0;
      transition: opacity .5s ease;
      text-align: left;
      white-space: normal;
      word-wrap: break-word;
    `;
    const fullText = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
    p.dataset.text = fullText;
    p.dataset.speed = '30';
    p.textContent = '';
    wrap.appendChild(p);

    // microdelay garante repaint antes do fade/typing
    setTimeout(() => {
      p.style.opacity = '1';
      startTyping(p, fullText, 30);
      speak(fullText);
    }, 150);

    return p;
  }

  // ---------- Controles ----------
  function ensureControls(section) {
    if (section.querySelector('#selfieControls')) return;

    const style = document.createElement('style');
    style.textContent = `
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);
      border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;
      font-family:Cardo,serif;font-size:14px}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px;border-radius:2px;background:#555;outline:none;}
      #selfieControls input[type=range]::-webkit-slider-thumb{background:#f9e7c2;border-radius:50%;width:14px;height:14px;}
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

  // Aplica zoom no preview em tempo real
  const preview = section.querySelector('#selfiePreview');
  if (preview){
    preview.style.setProperty('--zoomAll', a);
    preview.style.setProperty('--zoomX', x);
    preview.style.setProperty('--zoomY', y);
  }
};
zoomAll.oninput = update;
zoomX.oninput = update;
zoomY.oninput = update;
update();

  // ---------- Botões ----------
  function ensureButtons(section) {
    if (section.querySelector('#selfieButtons')) return;

    const css = document.createElement('style');
    css.textContent = `
      #selfieButtons{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
      gap:8px;margin:8px auto;width:92%;max-width:820px}
      #selfieButtons .btn{height:36px;line-height:36px;padding:0 10px;font-size:14px;border-radius:10px;
      box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s}
      #selfieButtons .btn:disabled{opacity:0.5;cursor:not-allowed}
    `;
    document.head.appendChild(css);

    const div = document.createElement('div');
    div.id = 'selfieButtons';
    div.innerHTML = `
      <button id="btn-prev" class="btn btn-stone-espinhos">Prévia</button>
      <button id="btn-retake" class="btn btn-stone-espinhos" disabled>Tirar outra</button>
      <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>`;
    section.appendChild(div);
  }

  // ---------- Pular Selfie ----------
  function onSkip() {
    if (global.JC?.show) global.JC.show('section-card');
    else if (global.showSection) global.showSection('section-card');
  }

  // ---------- Prévia (vídeo/canvas/máscara) ----------
  function ensurePreview(section){
  if (section.querySelector('#selfiePreview')) return;

  const wrap = document.createElement('div');
  wrap.id = 'selfiePreview';
  wrap.className = 'offline';
  wrap.innerHTML = `
    <video id="selfieVideo" playsinline autoplay muted></video>
    <canvas id="selfieCanvas"></canvas>
    <!-- Guia da chama para enquadro -->
    <img id="selfieGuide" alt="guia" src="/assets/img/chama-card.png"/>
    <!-- Máscara/moldura final -->
    <img id="selfieMask" alt="moldura" src="/assets/img/chama-card.png"/>
  `;
  section.appendChild(wrap);
}

  // ---------- Câmera ----------
  let __selfieStream = null;

  async function startCamera(section){
    try{
      stopCamera();
      __selfieStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
      const video = section.querySelector('#selfieVideo');
      if (video){
        video.srcObject = __selfieStream;
        await video.play().catch(()=>{});
      }
      section.querySelector('#selfiePreview')?.classList.remove('offline');

      // estados iniciais
      const btnPrev = section.querySelector('#btn-prev');
      const btnRetake = section.querySelector('#btn-retake');
      const btnConfirm = section.querySelector('#btn-confirm');
      btnPrev && (btnPrev.disabled = false);
      btnRetake && (btnRetake.disabled = true);
      btnConfirm && (btnConfirm.disabled = true);

      // vídeo visível, canvas oculto
      const cvs = section.querySelector('#selfieCanvas');
      if (cvs) cvs.style.display = 'none';
      const vid = section.querySelector('#selfieVideo');
      if (vid) vid.style.display = 'block';

    } catch(err){
      console.error('[Selfie] getUserMedia erro:', err);
      section.querySelector('#selfiePreview')?.classList.add('offline');
      toast('Permita o acesso à câmera para tirar sua foto.');
    }
  }

  function stopCamera(){
    if (__selfieStream){
      __selfieStream.getTracks().forEach(t => t.stop());
      __selfieStream = null;
    }
  }

  // ---------- Captura ----------
  function captureFrame(section){
    const video = section.querySelector('#selfieVideo');
    const canvas = section.querySelector('#selfieCanvas');
    if (!video || !canvas) return;

    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);

    // troca visibilidade
    video.style.display = 'none';
    canvas.style.display = 'block';

    // habilita retake/confirm
    const btnPrev = section.querySelector('#btn-prev');
    const btnRetake = section.querySelector('#btn-retake');
    const btnConfirm = section.querySelector('#btn-confirm');
    btnPrev && (btnPrev.disabled = true);
    btnRetake && (btnRetake.disabled = false);
    btnConfirm && (btnConfirm.disabled = false);
  }

  // ---------- Retomar ----------
  async function retake(section){
    const canvas = section.querySelector('#selfieCanvas');
    const video = section.querySelector('#selfieVideo');
    if (canvas) canvas.style.display = 'none';
    if (video) video.style.display = 'block';
    await startCamera(section);
  }

  // ---------- Confirmar ----------
  function confirmSelfie(section){
    const canvas = section.querySelector('#selfieCanvas');
    if (!canvas || canvas.style.display === 'none'){
      toast('Tire a prévia primeiro.');
      return;
    }
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    try{
      global.JC = global.JC || {};
      JC.data = JC.data || {};
      JC.data.selfieDataUrl = dataUrl;
      localStorage.setItem('jc.selfie', dataUrl);
    }catch{}

    if (global.JC?.show) global.JC.show('section-card');
    else if (global.showSection) global.showSection('section-card');
  }

  // ---------- Ordem fixa (Header → Texto → Controles → Botões → Prévia) ----------
  function enforceOrder(section) {
    const order = [
      '.selfie-header',
      '#selfieOrientWrap',
      '#selfieControls',
      '#selfieButtons',
      '#selfiePreview'
    ];
    let prev = null;
    order.forEach(sel => {
      const el = section.querySelector(sel);
      if (el && prev && el.previousElementSibling !== prev) {
        el.remove();
        placeAfter(prev, el);
      }
      if (el) prev = el;
    });
  }

  let orderObserver = null;
  function startOrderObserver(section) {
    if (orderObserver) orderObserver.disconnect();
    orderObserver = new MutationObserver(() => enforceOrder(section));
    orderObserver.observe(section, { childList: true, subtree: true });
    setTimeout(() => orderObserver && orderObserver.disconnect(), 3000);
  }

  // ---------- Play ----------
  async function play(section) {
    const header = ensureHeader(section);
    const title = header.querySelector('h2');
    if (title?.dataset?.typing === 'true') {
      startTyping(title, title.dataset.text || title.textContent || '', +title.dataset.speed || 40);
      speak(title.dataset.text || title.textContent || '');
    }

    ensureTexto(section);     // texto com microdelay
    ensureControls(section);  // sliders
    ensureButtons(section);   // botões
    ensurePreview(section);   // vídeo/canvas/máscara
    await sleep(80);
    startOrderObserver(section);
    enforceOrder(section);

     // Câmera + eventos (somente se o container existe)
 if (section.querySelector('#selfiePreview')) {
   await startCamera(section);
 } else {
   console.warn('[Selfie] #selfiePreview não encontrado — recriando…');
   ensurePreview(section);
   await startCamera(section);
 }
    const btnPrev = section.querySelector('#btn-prev');
    const btnRetake = section.querySelector('#btn-retake');
    const btnConfirm = section.querySelector('#btn-confirm');

    if (btnPrev && !btnPrev.__wired){
      btnPrev.__wired = true;
      btnPrev.addEventListener('click', () => captureFrame(section));
    }
    if (btnRetake && !btnRetake.__wired){
      btnRetake.__wired = true;
      btnRetake.addEventListener('click', () => retake(section));
    }
    if (btnConfirm && !btnConfirm.__wired){
      btnConfirm.__wired = true;
      btnConfirm.addEventListener('click', () => confirmSelfie(section));
    }
  }

  // ---------- Init ----------
  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      await play(section);
    } catch (err) {
      console.error('Erro ao carregar section-selfie:', err);
    }
  }

  document.addEventListener('sectionLoaded', e => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });

  // Para a câmera quando sair da seção (se houver esse evento no seu controller)
  document.addEventListener('sectionWillHide', e => {
    if (e?.detail?.sectionId === 'section-selfie') stopCamera();
  });

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
