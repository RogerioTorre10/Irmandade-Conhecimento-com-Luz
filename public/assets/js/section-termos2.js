(function () {
  'use strict';

  const MOD = 'section-termos2.js';
  const SECTION_ID = 'section-termos2';
  const NEXT_SECTION_ID = 'section-senha';
  const HIDE_CLASS = 'hidden';
  const TYPING_SPEED = 34;
  const TTS_LATCH_MS = 600;

  if (window.JCTermos2?.__bound) return;
  window.JCTermos2 = window.JCTermos2 || {};
  window.JCTermos2.__bound = true;
  window.JCTermos2.state = { ready: false, listenerOn: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function getActiveGuide() {
    return (
      window.__GUIA_ATIVO ||
      window.guiaAtual ||
      window.JORNADA_GUIA_ATIVO ||
      localStorage.getItem('guiaSelecionado') ||
      sessionStorage.getItem('guiaSelecionado') ||
      document.body?.dataset?.guia ||
      'lumen'
    ).toString().toLowerCase();
  }

  function getActiveLang() {
    return (
      window.i18n?.getLanguage?.() ||
      localStorage.getItem('i18n_lang') ||
      sessionStorage.getItem('i18n_lang') ||
      document.documentElement.lang ||
      'pt-BR'
    );
  }

  function buildGuideVoiceContext() {
    const guide = getActiveGuide();
    const lang = getActiveLang();

    const presetByGuide = {
      lumen: { voiceGender: 'female', pitch: 1.08, rate: 1.00, style: 'acolhedora' },
      zion:  { voiceGender: 'male',   pitch: 0.92, rate: 0.96, style: 'firme' },
      arian: { voiceGender: 'female', pitch: 1.16, rate: 0.94, style: 'inspiradora' }
    };

    return {
      lang,
      guide,
      ...(presetByGuide[guide] || presetByGuide.lumen)
    };
  }

  function syncGuideVoiceContext(root) {
    const ctx = buildGuideVoiceContext();

    window.__JC_VOICE_CONTEXT = ctx;
    window.__GUIDE_VOICE_CONTEXT = ctx;
    window.__TERMS_VOICE_CONTEXT = ctx;

    if (root) {
      root.dataset.lang = ctx.lang;
      root.dataset.guide = ctx.guide;
      root.dataset.voiceGender = ctx.voiceGender;
      root.dataset.voicePitch = String(ctx.pitch);
      root.dataset.voiceRate = String(ctx.rate);
      root.dataset.voiceStyle = ctx.style;
    }

    if (window.EffectCoordinator) {
      window.EffectCoordinator.voiceContext = {
        ...(window.EffectCoordinator.voiceContext || {}),
        ...ctx
      };
    }

    console.log('[JCTermos2] voice context sincronizado:', ctx);
    return ctx;
  }

  async function applySectionI18n(root) {
    if (!root) return;

    try {
      if (window.i18n?.apply) {
        await window.i18n.apply(root);
      } else if (window.applyI18n) {
        await window.applyI18n(root);
      }
    } catch (err) {
      console.warn('[JCTermos2] falha ao aplicar i18n:', err);
    }
  }

  function sanitizeTypingText(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .replace(/^\s*[•●▪◦·]\s*/gm, '')
      .replace(/<li[^>]*>/gi, '')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/?(ul|ol)[^>]*>/gi, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function syncTranslatedFallbacks(root) {
    if (!root) return;

    root.querySelectorAll('[data-i18n-text]').forEach((el) => {
      const key = el.dataset.i18nText;
      if (!key) return;

      const translated = window.i18n?.t?.(key);
      if (
        translated &&
        typeof translated === 'string' &&
        translated.trim() &&
        translated !== key
      ) {
        const clean = sanitizeTypingText(translated);
        el.textContent = clean;
        el.dataset.text = clean;
        el.setAttribute('data-text', clean);
      } else {
        const clean = sanitizeTypingText(el.dataset.text || el.getAttribute('data-text') || el.textContent || '');
        el.dataset.text = clean;
        el.setAttribute('data-text', clean);
      }
    });

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      const key = el.dataset.i18n;
      if (!key) return;

      const translated = window.i18n?.t?.(key);
      if (
        !translated ||
        typeof translated !== 'string' ||
        !translated.trim() ||
        translated === key
      ) return;

      const clean = sanitizeTypingText(translated);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
          el.placeholder = clean;
        } else {
          el.value = clean;
        }
      } else if (!el.hasAttribute('data-i18n-text')) {
        el.textContent = clean;
      }
    });
  }

  function prepareTypingNodes(root) {
    if (!root) return;

    root.querySelectorAll('[data-typing="true"]').forEach((el) => {
      el.classList.remove('typing-active', 'typing-done', 'type-done');
      el.removeAttribute('data-spoken');
      el.removeAttribute('data-typed');
      el.removeAttribute('aria-busy');

      const txt =
        el.getAttribute('data-text') ||
        el.dataset?.text ||
        el.textContent ||
        '';

      const clean = sanitizeTypingText(txt);
      el.dataset.text = clean;
      el.setAttribute('data-text', clean);
      el.textContent = '';
    });
  }

  function activateTypingAura(el) {
    if (!el) return;
    el.classList.remove('typing-done', 'type-done');
    el.classList.add('typing-active');
    el.setAttribute('aria-busy', 'true');
  }

  function finishTypingAura(el) {
    if (!el) return;
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    el.removeAttribute('aria-busy');
    el.setAttribute('data-typed', 'true');
  }

  async function flushFrames(count = 2) {
    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  async function waitForTransitionUnlock(timeoutMs = 10000) {
    const start = Date.now();

    function transitionStillRunning() {
      return !!(
        window.__TRANSITION_LOCK ||
        document.documentElement.classList.contains('is-transitioning') ||
        document.body.classList.contains('is-transitioning') ||
        document.documentElement.classList.contains('vt-force-fixed') ||
        document.body.classList.contains('vt-force-fixed')
      );
    }

    if (!transitionStillRunning()) return;

    await new Promise((resolve) => {
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        document.removeEventListener('transition:ended', onEnd);
        clearInterval(timer);
        resolve();
      };

      const onEnd = () => {
        setTimeout(() => {
          if (!transitionStillRunning()) finish();
        }, 60);
      };

      const timer = setInterval(() => {
        if (!transitionStillRunning()) finish();
        if (Date.now() - start >= timeoutMs) finish();
      }, 120);

      document.addEventListener('transition:ended', onEnd);
    });
  }

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0;
      el.textContent = '';
      (function tick() {
        if (i < text.length) {
          el.textContent += text.charAt(i++);
          setTimeout(tick, speed);
        } else {
          resolve();
        }
      })();
    });
  }

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true, voiceCtx = null } = {}) {
    if (!el) return;

    const key = el.dataset?.i18nText;
    const rawText =
      (key && window.i18n?.t ? window.i18n.t(key) : null) ||
      el.dataset?.text ||
      el.getAttribute('data-text') ||
      el.textContent ||
      '';

    const normalizedText = sanitizeTypingText(rawText);
    if (!normalizedText) return;

    el.dataset.text = normalizedText;
    el.setAttribute('data-text', normalizedText);

    activateTypingAura(el);

    let usedFallback = false;

    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try {
          window.runTyping(el, normalizedText, () => res(), { speed, cursor: true });
        } catch (err) {
          console.warn('[JCTermos2] runTyping falhou, usando fallback:', err);
          usedFallback = true;
          res();
        }
      });
    } else {
      usedFallback = true;
    }

    if (usedFallback) {
      await localType(el, normalizedText, speed);
    }

    finishTypingAura(el);

    if (speak && normalizedText && !el.dataset.spoken) {
      try {
        speechSynthesis.cancel?.();

        if (window.EffectCoordinator?.speak) {
          const speakOptions = {
            rate: voiceCtx?.rate ?? 1.05,
            pitch: voiceCtx?.pitch ?? 1.0,
            lang: voiceCtx?.lang ?? getActiveLang(),
            gender: voiceCtx?.voiceGender ?? 'female',
            guide: voiceCtx?.guide ?? getActiveGuide(),
            style: voiceCtx?.style ?? 'acolhedora'
          };

          await window.EffectCoordinator.speak(normalizedText, speakOptions);
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch (err) {
        console.warn('[JCTermos2] falha no speak:', err);
      }
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
    const scope = root.querySelector('#termos2') || root;
    return {
      root,
      scope,
      btn:  scope.querySelector('[data-action="avancar"]') || root.querySelector('.avancarBtn') || root.querySelector('#btn-termos2-avancar'),
      back: scope.querySelector('[data-action="voltar"]')  || root.querySelector('#btn-termos2-voltar')
    };
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc)
        || (root?.dataset?.transitionSrc)
        || '/assets/videos/filme-senha.mp4';
  }

  async function initOnce(root) {
    if (!root || root.dataset.termos2Initialized === 'true') return;
    root.dataset.termos2Initialized = 'true';

    root.dataset.transitionReady = 'false';

    await waitForTransitionUnlock();
    ensureVisible(root);

    await applySectionI18n(root);
    await flushFrames(2);

    syncTranslatedFallbacks(root);
    prepareTypingNodes(root);

    const voiceCtx = syncGuideVoiceContext(root);
    const { scope, btn, back } = pick(root);

    await flushFrames(1);
    root.dataset.transitionReady = 'true';

    btn?.setAttribute('disabled', 'true');
    btn?.classList?.add('is-hidden');

    const items = scope.querySelectorAll('[data-typing="true"]');
    for (const el of items) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true, voiceCtx });
      }
    }

    btn?.removeAttribute('disabled');
    btn?.classList?.remove('is-hidden');
    btn?.classList?.add('btn-ready-pulse');
    setTimeout(() => btn?.classList?.remove('btn-ready-pulse'), 700);
    btn?.focus?.();

    if (back && back.dataset.termos2BoundBack !== '1') {
      back.dataset.termos2BoundBack = '1';
      back.addEventListener('click', () => {
        speechSynthesis.cancel?.();
        window.JC?.show?.('section-termos1') ?? history.back();
      });
    }

    if (btn && btn.dataset.termos2BoundNext !== '1') {
      btn.dataset.termos2BoundNext = '1';
      btn.addEventListener('click', () => {
        speechSynthesis.cancel?.();
        const src = getTransitionSrc(root, btn);
        if (typeof window.playTransitionVideo === 'function') {
          window.playTransitionVideo(src, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
        }
      });
    }

    document
    .querySelectorAll('#section-termos2 [data-typing="true"]')
    .forEach((el) => {
      el.classList.remove('typing-active');
      el.classList.add('typing-done');
      el.dataset.typingDone = '1';
      el.style.opacity = '1';
      el.style.visibility = 'visible';
    });

   window.JCTermos2.state.ready = true;
   console.log('[JCTermos2] pronto — i18n aplicado, typing com aura, fallback sincronizado, voz alinhada e transição preservada');
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
