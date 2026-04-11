(function () {
  'use strict';

  const SECTION_ID = 'section-termos1';
  const PREV_SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos2';
  const HIDE_CLASS = 'hidden';
  const TYPING_SPEED = 34;
  const TTS_LATCH_MS = 600;

  if (window.JCTermos1?.__bound) {
    console.log('[JCTermos1] já carregado');
    return;
  }

  window.JCTermos1 = window.JCTermos1 || {};
  window.JCTermos1.__bound = true;
  window.JCTermos1.state = {
    ready: false,
    listenerOn: false
  };

  const q = (sel, root = document) => root.querySelector(sel);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
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

  function pick(root) {
    const scope = root.querySelector('#termos1') || root;

    return {
      root,
      scope,
      btnNext: scope.querySelector('[data-action="avancar"]') || q('#btn-termos1-avancar', root),
      btnPrev: scope.querySelector('[data-action="voltar"]') || q('#btn-termos1-voltar', root)
    };
  }

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

    console.log('[JCTermos1] voice context sincronizado:', ctx);
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
      console.warn('[JCTermos1] falha ao aplicar i18n:', err);
    }
  }

  function isRealTranslatedText(text, key) {
    if (!text || typeof text !== 'string') return false;
    const t = text.trim();
    if (!t) return false;
    if (key && t === key) return false;
    if (/^[a-z0-9_.-]+$/i.test(t) && t.includes('.')) return false;
    return true;
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

  function syncTranslatedFallbacksFromDOM(root) {
    if (!root) return;

    root.querySelectorAll('[data-i18n-text]').forEach((el) => {
      const key = el.dataset.i18nText || '';
      const originalFallback = el.getAttribute('data-text') || '';
      const domText = (el.textContent || '').trim();

      if (isRealTranslatedText(domText, key)) {
        const clean = sanitizeTypingText(domText);
        el.dataset.text = clean;
        el.setAttribute('data-text', clean);
        return;
      }

      const translated = window.i18n?.t?.(key);
      if (isRealTranslatedText(translated, key)) {
        const clean = sanitizeTypingText(translated);
        el.textContent = clean;
        el.dataset.text = clean;
        el.setAttribute('data-text', clean);
        return;
      }

      if (originalFallback) {
        const clean = sanitizeTypingText(originalFallback);
        el.textContent = clean;
        el.dataset.text = clean;
        el.setAttribute('data-text', clean);
      }
    });

    root.querySelectorAll('[data-i18n]').forEach((el) => {
      if (el.hasAttribute('data-i18n-text')) return;

      const key = el.dataset.i18n || '';
      const originalFallback = el.getAttribute('data-text') || '';
      const domText = (el.textContent || '').trim();

      let finalText = '';

      if (isRealTranslatedText(domText, key)) {
        finalText = domText;
      } else {
        const translated = window.i18n?.t?.(key);
        if (isRealTranslatedText(translated, key)) {
          finalText = translated;
        } else {
          finalText = originalFallback || domText || '';
        }
      }

      if (!finalText) return;
      finalText = sanitizeTypingText(finalText);

      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        if (el.hasAttribute('placeholder')) {
          el.placeholder = finalText;
        } else {
          el.value = finalText;
        }
      } else {
        el.textContent = finalText;
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

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise((resolve) => {
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
      await new Promise((res) => {
        try {
          window.runTyping(el, normalizedText, () => res(), { speed, cursor: true });
        } catch (err) {
          console.warn('[JCTermos1] runTyping falhou, usando fallback:', err);
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
        console.warn('[JCTermos1] falha no speak:', err);
      }
    }

    await sleep(80);
  }

  async function initOnce(root) {
    if (!root || root.dataset.termos1Initialized === 'true') return;

    root.dataset.transitionReady = 'false';

    try { window.speechSynthesis?.cancel?.(); } catch {}

    prepareTypingNodes(root);
    await waitForTransitionUnlock();
    await flushFrames(3);

    if (root.classList.contains(HIDE_CLASS) || root.getAttribute('aria-hidden') === 'true') {
      return;
    }

    root.dataset.termos1Initialized = 'true';

    ensureVisible(root);

    await applySectionI18n(root);
    await flushFrames(2);

    syncTranslatedFallbacksFromDOM(root);
    prepareTypingNodes(root);
    const voiceCtx = syncGuideVoiceContext(root);

    await flushFrames(1);
    root.dataset.transitionReady = 'true';

    const { btnNext, btnPrev, scope } = pick(root);

    btnPrev?.removeAttribute('disabled');
    btnNext?.setAttribute('disabled', 'true');
    btnNext?.classList?.add('is-hidden');

    const items = scope.querySelectorAll('[data-typing="true"]');
    for (const el of items) {
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true, voiceCtx });
      }
    }

    btnNext?.removeAttribute('disabled');
    btnNext?.classList?.remove('is-hidden');
    btnNext?.classList?.add('btn-ready-pulse');
    setTimeout(() => btnNext?.classList?.remove('btn-ready-pulse'), 700);

    if (btnPrev && btnPrev.dataset.termos1Bound !== '1') {
      btnPrev.dataset.termos1Bound = '1';
      btnPrev.addEventListener('click', () => {
        try { window.speechSynthesis?.cancel?.(); } catch {}
        root.dataset.termos1Initialized = 'false';
        window.JC?.show?.(PREV_SECTION_ID) ?? history.back();
      });
    }

    if (btnNext && btnNext.dataset.termos1Bound !== '1') {
      btnNext.dataset.termos1Bound = '1';
      btnNext.addEventListener('click', () => {
        try { window.speechSynthesis?.cancel?.(); } catch {}
        root.dataset.termos1Initialized = 'false';
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      });
    }

    window.JCTermos1.state.ready = true;
    console.log('[JCTermos1] pronto — typing, aura, i18n e voz aplicados ao termos1');
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

    // Não inicializa no DOMContentLoaded.
    // O termos1 só deve começar quando o controller emitir section:shown.
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
