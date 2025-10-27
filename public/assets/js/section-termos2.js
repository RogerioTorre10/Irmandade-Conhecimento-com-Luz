(function () {
  'use strict';

  const MOD = 'section-termos2.js';
  const SECTION_ID = 'section-termos2';
  const NEXT_SECTION_ID = 'section-senha';       // fluxo: termos2 → senha
  const VIDEO_SRC = '/assets/videos/filme-senha.mp4';
  const HIDE_CLASS = 'hidden';
  const TYPING_SPEED = 34;
  const TTS_LATCH_MS = 600;

  if (window.JCTermos2?.__bound) return;
  window.JCTermos2 = window.JCTermos2 || {};
  window.JCTermos2.__bound = true;
  window.JCTermos2.state = { ready: false, listenerOn: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

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

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try { window.runTyping(el, text, () => res(), { speed, cursor: true }); }
        catch { usedFallback = true; res(); }
      });
    } else usedFallback = true;

    if (usedFallback) await localType(el, text, speed);

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    if (speak && text && !el.dataset.spoken) {
      try {
        if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.05, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch {}
    }
    await sleep(80);
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  function pick(root) {
    // 🔁 NOVO: tenta usar #termos2; se não existir, usa o próprio root
    const scope = root.querySelector('#termos2') || root;
    return {
      root,
      scope,
      btn: scope.querySelector('[data-action="avancar"]') || root.querySelector('.avancarBtn') || root.querySelector('#btn-termos2-avancar'),
      back: scope.querySelector('[data-action="voltar"]') || root.querySelector('#btn-termos2-voltar')
    };
  }

  async function initOnce(root) {
    if (!root || root.dataset.termos2Initialized === 'true') return;
    root.dataset.termos2Initialized = 'true';
    ensureVisible(root);

    const { scope, btn, back } = pick(root);

    btn?.setAttribute('disabled', 'true');
    btn?.classList?.add('is-hidden');

    const items = scope.querySelectorAll('[data-typing="true"]');

    for (const el of items) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true });
      }
    }

    btn?.removeAttribute('disabled');
    btn?.classList?.remove('is-hidden');
    btn?.classList?.add('btn-ready-pulse');
    setTimeout(() => btn?.classList?.remove('btn-ready-pulse'), 700);
    btn?.focus?.();

    back?.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      window.JC?.show?.('section-termos1') ?? history.back();
    });
    btn?.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo('/assets/video/filme-senha.mp4', NEXT_SECTION_ID);
      } else {
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      }
    });

    window.JCTermos2.state.ready = true;
    console.log('[JCTermos2] pronto');
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    if (!window.JCTermos2.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCTermos2.state.listenerOn = true;
    }
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();
})();
