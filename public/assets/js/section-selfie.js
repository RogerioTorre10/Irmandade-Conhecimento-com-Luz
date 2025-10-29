/* /assets/js/section-selfie.js — FASE 1 + TTS robusto
   - Datilografia (TypingBridge se houver, fallback vanilla)
   - Leitura em voz alta (window.TTS.speak ou Web Speech API)
   - Desbloqueio de áudio no primeiro gesto do usuário
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase1_bound) {
    console.log('[Selfie:F1] Já inicializado, ignorando.');
    return;
  }
  NS.__phase1_bound = true;

  // ---------- Audio unlock (gesto do usuário) ----------
  let audioUnlocked = false;
  function ensureAudioUnlock() {
    if (audioUnlocked) return Promise.resolve(true);
    return new Promise((resolve) => {
      function unlock() {
        audioUnlocked = true;
        document.removeEventListener('click', unlock, true);
        document.removeEventListener('touchstart', unlock, true);
        resolve(true);
      }
      // se já houve interação recente
      if (document.hasFocus()) { audioUnlocked = true; return resolve(true); }
      document.addEventListener('click', unlock, true);
      document.addEventListener('touchstart', unlock, true);
      // timeout de segurança (alguns browsers liberam sem gesto)
      setTimeout(() => { if (!audioUnlocked) { audioUnlocked = true; resolve(true); }}, 1200);
    });
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

  // Fallback typewriter
  async function typewriter(el, text, speed = 30, cursor = true) {
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

    if (global.TypingBridge && typeof global.TypingBridge.runTyping === 'function') {
      try {
        global.TypingBridge.runTyping(el, { speed, cursor });
        const est = Math.max(400, text.length * speed) + 500;
        await new Promise(r => setTimeout(r, est));
        return;
      } catch (e) {
        console.warn('[Selfie:F1] TypingBridge falhou, usando fallback:', e);
      }
    }
    await typewriter(el, text, speed, cursor);
  }

  // ---------- TTS ----------
  function pickPtBrVoice() {
    const voices = (typeof speechSynthesis !== 'undefined') ? speechSynthesis.getVoices() : [];
    let v = voices.find(v => /pt-?BR/i.test(v.lang));
    if (!v) v = voices.find(v => /pt/i.test(v.lang));
    return v || voices[0] || null;
  }

  async function speakText(text) {
    if (!text) return;
    if (global.isMuted) { console.log('[Selfie:TTS] isMuted=true, pulando.'); return; }

    await ensureAudioUnlock();

    // 1) Se houver TTS próprio do projeto:
    if (global.TTS && typeof global.TTS.speak === 'function') {
      try {
        await global.TTS.speak(text, { lang: 'pt-BR', rate: 0.98, pitch: 1.02, volume: 1.0 });
        return;
      } catch (e) {
        console.warn('[Selfie:TTS] Falha no TTS custom, tentando Web Speech:', e);
      }
    }

    // 2) Web Speech API (nativo)
    if (typeof speechSynthesis !== 'undefined') {
      // alguns browsers precisam chamar getVoices depois de um setTimeout
      await new Promise(r => setTimeout(r, 150));
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickPtBrVoice();
      if (voice) utter.voice = voice;
      utter.lang = voice?.lang || 'pt-BR';
      utter.rate = 0.98;
      utter.pitch = 1.02;
      try {
        speechSynthesis.cancel(); // limpa fila
        speechSynthesis.speak(utter);
      } catch (e) {
        console.warn('[Selfie:TTS] speechSynthesis falhou:', e);
      }
    } else {
      console.log('[Selfie:TTS] speechSynthesis indisponível.');
    }
  }

  // ---------- Preparação de título e orientação ----------
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
      orient.setAttribute('data-text',
        (global.JC?.data?.participantName ? `${global.JC.data.participantName}, ` : 'AMOR, ') +
        'posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.'
      );
      orient.style.cssText = 'background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto 10px;width:90%;';
      block.appendChild(orient);
      const header = section.querySelector('.selfie-header') || section.firstElementChild;
      (header?.nextSibling ? container.insertBefore(block, header.nextSibling) : container.appendChild(block));
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
    }
    return h2;
  }

  // ---------- Sequência Fase 1 ----------
  async function playPhase1(section) {
    if (!isVisible(section)) {
      const mo = new MutationObserver(() => {
        if (isVisible(section)) { mo.disconnect(); playPhase1(section); }
      });
      mo.observe(section, { attributes: true, attributeFilter: ['class','style','aria-hidden'] });
      return;
    }
    if (section.__selfie_phase1_done) { console.log('[Selfie:F1] Já concluído.'); return; }

    console.log('[Selfie:F1] Iniciando datilografia…');

    const titleEl  = ensureTitleTyping(section);
    const orientEl = ensureOrientationParagraph(section);

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });

    await runTyping(titleEl);
    await runTyping(orientEl);

    // Dispara TTS do parágrafo (e do título, se quiser)
    const titleText  = (titleEl.getAttribute('data-text')  || titleEl.textContent || '').trim();
    const orientText = (orientEl.getAttribute('data-text') || orientEl.textContent || '').trim();
    // fale apenas o orientativo (mais útil)
    speakText(orientText);

    section.__selfie_phase1_done = true;

    const ev = new CustomEvent('selfie:phase1:done', { detail: { sectionId: 'section-selfie' } });
    section.dispatchEvent(ev);
    document.dispatchEvent(ev);
    console.log('[Selfie:F1] Concluído (typing + leitura).');
  }

  async function init() {
    try {
      const section = await waitForElement('#section-self
