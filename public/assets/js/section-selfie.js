/* /assets/js/section-selfie.js — FASE 1.1
   Datilografia + Leitura garantida (TTS fallback).
   Ordem de TTS: window.TTS.speak -> TypingBridge.speak -> speechSynthesis.
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase1_bound) {
    console.log('[Selfie:F1.1] Já inicializado, ignorando.');
    return;
  }
  NS.__phase1_bound = true;

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
    // interrompe qualquer fala atual
    try { speechSynthesis.cancel(); } catch {}
    const utter = new SpeechSynthesisUtterance(text);
    const voices = await waitVoices();
    // tenta pt-BR -> pt-PT -> default
    const pick = voices.find(v => /pt[-_]?BR/i.test(v.lang))
              || voices.find(v => /pt([-_]?PT)?/i.test(v.lang))
              || voices[0];
    if (pick) utter.voice = pick;
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;
    return new Promise(res => {
      utter.onend = res;
      speechSynthesis.speak(utter);
    });
  }

  async function trySpeak(text, label = '') {
    if (!text || (global.isMuted === true)) {
      console.log('[Selfie:F1.1] TTS ignorado (sem texto ou isMuted).');
      return;
    }
    // 1) TTS módulo próprio (se existir)
    if (global.TTS && typeof global.TTS.speak === 'function') {
      console.log('[Selfie:F1.1] TTS via window.TTS.speak()', label);
      try { await global.TTS.speak(text); return; } catch (e) { console.warn('TTS(window.TTS) falhou', e); }
    }
    // 2) TypingBridge.speak (se existir)
    if (global.TypingBridge && typeof global.TypingBridge.speak === 'function') {
      console.log('[Selfie:F1.1] TTS via TypingBridge.speak()', label);
      try { await global.TypingBridge.speak(text); return; } catch (e) { console.warn('TTS(TypingBridge) falhou', e); }
    }
    // 3) Web Speech API
    try {
      console.log('[Selfie:F1.1] TTS via Web Speech API', label);
      await speakWithWebSpeech(text);
    } catch (e) {
      console.warn('[Selfie:F1.1] Web Speech TTS falhou:', e);
    }
  }

  // ---------- Typing ----------
  function estimateTypingMs(text, speed) {
    return Math.max(400, text.length * speed) + 300;
  }

  async function runTyping(el) {
    if (!el) return;
    const text = (el.getAttribute('data-text') || el.textContent || '').trim();
    const speed = Number(el.getAttribute('data-speed') || 30);
    const cursor = el.getAttribute('data-cursor') !== 'false';
    const wantsTTS = el.getAttribute('data-tts') !== 'false'; // pode desativar com data-tts="false"

    // Se houver TypingBridge, usa; senão, fallback vanilla
    if (global.TypingBridge && typeof global.TypingBridge.runTyping === 'function') {
      try {
        global.TypingBridge.runTyping(el, { speed, cursor });
        await new Promise(r => setTimeout(r, estimateTypingMs(text, speed)));
      } catch (e) {
        console.warn('[Selfie:F1.1] TypingBridge falhou, usando fallback:', e);
        await fallbackType(el, text, speed, cursor);
      }
    } else {
      await fallbackType(el, text, speed, cursor);
    }

    // dispara TTS após digitação
    if (wantsTTS) await trySpeak(text, '[runTyping]');
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

  // ---------- DOM helpers ----------
  function ensureOrientationParagraph(section) {
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
      const nome = (global.JC && global.JC.data && global.JC.data.participantName) ? global.JC.data.participantName : 'AMOR';
      orient.setAttribute('data-text', `${nome}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`);
      orient.style.cssText = 'background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto 10px;width:90%;';
      block.appendChild(orient);
      const header = section.querySelector('.selfie-header') || section.firstElementChild;
      (header?.nextSibling ? container.insertBefore(block, header.nextSibling) : container.appendChild(block));
    } else {
      // garante atributos pro typing/tts
      orient.setAttribute('data-typing', 'true');
      orient.setAttribute('data-cursor', 'true');
      orient.setAttribute('data-speed', orient.getAttribute('data-speed') || '28');
      if (!orient.hasAttribute('data-text')) orient.setAttribute('data-text', orient.textContent.trim());
      if (!orient.hasAttribute('data-tts')) orient.setAttribute('data-tts', 'true');
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
      h2.setAttribute('data-tts', 'true'); // ler também o título
    }
    return h2;
  }

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
        console.log('[Selfie:F1.1] Já concluído nesta seção.');
        return;
      }
      console.log('[Selfie:F1.1] Iniciando datilografia + TTS…');

      const titleEl  = ensureTitleTyping(section);
      const orientEl = ensureOrientationParagraph(section);

      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      await runTyping(titleEl);
      await runTyping(orientEl);

      section.__selfie_phase1_done = true;
      const ev = new CustomEvent('selfie:phase1:done', { detail: { sectionId: 'section-selfie' } });
      section.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log('[Selfie:F1.1] Concluído (typing + leitura).');
    } catch (e) {
      console.warn('[Selfie:F1.1] Erro na fase 1.1:', e);
    }
  }

  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      playPhase1(section);
    } catch (e) {
      console.warn('[Selfie:F1.1] #section-selfie não encontrado:', e.message);
    }
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
