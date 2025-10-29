/* /assets/js/section-selfie.js — FASE 2
   - Fase 1.2: datilografia + TTS com nome (mantido)
   - + Controles de ZOOM (geral, horizontal X, vertical Y)
   - Persistência em localStorage e export em window.JCSelfieZoom
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase2_bound) {
    console.log('[Selfie:F2] Já inicializado, ignorando.');
    return;
  }
  NS.__phase2_bound = true;

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
      console.log('[Selfie:F2] TTS ignorado (sem texto ou isMuted).');
      return;
    }
    if (global.TTS && typeof global.TTS.speak === 'function') {
      console.log('[Selfie:F2] TTS via window.TTS.speak()', label);
      try { await global.TTS.speak(text); return; } catch (e) { console.warn('TTS(window.TTS) falhou', e); }
    }
    if (global.TypingBridge && typeof global.TypingBridge.speak === 'function') {
      console.log('[Selfie:F2] TTS via TypingBridge.speak()', label);
      try { await global.TypingBridge.speak(text); return; } catch (e) { console.warn('TTS(TypingBridge) falhou', e); }
    }
    try {
      console.log('[Selfie:F2] TTS via Web Speech API', label);
      await speakWithWebSpeech(text);
    } catch (e) {
      console.warn('[Selfie:F2] Web Speech TTS falhou:', e);
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
        console.warn('[Selfie:F2] TypingBridge falhou, fallback:', e);
        await fallbackType(el, text, speed, cursor);
      }
    } else {
      await fallbackType(el, text, speed, cursor);
    }
    if (wantsTTS) await trySpeak(text, '[runTyping]');
  }

  // ---------- DOM builders (título + orientação) ----------
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
    // Preferência: vídeo da câmera
    return document.getElementById('selfieVideo')
        || document.getElementById('selfieStage') // fallback no container
        || null;
  }
  function applyZoom(z) {
    const target = getTransformTarget();
    if (!target) return;
    const sx = Number(z.all) * Number(z.x);
    const sy = Number(z.all) * Number(z.y);
    const styleTarget = (target.tagName === 'VIDEO' ? target : target);
    styleTarget.style.transformOrigin = 'center';
    styleTarget.style.transform = `scale(${sx}, ${sy})`;
    global.JCSelfieZoom = { all: Number(z.all), x: Number(z.x), y: Number(z.y) };
  }

  function ensureControls(section) {
    let bar = section.querySelector('#selfieControls');
    if (bar) return bar;

    // pequena folha de estilo para a barra
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
    // valores iniciais
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

    // insere após o parágrafo de orientação
    const orientBlock = section.querySelector('#selfieTexto')?.parentElement || section;
    orientBlock.parentElement.insertBefore(bar, orientBlock.nextSibling);

    // listeners
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
      applyZoom(z2);
      saveZoom(z2);
    }

    inpAll.addEventListener('input', update);
    inpX.addEventListener('input', update);
    inpY.addEventListener('input', update);

    // aplica valores iniciais no alvo
    applyZoom(z);
    global.JCSelfieZoom = { all: z.all, x: z.x, y: z.y };

    console.log('[Selfie:F2] Controles de zoom prontos:', global.JCSelfieZoom);
    return bar;
  }

  // ---------- Fase 2 pipeline ----------
  async function playPhase(section) {
    try {
      if (!isVisible(section)) {
        const mo = new MutationObserver(() => {
          if (isVisible(section)) { mo.disconnect(); playPhase(section); }
        });
        mo.observe(section, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
        return;
      }
      if (section.__selfie_phase2_done) {
        console.log('[Selfie:F2] Já concluído nesta seção.');
        return;
      }
      console.log('[Selfie:F2] Iniciando… (typing + TTS + controles)');

      const titleEl  = ensureTitleTyping(section);
      const orientEl = ensureOrientationParagraph(section);

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      await runTyping(titleEl);
      await runTyping(orientEl);

      // cria barra de controles
      ensureControls(section);

      section.__selfie_phase2_done = true;
      const ev = new CustomEvent('selfie:phase2:done', { detail: { sectionId: 'section-selfie' } });
      section.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log('[Selfie:F2] Concluído (com controles de zoom).');
    } catch (e) {
      console.warn('[Selfie:F2] Erro na fase 2:', e);
    }
  }

  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      playPhase(section);
    } catch (e) {
      console.warn('[Selfie:F2] #section-selfie não encontrado:', e.message);
    }
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
