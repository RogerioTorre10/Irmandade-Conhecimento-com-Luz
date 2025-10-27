(function () {
  'use strict';

  // ===== Config =====
  const MOD = 'section-intro.js';
  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';     // fluxo: intro → termos1
  const VIDEO_SRC = '/assets/videos/filme-pergaminho-ao-vento.mp4';
  const HIDE_CLASS = 'hidden';

  // Timings
  const TYPING_SPEED = 36;
  const TTS_LATCH_MS = 1000;

  // Estado
  const state = { initialized: false, listenerOn: false };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const q = (sel, root = document) => root.querySelector(sel);

  // ===== Typing + TTS =====
  async function typeText(el, speed = TYPING_SPEED) {
    const text = el.dataset.text?.trim() || el.textContent?.trim() || '';
    if (!text) return;
    el.textContent = '';
    el.classList.add('typing-active');

    for (let i = 0; i < text.length; i++) {
      el.textContent += text.charAt(i);
      await sleep(speed);
    }
    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      if (window.EffectCoordinator?.speak) {
        await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.1 });
        await sleep(TTS_LATCH_MS);
      }
    } catch {}
  }

  async function runTyping(root) {
    const elements = root.querySelectorAll('[data-typing="true"]');
    const btn = root.querySelector('[data-action="avancar"]') || document.getElementById('btn-avancar');
    btn?.setAttribute('disabled', 'true');
    btn?.classList?.add('is-hidden');

    for (const el of elements) await typeText(el);

    btn?.removeAttribute('disabled');
    btn?.classList?.remove('is-hidden');
    btn?.classList?.add('btn-ready-pulse');
    setTimeout(() => btn?.classList?.remove('btn-ready-pulse'), 700);
    btn?.focus?.();
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  // ===== Navegação =====
  function playNext() {
    if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo('/assets/videos/filme-pergaminho-ao-vento.mp4', NEXT_SECTION_ID);
    } else {
      window.JC?.show?.(NEXT_SECTION_ID);
    }
  }

  // ===== Init =====
  async function init(root) {
    if (state.initialized || !root) return;
    state.initialized = true;

    ensureVisible(root);

    // botão
    const btn = root.querySelector('[data-action="avancar"]') || document.getElementById('btn-avancar');
    btn?.addEventListener('click', playNext);

    await runTyping(root);
    console.log('[JCIntro] pronto');
  }

  // ===== Eventos =====
  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    const root = node || document.getElementById(SECTION_ID);
    init(root);
  }

  function bind() {
    if (!state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      state.listenerOn = true;
    }
    // *** CORAÇÃO DA CORREÇÃO ***
    // se a intro JÁ estiver ativa quando o app sobe, inicializa agora
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) {
      init(now);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
