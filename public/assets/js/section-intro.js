(function () {
  'use strict';

  // ===== Config =====
  const MOD = 'section-intro.js';
  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';     // fluxo: intro → termos1
  const VIDEO_SRC = '/assets/videos/filme-pergaminho-ao-vento.mp4';
  const HIDE_CLASS = 'hidden';

  // Timings
  const TYPING_SPEED = 34;
  const INITIAL_DELAY = 200;
  const TTS_LATCH_MS = 600;

  // Evita rebind
  if (window.JCIntro?.__bound) {
    console.log('[JCIntro] já carregado');
    return;
  }
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { ready: false, listenerOn: false };

  // ===== Utils =====
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q = (sel, root = document) => root.querySelector(sel);

  async function waitForElement(selector, { within = document, timeout = 6000, step = 100 } = {}) {
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
  };

  function normalizeParagraph(el) {
    if (!el) return false;
    const current = (el.textContent || '').trim();
    const ds = (el.dataset?.text || '').trim();
    const source = ds || current;
    if (!source) return false;
    el.dataset.text = source; // guarda fonte no data-text
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
      const tick = () => {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else resolve();
      };
      tick();
    });
  }

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || el.textContent || '').trim();
    if (!text) return;

    // trava comum com seu ecossistema
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
          console.warn('[JCIntro] runTyping falhou, fallback local', e);
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

    // TTS com cancel para evitar overlay
    if (speak && text && !el.dataset.spoken) {
      try {
        if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.05, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch (e) {
        console.error('[JCIntro] Erro no TTS:', e);
      }
    }
    await sleep(80);
  }

  // ===== Core =====
  function pick(root) {
    return {
      root,
      p1: q('#intro-p1', root),
      p2: q('#intro-p2', root),
      p3: q('#intro-p3', root), // opcional
      btn: q('#btn-avancar', root) || q('[data-action="avancar"]', root),
      back: q('#btn-voltar', root)
    };
  }

  function setDisabled(el, v) {
    if (!el) return;
    if (v) el.setAttribute('disabled', 'true'); else el.removeAttribute('disabled');
    el.classList?.toggle('is-disabled', !!v);
  }

  async function initOnce(root) {
    if (!root || root.dataset.introInitialized === 'true') return;
    root.dataset.introInitialized = 'true';
    ensureVisible(root);

    // Aguarda essenciais
    let p1, p2, btn;
    try {
      p1 = await waitForElement('#intro-p1', { within: root });
      p2 = await waitForElement('#intro-p2', { within: root });
      btn = await waitForElement('#btn-avancar, [data-action="avancar"]', { within: root });
    } catch (e) {
      console.error('[JCIntro] Elementos essenciais não encontrados:', e);
      window.toast?.('Erro: elementos da seção Intro não carregados.', 'error');
      return;
    }

    const p3 = q('#intro-p3', root);
    const back = q('#btn-voltar', root);
    const seq = [p1, p2, p3].filter(Boolean);

    seq.forEach(normalizeParagraph);
    setDisabled(btn, true);
    btn?.classList?.add('is-hidden');
    if (back) setDisabled(back, false);

    await sleep(INITIAL_DELAY);

    for (const el of seq) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true });
      }
    }

    setDisabled(btn, false);
    btn?.classList?.remove('is-hidden');
    btn?.classList?.add('btn-ready-pulse');
    setTimeout(() => btn?.classList?.remove('btn-ready-pulse'), 700);
    btn?.focus();

    btn?.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      if (window.JC?.show) window.JC.show(NEXT_SECTION_ID);
      else location.hash = `#${NEXT_SECTION_ID}`;
    });

    back?.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      if (window.JC?.show) window.JC.show('section-home');
      else history.back();
    });

    window.JCIntro.state.ready = true;
    console.log('[JCIntro] pronto');
  }

  // ===== Eventos =====
  const onSectionShown = (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    const root = node || document.getElementById(SECTION_ID);
    initOnce(root);
  };

  const bind = () => {
    if (!window.JCIntro.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCIntro.state.listenerOn = true;
    }
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

})();
