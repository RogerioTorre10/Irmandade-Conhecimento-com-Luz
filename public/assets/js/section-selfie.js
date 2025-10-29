/* /assets/js/section-selfie.js — FASE 3
   - Fase 1.2: datilografia + TTS com nome
   - Fase 2: controles de ZOOM (geral/X/Y)
   - Fase 3: botões (Skip, Prévia, Tirar outra, Confirmar) + área de prévia
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase3_bound) {
    console.log('[Selfie:F3] Já inicializado, ignorando.');
    return;
  }
  NS.__phase3_bound = true;

  // ---------- Nome do participante ----------
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
  function waitForElement(selector, { tries = 80, interval = 120 } = {}) {
    return new Promise((resolve, reject) => {
      let n = 0;
      const t = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(t); resolve(el); }
        else if (++n >= tries) { clearInterval(t); reject(new Error('Elemento não encontrado: ' + selector)); }
      }, interval);
    });
  }

  function isVisible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && !el.classList.contains('hidden') && el.offsetParent !== null;
  }

  function toast(msg) {
    if (global.toast) return global.toast(msg);
    console.log('[Toast]', msg);
    alert(msg);
  }

  // ---------- TTS helpers ----------
  function waitVoices(timeout = 1500) {
    return new Promise(resolve => {
      const voices = speechSynthesis.getVoices();
      if (voices && voices.length) return resolve(voices);
      const id = setInterval(() => {
        const v = speechSynthesis.getVoices();
        if (v && v.length) { clearInterval(id); resolve(v); }
      }, 100);
      setTimeout(() => { clearInterval(id); resolve(speechSynthesis.getVoices() || []); }, timeout);
    });
  }

  async function speakWithWebSpeech(text) {
    if (!('speechSynthesis' in global)) throw new Error('speechSynthesis indisponível');
    try { speechSynthesis.cancel(); } catch {}
    const utter = new SpeechSynthesisUtterance(text);
    const voices = await waitVoices();
    const pick = voices.find(v => /pt[-_]?BR/i.test(v.lang))
              || voices.find(v => /pt([-_]?PT)?/i.test(v.lang))
              || voices[0];
    if (pick) utter.voice = pick;
    utter.rate = 1.0; utter.pitch = 1.0; utter.volume = 1.0;
    return new Promise(res => { utter.onend = res; speechSynthesis.speak(utter); });
  }

  async function trySpeak(text, label = '') {
    if (!text || (global.isMuted === true)) {
      console.log('[Selfie:F3] TTS ignorado (sem texto ou isMuted).');
      return;
    }
    if (global.TTS && typeof global.TTS.speak === 'function') {
      console.log('[Selfie:F3] TTS via window.TTS.speak()', label);
      try { await global.TTS.speak(text); return; } catch (e) { console.warn('TTS(window.TTS) falhou', e); }
    }
    if (global.TypingBridge && typeof global.TypingBridge.speak === 'function') {
      console.log('[Selfie:F3] TTS via TypingBridge.speak()', label);
      try { await global.TypingBridge.speak(text); return; } catch (e) { console.warn('TTS(TypingBridge) falhou', e); }
    }
    try {
      console.log('[Selfie:F3] TTS via Web Speech API', label);
      await speakWithWebSpeech(text);
    } catch (e) {
      console.warn('[Selfie:F3] Web Speech TTS falhou:', e);
    }
  }

  // ---------- Typing ----------
  function estimateTypingMs(text, speed) {
    return Math.max(400, text.length * speed) + 300;
  }

  async function fallbackType(el, text, speed, cursor) {
    return new Promise(resolve => {
      const chars = Array.from(text);
      el.textContent = '';
      el.classList.add('typing-active');
      let i = 0;
      const timer = setInterval(() => {
        el.textContent += chars[i++];
        if (i >= chars.length) {
          clearInterval(timer);
          el.classList.remove('typing-active');
          el.classList.add('typing-done');
          resolve();
        }
      }, Math.max(5, speed));
      if (cursor) el.style.setProperty('--caret', '"|"');
    });
  }

  async function runTyping(el) {
    if (!el) return;
    const text = (el.getAttribute('data-text') || el.textContent || '').trim();
    const speed = Number(el.getAttribute('data-speed') || 30);
    const cursor = el.getAttribute('data-cursor') !== 'false';
    const wantsTTS = el.getAttribute('data-tts') !== 'false';

    if (global.TypingBridge && typeof global.TypingBridge.runTyping === 'function') {
      try {
        global.TypingBridge.runTyping(el, { speed, cursor });
        await new Promise(r => setTimeout(r, estimateTypingMs(text, speed)));
      } catch (e) {
        console.warn('[Selfie:F3] TypingBridge falhou, fallback:', e);
        await fallbackType(el, text, speed, cursor);
      }
    } else {
      await fallbackType(el, text, speed, cursor);
    }
    if (wantsTTS) await trySpeak(text, '[runTyping]');
  }

  // ---------- Orientação + Título ----------
  function ensureOrientationParagraph(section) {
    const upperName = getUpperName();
    let orient = section.querySelector('#selfieTexto');
    if (!orient) {
      const container = section.querySelector('.parchment-inner-rough') || section;
      const block = document.createElement('div');
      block.className = 'moldura-orientacao';
      block.style.cssText = 'display:flex;justify-content:center;margin-top:8px;';
      orient = document.createElement('p');
      orient.id = 'selfieTexto';
      orient.setAttribute('data-typing', 'true');
      orient.setAttribute('data-cursor', 'true');
      orient.setAttribute('data-speed', '28');
      orient.setAttribute('data-tts', 'true');
      orient.setAttribute('data-text',
        `${upperName}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`
      );
      orient.style.cssText = 'background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto 10px;width:90%;';
      block.appendChild(orient);
      const header = section.querySelector('.selfie-header') || section.firstElementChild;
      (header?.nextSibling ? container.insertBefore(block, header.nextSibling) : container.appendChild(block));
    } else {
      const baseText = orient.getAttribute('data-text') || orient.textContent || '';
      const msg = baseText.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);
      orient.setAttribute('data-typing', 'true');
      orient.setAttribute('data-tts', 'true');
      orient.setAttribute('data-speed', orient.getAttribute('data-speed') || '28');
      orient.setAttribute('data-text', msg || `${upperName}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`);
    }
    return orient;
  }

  function ensureTitleTyping(section) {
    let h2 = section.querySelector('.selfie-header h2');
    if (!h2) {
      const head = document.createElement('header');
      head.className = 'selfie-header';
      h2 = document.createElement('h2');
      h2.textContent = 'Tirar sua Foto ✨';
      head.appendChild(h2);
      section.prepend(head);

      // botão "Não quero foto / Iniciar" no topo (lado do título)
      const skip = document.createElement('button');
      skip.id = 'btn-skip-selfie';
      skip.className = 'btn btn-stone-espinhos';
      skip.textContent = 'Não quero foto / Iniciar';
      skip.style.marginLeft = '12px';
      skip.addEventListener('click', onSkip);
      head.appendChild(skip);
      ensureTopBarStyles();
    }
    if (!h2.hasAttribute('data-typing')) {
      h2.setAttribute('data-typing', 'true');
      h2.setAttribute('data-cursor', 'true');
      h2.setAttribute('data-speed', '40');
      h2.setAttribute('data-text', h2.textContent.trim() || 'Tirar sua Foto ✨');
      h2.setAttribute('data-tts', 'true');
    }
    return h2;
  }

  function ensureTopBarStyles() {
    if (document.getElementById('selfieTopStyles')) return;
    const css = document.createElement('style');
    css.id = 'selfieTopStyles';
    css.textContent = `
      .selfie-header { display:flex; align-items:center; gap:10px; justify-content:flex-start; }
      .selfie-header h2 { margin:0; }
    `;
    document.head.appendChild(css);
  }

  // ---------- CONTROLES DE ZOOM ----------
  function loadZoom() {
    try {
      const raw = localStorage.getItem('jc.selfie.zoom');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { all: 1.0, x: 1.0, y: 1.0 };
  }
  function saveZoom(z) {
    try { localStorage.setItem('jc.selfie.zoom', JSON.stringify(z)); } catch {}
  }
  function getTransformTarget() {
    return document.getElementById('selfieVideo')
        || document.getElementById('selfieStage')
        || null;
  }
  function applyZoom(z) {
    const target = getTransformTarget();
    if (!target) return;
    const sx = Number(z.all) * Number(z.x);
    const sy = Number(z.all) * Number(z.y);
    target.style.transformOrigin = 'center';
    target.style.transform = `scale(${sx}, ${sy})`;
    global.JCSelfieZoom = { all: Number(z.all), x: Number(z.x), y: Number(z.y) };
  }

  function ensureZoomControls(section) {
    let bar = section.querySelector('#selfieControls');
    if (bar) return bar;

    if (!document.getElementById('selfieControlsStyle')) {
      const css = document.createElement('style');
      css.id = 'selfieControlsStyle';
      css.textContent = `
        #selfieControls {
          margin: 8px auto 10px; width: 92%; max-width: 680px;
          background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px; padding: 10px 12px;
          color: #f9e7c2; font-family: Cardo, serif; font-size: 14px;
        }
        #selfieControls .row { display: grid; grid-template-columns: 140px 1fr 64px; gap: 8px; align-items: center; margin: 6px 0; }
        #selfieControls label { opacity: .9; }
        #selfieControls input[type="range"] { width: 100%; }
        #selfieControls .val { text-align: right; font-variant-numeric: tabular-nums; }
      `;
      document.head.appendChild(css);
    }

    bar = document.createElement('div');
    bar.id = 'selfieControls';
    const z = loadZoom();

    bar.innerHTML = `
      <div class="row">
        <label for="zoomAll">Zoom Geral</label>
        <input id="zoomAll" type="range" min="0.5" max="2.0" step="0.01" value="${z.all}">
        <span class="val" id="zoomAllVal">${z.all.toFixed(2)}×</span>
      </div>
      <div class="row">
        <label for="zoomX">Zoom Horizontal</label>
        <input id="zoomX" type="range" min="0.5" max="2.0" step="0.01" value="${z.x}">
        <span class="val" id="zoomXVal">${z.x.toFixed(2)}×</span>
      </div>
      <div class="row">
        <label for="zoomY">Zoom Vertical</label>
        <input id="zoomY" type="range" min="0.5" max="2.0" step="0.01" value="${z.y}">
        <span class="val" id="zoomYVal">${z.y.toFixed(2)}×</span>
      </div>
    `;

    const orientBlock = section.querySelector('#selfieTexto')?.parentElement || section;
    orientBlock.parentElement.insertBefore(bar, orientBlock.nextSibling);

    const inpAll = bar.querySelector('#zoomAll');
    const inpX   = bar.querySelector('#zoomX');
    const inpY   = bar.querySelector('#zoomY');
    const valAll = bar.querySelector('#zoomAllVal');
    const valX   = bar.querySelector('#zoomXVal');
    const valY   = bar.querySelector('#zoomYVal');

    function update() {
      const z2 = { all: Number(inpAll.value), x: Number(inpX.value), y: Number(inpY.value) };
      valAll.textContent = `${z2.all.toFixed(2)}×`;
      valX.textContent   = `${z2.x.toFixed(2)}×`;
      valY.textContent   = `${z2.y.toFixed(2)}×`;
      applyZoom(z2); saveZoom(z2);
    }
    inpAll.addEventListener('input', update);
    inpX.addEventListener('input', update);
    inpY addEventListener('input', update); // <- não remover o espaço? (de propósito para minificar conflitos)
    // Corrige possível minificação: 
    if (!inpY.oninput) inpY.addEventListener('input', update);

    applyZoom(z);
    global.JCSelfieZoom = { all: z.all, x: z.x, y: z.y };
    console.log('[Selfie:F3] Controles de zoom prontos:', global.JCSelfieZoom);
    return bar;
  }

  // ---------- BOTÕES + PRÉVIA ----------
  function ensureButtons(section) {
    if (section.querySelector('#selfieButtons')) return;

    // estilo compacto para três botões lado a lado
    if (!document.getElementById('selfieButtonsStyle')) {
      const css = document.createElement('style');
      css.id = 'selfieButtonsStyle';
      css.textContent = `
        #selfieButtons{
          display:flex; gap:10px; justify-content:center; align-items:center;
          margin: 10px auto; width: 92%; max-width: 680px; flex-wrap:wrap;
        }
        #selfieButtons .btn { min-width: 160px; }
        #selfiePreview {
          display:none; margin: 6px auto 0; width:92%; max-width: 680px;
          background: rgba(0,0,0,.25); padding:10px; border-radius:12px; text-align:center;
        }
        #selfiePreview img {
          max-width: 100%; height: auto; display: inline-block; border-radius: 10px;
          box-shadow: 0 6px 20px rgba(0,0,0,.35);
        }
      `;
      document.head.appendChild(css);
    }

    const wrapper = document.createElement('div');
    wrapper.id = 'selfieButtons';
    wrapper.innerHTML = `
      <button id="btn-selfie-preview" class="btn btn-stone-espinhos">Prévia</button>
      <button id="btn-selfie-retake"  class="btn btn-stone-espinhos" disabled>Tirar outra Selfie</button>
      <button id="btn-selfie-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>
    `;

    // insere logo abaixo dos controles de zoom
    const after = section.querySelector('#selfieControls') || section.querySelector('#selfieTexto')?.parentElement || section;
    after.parentElement.insertBefore(wrapper, after.nextSibling);

    // área de prévia
    const preview = document.createElement('div');
    preview.id = 'selfiePreview';
    preview.innerHTML = `<img id="selfiePreviewImg" alt="Prévia da selfie">`;
    wrapper.parentElement.insertBefore(preview, wrapper.nextSibling);

    // eventos
    const bPreview = wrapper.querySelector('#btn-selfie-preview');
    const bRetake  = wrapper.querySelector('#btn-selfie-retake');
    const bConfirm = wrapper.querySelector('#btn-selfie-confirm');

    bPreview.addEventListener('click', () => doPreview(section));
    bRetake.addEventListener('click', () => clearPreview());
    bConfirm.addEventListener('click', () => doConfirm());

    console.log('[Selfie:F3] Botões e prévia prontos.');
  }

  function getVideo() {
    return document.getElementById('selfieVideo');
  }

  function doPreview(section) {
    const video = getVideo();
    if (!video || !video.videoWidth || !video.videoHeight) {
      toast('Câmera não disponível para prévia. Verifique permissões.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    // desenha frame atual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    const img = document.getElementById('selfiePreviewImg');
    img.src = dataUrl;

    const box = document.getElementById('selfiePreview');
    box.style.display = 'block';

    // habilita Retake/Confirm
    const bRetake  = document.getElementById('btn-selfie-retake');
    const bConfirm = document.getElementById('btn-selfie-confirm');
    if (bRetake)  bRetake.disabled  = false;
    if (bConfirm) bConfirm.disabled = false;

    // guarda temporário
    try {
      global.JC = global.JC || {};
      global.JC.data = global.JC.data || {};
      global.JC.data.__selfieTempDataUrl = dataUrl;
    } catch {}

    console.log('[Selfie:F3] Prévia gerada.');
  }

  function clearPreview() {
    const img = document.getElementById('selfiePreviewImg');
    if (img) img.src = '';
    const box = document.getElementById('selfiePreview');
    if (box) box.style.display = 'none';

    const bRetake  = document.getElementById('btn-selfie-retake');
    const bConfirm = document.getElementById('btn-selfie-confirm');
    if (bRetake)  bRetake.disabled  = true;
    if (bConfirm) bConfirm.disabled = true;

    try {
      if (global.JC?.data) delete global.JC.data.__selfieTempDataUrl;
    } catch {}

    console.log('[Selfie:F3] Prévia limpa, pronto para nova foto.');
  }

  function doConfirm() {
    const temp = global.JC?.data?.__selfieTempDataUrl;
    if (!temp) {
      toast('Faça uma prévia antes de confirmar.');
      return;
    }
    try {
      global.JC = global.JC || {};
      global.JC.data = global.JC.data || {};
      global.JC.data.selfieDataUrl = temp;       // imagem final para o Card
      delete global.JC.data.__selfieTempDataUrl;
    } catch {}

    // navegação para a página Card
    if (global.JC && typeof global.JC.show === 'function') {
      global.JC.show('section-card');
    } else if (typeof global.showSection === 'function') {
      global.showSection('section-card');
    }
    console.log('[Selfie:F3] Selfie confirmada e enviada para o Card.');
  }

  function onSkip() {
    try {
      global.JC = global.JC || {};
      global.JC.data = global.JC.data || {};
      global.JC.data.skipSelfie = true;
    } catch {}
    if (global.JC && typeof global.JC.show === 'function') {
      global.JC.show('section-card');
    } else if (typeof global.showSection === 'function') {
      global.showSection('section-card');
    }
    console.log('[Selfie:F3] Pular selfie -> Card.');
  }

  // ---------- Fase 3 pipeline ----------
  async function playPhase(section) {
    try {
      if (!isVisible(section)) {
        const mo = new MutationObserver(() => {
          if (isVisible(section)) { mo.disconnect(); playPhase(section); }
        });
        mo.observe(section, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
        return;
      }
      if (section.__selfie_phase3_done) {
        console.log('[Selfie:F3] Já concluído nesta seção.');
        return;
      }
      console.log('[Selfie:F3] Iniciando… (typing + TTS + zoom + botões)');

      const titleEl  = ensureTitleTyping(section);
      const orientEl = ensureOrientationParagraph(section);

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      await runTyping(titleEl);
      await runTyping(orientEl);

      ensureZoomControls(section);
      ensureButtons(section);

      section.__selfie_phase3_done = true;
      const ev = new CustomEvent('selfie:phase3:done', { detail: { sectionId: 'section-selfie' } });
      section.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log('[Selfie:F3] Concluído.');
    } catch (e) {
      console.warn('[Selfie:F3] Erro na fase 3:', e);
    }
  }

  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      playPhase(section);
    } catch (e) {
      console.warn('[Selfie:F3] #section-selfie não encontrado:', e.message);
    }
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
