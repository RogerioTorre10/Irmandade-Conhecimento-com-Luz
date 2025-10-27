// /assets/js/section-termos1.js
(function () {
  'use strict';

  const SECTION_ID       = 'section-termos1';
  const PREV_SECTION_ID  = 'section-intro';
  const NEXT_SECTION_ID  = 'section-termos2';
  const HIDE_CLASS       = 'hidden';
  const TYPING_SPEED     = 34;
  const TTS_LATCH_MS     = 600;

  if (window.JCTermos1?.__bound) {
    console.log('[JCTermos1] já carregado');
    return;
  }
  window.JCTermos1 = window.JCTermos1 || {};
  window.JCTermos1.__bound = true;
  window.JCTermos1.state = { ready: false, listenerOn: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  // 🔒 Espera qualquer vídeo de transição terminar
  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;
    let resolved = false;
    const p = new Promise(resolve => {
      const onEnd = () => { if (!resolved) { resolved = true; document.removeEventListener('transition:ended', onEnd); resolve(); } };
      document.addEventListener('transition:ended', onEnd, { once: true });
    });
    const t = new Promise(resolve => setTimeout(resolve, timeoutMs));
    await Promise.race([p, t]); // não fica preso para sempre
  }

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0; el.textContent = '';
      (function tick() {
        if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(tick, speed); }
        else resolve();
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
      await new Promise(res => { try { window.runTyping(el, text, () => res(), { speed, cursor: true }); } catch { usedFallback = true; res(); } });
    } else usedFallback = true;
    if (usedFallback) await localType(el, text, speed);

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    if (speak && text && !el.dataset.spoken) {
      try {
        speechSynthesis.cancel?.();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(text, { lang: 'pt-BR', rate: 1.05, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch {}
    }
    await sleep(60);
  }

  function pick(root) {
    const scope = root.querySelector('#termos1') || root;
    return {
      root, scope,
      btnNext: scope.querySelector('[data-action="avancar"]') || q('#btn-termos1-avancar', root),
      btnPrev: scope.querySelector('[data-action="voltar"]')  || q('#btn-termos1-voltar',  root),
      items:   qa('[data-typing="true"]', scope)
    };
  }

  async function initOnce(root) {
    if (!root || root.dataset.termos1Initialized === 'true') return;
    root.dataset.termos1Initialized = 'true';

    // 🔒 Aguarda terminar qualquer transição em andamento
    await waitForTransitionUnlock();

    ensureVisible(root);
    const { btnNext, btnPrev, items } = pick(root);

    // Desativa UI enquanto narra
    btnNext?.setAttribute('disabled', 'true');
    btnPrev?.setAttribute('disabled', 'true');

    for (const el of items) {
      if (!el.classList.contains('typing-done')) {
        const spd = Number(el.dataset.speed) || TYPING_SPEED;
        await typeOnce(el, { speed: spd, speak: true });
      }
    }

    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');
    btnNext?.classList?.add('btn-ready-pulse');
    setTimeout(() => btnNext?.classList?.remove('btn-ready-pulse'), 700);

    // Voltar
    btnPrev?.addEventListener('click', () => {
      speechSynthesis.cancel?.();
      window.JC?.show?.(PREV_SECTION_ID) ?? history.back();
    }, { once: true });

    // Avançar (Termos2 cuida do próprio vídeo)
    btnNext?.addEventListener('click', () => {
      speechSynthesis.cancel?.();
      window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
    }, { once: true });

    window.JCTermos1.state.ready = true;
    console.log('[JCTermos1] pronto');
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    if (!window.JCTermos1.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCTermos1.state.listenerOn = true;
    }
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();
})();
