(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';
  const HIDE_CLASS = 'hidden';
  const TYPING_SPEED = 34;
  const TTS_LATCH_MS = 600;

  if (window.JCIntro?.__bound) { return; }
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false, listenerOn: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function waitForNode(selector, { root = document, timeout = 10000 } = {}) {
    const existing = root.querySelector(selector);
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout esperando ${selector}`)); }, timeout);
      const obs = new MutationObserver(() => {
        const el = root.querySelector(selector);
        if (el) { clearTimeout(t); obs.disconnect(); resolve(el); }
      });
      obs.observe(root === document ? document.documentElement : root, { childList: true, subtree: true });
    });
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0; el.textContent = '';
      (function tick() { if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(tick, speed); } else resolve(); })();
    });
  }

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const text = (el.dataset?.text || el.textContent || '').trim();
    if (!text) return;
    el.classList.add('typing-active'); el.classList.remove('typing-done');
    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => { try { window.runTyping(el, text, () => res(), { speed, cursor: true }); } catch { usedFallback = true; res(); } });
    } else usedFallback = true;
    if (usedFallback) await localType(el, text, speed);
    el.classList.remove('typing-active'); el.classList.add('typing-done');
    if (speak && text && !el.dataset.spoken) {
      try { speechSynthesis.cancel(); if (window.EffectCoordinator?.speak) { await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.05, pitch: 1.0 }); await sleep(TTS_LATCH_MS); el.dataset.spoken = 'true'; } } catch {}
    }
    await sleep(60);
  }

  function findOrCreateAdvanceButton(root) {
    let btn = root.querySelector('[data-action="avancar"]') || root.querySelector('#btn-avancar');
    if (btn) return btn;
    const actions = root.querySelector('.parchment-actions-rough') || root;
    btn = document.createElement('button');
    btn.id = 'btn-avancar'; btn.type = 'button';
    btn.className = 'btn btn-primary btn-stone';
    btn.setAttribute('data-action', 'avancar');
    btn.textContent = 'Iniciar';
    btn.classList.add('is-hidden');
    actions.appendChild(btn);
    return btn;
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc)
        || (root?.dataset?.transitionSrc)
        || '/assets/videos/filme-pergaminho-ao-vento.mp4';
  }

  async function runTyping(root) {
    const elements = Array.from(root.querySelectorAll('[data-typing="true"]'));
    const btn = findOrCreateAdvanceButton(root);
    btn.setAttribute('disabled', 'true'); btn.classList.add('is-hidden');
    for (const el of elements) {
      const spd = Number(el.dataset.speed) || TYPING_SPEED;
      await typeOnce(el, { speed: spd, speak: true });
    }
    btn.removeAttribute('disabled'); btn.classList.remove('is-hidden');
    btn.classList.add('btn-ready-pulse'); setTimeout(() => btn.classList.remove('btn-ready-pulse'), 700);
    btn.focus?.();
    btn.addEventListener('click', () => {
      speechSynthesis.cancel?.();
      const src = getTransitionSrc(root, btn);
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(src, NEXT_SECTION_ID);
      } else {
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      }
    }, { once: true });
  }

  async function init(root) {
    if (!root || window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;
    ensureVisible(root);
    await runTyping(root);
    console.log('[JCIntro] pronto');
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    init(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    if (!window.JCIntro.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCIntro.state.listenerOn = true;
    }
    const existing = document.getElementById(SECTION_ID);
    if (existing && !existing.classList.contains(HIDE_CLASS)) { init(existing); return; }
    waitForNode('#' + SECTION_ID, { root: document, timeout: 15000 })
      .then((el) => init(el))
      .catch((e) => console.warn('[JCIntro] seção não apareceu a tempo:', e.message));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind, { once: true });
  else bind();
})();
