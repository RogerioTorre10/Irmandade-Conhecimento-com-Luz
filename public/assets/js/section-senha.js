(function () {
  'use strict';

  // ===== Config =====
  const SECTION_ID       = 'section-senha';
  const PREV_SECTION_ID  = 'section-termos2';
  const NEXT_SECTION_ID  = 'section-guia';
  const HIDE_CLASS       = 'hidden';

  // Timings
  const TYPING_SPEED     = 36;
  const INITIAL_DELAY_MS = 200;
  const TTS_LATCH_MS     = 600;

  // Evita rebind
  if (window.JCSenha?.__bound) {
    console.log('[JCSenha] já carregado');
    return;
  }
  window.JCSenha = window.JCSenha || {};
  window.JCSenha.__bound = true;
  window.JCSenha.state = { ready: false, listenerOn: false };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q = (sel, root = document) => root.querySelector(sel);

 // 🔒 Espera qualquer vídeo de transição terminar
  async function waitForTransitionUnlock(timeoutMs = 10000) {
    if (!window.__TRANSITION_LOCK) return;
    let resolved = false;
    const p = new Promise(resolve => {
      const onEnd = () => { if (!resolved) { resolved = true; document.removeEventListener('transition:ended', onEnd); resolve(); } };
      document.addEventListener('transition:ended', onEnd, { once: true });
    });
    const t = new Promise(resolve => setTimeout(resolve, timeoutMs));
    await Promise.race([p, t]); // não fica preso para sempre
  }
  
  async function waitForElement(selector, { within = document, timeout = 8000, step = 100 } = {}) {
    const t0 = performance.now();
    return new Promise((resolve, reject) => {
      const loop = () => {
        const el = within.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - t0 >= timeout) return reject(new Error(`Timeout: ${selector}`));
        setTimeout(loop, step);
      };
      loop();
    });
  }
  
  const ensureVisible = (el) => {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
    el.style.zIndex = 'auto';
  };

  function normalizeParagraph(el) {
    if (!el) return false;
    const current = (el.textContent || '').trim();
    const ds = (el.dataset?.text || '').trim();
    const source = ds || current;
    if (!source) return false;
    el.dataset.text = source;
    if (!el.classList.contains('typing-done')) {
      el.textContent = '';
      el.classList.remove('typing-active', 'typing-done');
      delete el.dataset.spoken;
    }
    return true;
  }

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
      (function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else resolve();
      })();
    });
  }

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || el.textContent || '').trim();
    if (!text) return;

    window.G = window.G || {};
    const prevLock = !!window.G.__typingLock;
    window.G.__typingLock = true;

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise((resolve) => {
        try {
          window.runTyping(el, text, () => resolve(), { speed, cursor: true });
        } catch (e) {
          console.warn('[JCSenha] runTyping falhou, fallback local', e);
          usedFallback = true;
          resolve();
        }
      });
    } else {
      usedFallback = true;
    }
    if (usedFallback) await localType(el, text, speed);

    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    window.G.__typingLock = prevLock;

    if (speak && text && !el.dataset.spoken) {
      try {
        if (window.EffectCoordinator?.speak) {
          speechSynthesis.cancel();
          window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.08, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch (e) {
        console.error('[JCSenha] Erro no TTS:', e);
      }
    }
    await sleep(80);
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc)
        || (root?.dataset?.transitionSrc)
        || '/assets/videos/filme-senha-confirmada.mp4';
  }

  function saveSenha(value) {
    try {
      if (window.JC?.data) window.JC.data.senha = value;
      else {
        window.JCData = window.JCData || {};
        window.JCData.senha = value;
      }
    } catch {}
  }

  // ===== Core =====
  async function initOnce(root) {
    if (!root || root.dataset.senhaInitialized === 'true') return;
    root.dataset.senhaInitialized = 'true';
    ensureVisible(root);

    let instr1, instr2, instr3, instr4, input, toggle, btnNext, btnPrev;
    try {
      instr1 = await waitForElement('#senha-instr1', { within: root });
      instr2 = await waitForElement('#senha-instr2', { within: root });
      instr3 = await waitForElement('#senha-instr3', { within: root });
      instr4 = await waitForElement('#senha-instr4', { within: root });
      input  = await waitForElement('#senha-input',  { within: root });
      toggle = await waitForElement('.btn-toggle-senha', { within: root });
      btnNext= await waitForElement('#btn-senha-avancar', { within: root });
      btnPrev= await waitForElement('#btn-senha-prev',    { within: root });
    } catch (e) {
      console.error('[JCSenha] Elementos não encontrados:', e);
      window.toast?.('Erro: elementos da seção Senha não carregados.', 'error');
      return;
    }

    // trava durante a narrativa
    [btnPrev, btnNext, input, toggle].forEach(el => el?.setAttribute('disabled','true'));

    const seq = [instr1, instr2, instr3, instr4].filter(Boolean);
    seq.forEach(normalizeParagraph);

    await sleep(INITIAL_DELAY_MS);
    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true });
      }
    }

    // libera
    [btnPrev, btnNext, input, toggle].forEach(el => el?.removeAttribute('disabled'));
    input.focus();

    // olho mágico
    toggle.addEventListener('click', () => {
      const was = input.type;
      input.type = input.type === 'password' ? 'text' : 'password';
      console.log('[JCSenha] Olho mágico:', was, '→', input.type);
    });

    // voltar
    btnPrev.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      window.JC?.show?.(PREV_SECTION_ID) ?? history.back();
    });

    // avançar (valida + toca vídeo de transição)
    btnNext.addEventListener('click', () => {
      const value = (input.value || '').trim();
      if (!value) {
        window.toast?.('Por favor, digite sua senha para continuar.', 'warning');
        input.focus();
        return;
      }
      saveSenha(value);
      input.type = 'password';
      [btnNext, input, toggle].forEach(el => el?.setAttribute('disabled','true'));

      const src = getTransitionSrc(root, btnNext);
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(src, NEXT_SECTION_ID);
      } else {
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      }
    });

    window.JCSenha.state.ready = true;
    console.log('[JCSenha] pronto');
  }

  // ===== Eventos =====
  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    if (!window.JCSenha.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCSenha.state.listenerOn = true;
    }
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();

})();
