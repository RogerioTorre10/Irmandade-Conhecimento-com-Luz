/* /assets/js/section-selfie.js — FASE 1.2
   Datilografia + Leitura com nome do participante integrado.
   - busca nome em window.JC.data.nome (ou participantName) e localStorage
   - normaliza para MAIÚSCULAS
   - usa no texto de orientação
   - mantém TTS com fallback (window.TTS -> TypingBridge -> Web Speech)
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase1_bound) {
    console.log('[Selfie:F1.2] Já inicializado, ignorando.');
    return;
  }
  NS.__phase1_bound = true;

  // ---------- Nome do participante (única fonte da verdade) ----------
  function getUpperName() {
    // 1) tenta no estado global
    const jc = (global.JC && global.JC.data) ? global.JC.data : {};
    let name = jc.nome || jc.participantName;

    // 2) tenta no localStorage (se você estiver salvando lá em alguma página)
    if (!name) {
      try {
        const ls = localStorage.getItem('jc.nome') || localStorage.getItem('jc.participantName');
        if (ls) name = ls;
      } catch {}
    }

    // 3) fallback
    if (!name || typeof name !== 'string') name = 'AMOR';

    // padroniza MAIÚSCULAS
    const upper = name.toUpperCase().trim();

    // sincroniza de volta (padrão único)
    try {
      global.JC = global.JC || {};
      global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper;
      global.JC.data.participantName = upper; // manter compatibilidade
      // opcional: gravar para refresh
      try { localStorage.setItem('jc.nome', upper); } catch {}
    } catch {}

    return upper;
  }

  // ---------- Utils DOM ----------
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
      console.log('[Selfie:F1.2] TTS ignorado (sem texto ou isMuted).');
      return;
    }
    // 1) TTS módulo próprio
    if (global.TTS && typeof global.TTS.speak === 'function') {
      console.log('[Selfie:F1.2] TTS via window.TTS.speak()', label);
      try { await global.TTS.speak(text); return; } catch (e) { console.warn('TTS(window.TTS) falhou', e); }
    }
    // 2) TypingBridge.speak
    if (global.TypingBridge && typeof global.TypingBridge.speak === 'function') {
      console.log('[Selfie:F1.2] TTS via TypingBridge.speak()', label);
      try { await global.TypingBridge.speak(text); return; } catch (e) { console.warn('TTS(TypingBridge) falhou', e); }
    }
    // 3) Web Speech API
    try {
      console.log('[Selfie:F1.2] TTS via Web Speech API', label);
      await speakWithWebSpeech(text);
    } catch (e) {
      console.warn('[Selfie:F1.2] Web Speech TTS falhou:', e);
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
        console.warn('[Selfie:F1.2] TypingBridge falhou, usando fallback:', e);
        await fallbackType(el, text, speed, cursor);
      }
    } else {
      await fallbackType(el, text, speed, cursor);
    }

    if (wantsTTS) await trySpeak(text, '[runTyping]');
  }

  // ---------- Geração de elementos com o nome ----------
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
      // atualiza texto com o nome (sempre MAIÚSCULAS)
      const baseText = orient.getAttribute('data-text') || orient.textContent || '';
      const msg = baseText.replace(/\{\{\s*(nome|name)\s*\}\}/gi, getUpperName());
      orient.setAttribute('data-typing', 'true');
      orient.setAttribute('data-tts', 'true');
      orient.setAttribute('data-speed', orient.getAttribute('data-speed') || '28');
      orient.setAttribute('data-text', msg || `${getUpperName()}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`);
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

  // ---------- Fase 1.2 ----------
  async function playPhase1(section) {
    try {
      if (!isVisible(section)) {
        const mo = new MutationObserver(() => {
          if (isVisible(section)) { mo.disconnect(); playPhase1(section); }
        });
        mo.observe(section, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
        return;
      }
      if (section.__selfie_phase1_done) {
        console.log('[Selfie:F1.2] Já concluído nesta seção.');
        return;
      }
      console.log('[Selfie:F1.2] Iniciando datilografia + TTS com nome…');

      const titleEl  = ensureTitleTyping(section);
      const orientEl = ensureOrientationParagraph(section);

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      await runTyping(titleEl);
      await runTyping(orientEl);

      section.__selfie_phase1_done = true;
      const ev = new CustomEvent('selfie:phase1:done', { detail: { sectionId: 'section-selfie' } });
      section.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log('[Selfie:F1.2] Concluído (typing + leitura com nome).');
    } catch (e) {
      console.warn('[Selfie:F1.2] Erro na fase 1.2:', e);
    }
  }

  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      playPhase1(section);
    } catch (e) {
      console.warn('[Selfie:F1.2] #section-selfie não encontrado:', e.message);
    }
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
