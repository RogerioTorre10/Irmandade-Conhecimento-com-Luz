(function () {
  'use strict';

  const MOD = 'section-termos2.js';
  const SECTION_ID = 'section-termos2';
  const NEXT_SECTION_ID = 'section-senha';       // fluxo: termos2 → senha
  const VIDEO_SRC = '/assets/videos/filme-senha.mp4';
  const HIDE_CLASS = 'hidden';

  const TYPING_SPEED = 34;
  const TTS_LATCH_MS = 600;

  if (window.JCTermos2?.__bound) {
    console.log('[JCTermos2] já carregado');
    return;
  }
  window.JCTermos2 = window.JCTermos2 || {};
  window.JCTermos2.__bound = true;
  window.JCTermos2.state = { ready: false, listenerOn: false };

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
          console.warn('[JCTermos2] runTyping falhou, fallback local', e);
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
        if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.05, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch (e) {
        console.error('[JCTermos2] Erro no TTS:', e);
      }
    }
    await sleep(80);
  }

  function pick(root) {
    return {
      root,
      p1: q('#termos2-p1', root),
      p2: q('#termos2-p2', root),
      p3: q('#termos2-p3', root), // opcional
      p4: q('#termos2-p4', root), // opcional
      btn: q('#btn-termos2-avancar', root) || q('[data-action="avancar"]', root),
      back: q('#btn-termos2-voltar', root) || q('[data-action="voltar"]', root)
    };
  }

  function setDisabled(el, v) {
    if (!el) return;
    if (v) el.setAttribute('disabled', 'true'); else el.removeAttribute('disabled');
    el.classList?.toggle('is-disabled', !!v);
  }

  const playVideo = (nextId) => {
    console.log('[JCTermos2] transição para', nextId);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo('/assets/video/filme-termos.mp4', nextId);
    } else if (window.JC?.show) {
      window.JC.show(nextId);
    } else {
      location.hash = `#${nextId}`;
    }
  };

  async function initOnce(root) {
    if (!root || root.dataset.termos2Initialized === 'true') return;
    root.dataset.termos2Initialized = 'true';
    ensureVisible(root);

    // Essenciais
    let p1, p2, btn;
    try {
      p1  = await waitForElement('#termos2-p1', { within: root });
      p2  = await waitForElement('#termos2-p2', { within: root });
      btn = await waitForElement('#btn-termos2-avancar, [data-action="avancar"]', { within: root });
    } catch (e) {
      console.error('[JCTermos2] Elementos essenciais não encontrados:', e);
      window.toast?.('Erro: elementos da seção Termos 2 não carregados.', 'error');
      return;
    }

    const p3 = q('#termos2-p3', root);
    const p4 = q('#termos2-p4', root);
    const back = q('#btn-termos2-voltar, [data-action="voltar"]', root);
    const seq = [p1, p2, p3, p4].filter(Boolean);

    seq.forEach(normalizeParagraph);
    setDisabled(btn, true);
    btn?.classList?.add('is-hidden');
    if (back) setDisabled(back, false);

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

    back?.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      if (window.JC?.show) window.JC.show('section-termos1');
      else history.back();
    });

    btn?.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      playVideo(NEXT_SECTION_ID);
    });

    window.JCTermos2.state.ready = true;
    console.log('[JCTermos2] pronto');
  }

  const onSectionShown = (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    const root = node || document.getElementById(SECTION_ID);
    initOnce(root);
  };

  const bind = () => {
    if (!window.JCTermos2.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCTermos2.state.listenerOn = true;
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
