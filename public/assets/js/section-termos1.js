(function () {
  'use strict';

  const SECTION_ID = 'section-termos1';
  const PREV_SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos2';
  const HIDE_CLASS = 'hidden';
  const TYPING_SPEED = 34;
  const TTS_LATCH_MS = 600;
  const START_DELAY_MS = 420;

  if (window.JCTermos1?.__bound) {
    console.log('[JCTermos1] já carregado');
    return;
  }

  window.JCTermos1 = window.JCTermos1 || {};
  window.JCTermos1.__bound = true;
  window.JCTermos1.state = {
    ready: false,
    listenerOn: false,
    initToken: 0,
    activeRunToken: 0
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

  function cancelAllSpeech() {
    try { window.speechSynthesis?.cancel?.(); } catch {}
    try { window.EffectCoordinator?.stop?.(); } catch {}
  }

  function isElementActuallyVisible(el) {
    if (!el) return false;

    const style = window.getComputedStyle(el);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      style.opacity === '0' ||
      el.classList.contains(HIDE_CLASS) ||
      el.getAttribute('aria-hidden') === 'true'
    ) {
      return false;
    }

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return false;

    const vw = window.innerWidth || document.documentElement.clientWidth || 0;
    const vh = window.innerHeight || document.documentElement.clientHeight || 0;

    const visibleX = Math.max(0, Math.min(rect.right, vw) - Math.max(rect.left, 0));
    const visibleY = Math.max(0, Math.min(rect.bottom, vh) - Math.max(rect.top, 0));
    const visibleArea = visibleX * visibleY;
    const totalArea = Math.max(1, rect.width * rect.height);

    return (visibleArea / totalArea) > 0.25;
  }

  async function waitForSectionVisible(root, timeoutMs = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeoutMs) {
      if (isElementActuallyVisible(root)) return true;
      await sleep(120);
    }

    return isElementActuallyVisible(root);
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
        }, 80);
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

  async function typeOnce(el, { speed = TYPING_SPEED, speak = true, voiceCtx = null, runToken = 0 } = {}) {
    if (!el) return;
    if (runToken !== window.JCTermos1.state.activeRunToken) return;

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

    if (runToken !== window.JCTermos1.state.activeRunToken) return;

    if (usedFallback) {
      await localType(el, normalizedText, speed);
    }

    finishTypingAura(el);

    if (speak && normalizedText && !el.dataset.spoken && runToken === window.JCTermos1.state.activeRunToken) {
      try {
        cancelAllSpeech();

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

  async function initOnce(root, triggerToken) {
    if (!root) return;
    if (triggerToken !== window.JCTermos1.state.initToken) return;

    root.dataset.transitionReady = 'false';
    root.dataset.termos1Initialized = 'false';

    cancelAllSpeech();
    prepareTypingNodes(root);

    await waitForTransitionUnlock();
    await flushFrames(3);
    await sleep(START_DELAY_MS);

    if (triggerToken !== window.JCTermos1.state.initToken) return;

    const visible = await waitForSectionVisible(root, 6000);
    if (!visible) {
      console.warn('[JCTermos1] section não ficou visível a tempo; init cancelado');
      return;
    }

    if (triggerToken !== window.JCTermos1.state.initToken) return;

    ensureVisible(root);

    await applySectionI18n(root);
    await flushFrames(2);

    if (triggerToken !== window.JCTermos1.state.initToken) return;

    syncTranslatedFallbacksFromDOM(root);
    prepareTypingNodes(root);
    const voiceCtx = syncGuideVoiceContext(root);

    await flushFrames(2);

    if (triggerToken !== window.JCTermos1.state.initToken) return;

    root.dataset.transitionReady = 'true';
    root.dataset.termos1Initialized = 'true';

    const { btnNext, btnPrev, scope } = pick(root);

    btnPrev?.removeAttribute('disabled');
    btnNext?.setAttribute('disabled', 'true');
    btnNext?.classList?.add('is-hidden');

    window.JCTermos1.state.activeRunToken = triggerToken;

    const items = scope.querySelectorAll('[data-typing="true"]');
    for (const el of items) {
      if (triggerToken !== window.JCTermos1.state.activeRunToken) return;
      if (!el.classList.contains('typing-done')) {
        await typeOnce(el, { speed: TYPING_SPEED, speak: true, voiceCtx, runToken: triggerToken });
      }
    }

    if (triggerToken !== window.JCTermos1.state.activeRunToken) return;

    btnNext?.removeAttribute('disabled');
    btnNext?.classList?.remove('is-hidden');
    btnNext?.classList?.add('btn-ready-pulse');
    setTimeout(() => btnNext?.classList?.remove('btn-ready-pulse'), 700);

    if (btnPrev && btnPrev.dataset.termos1Bound !== '1') {
      btnPrev.dataset.termos1Bound = '1';
      btnPrev.addEventListener('click', () => {
        cancelAllSpeech();
        window.JCTermos1.state.initToken++;
        window.JCTermos1.state.activeRunToken = 0;
        root.dataset.termos1Initialized = 'false';
        window.JC?.show?.(PREV_SECTION_ID) ?? history.back();
      });
    }

    if (btnNext && btnNext.dataset.termos1Bound !== '1') {
      btnNext.dataset.termos1Bound = '1';
      btnNext.addEventListener('click', () => {
        cancelAllSpeech();
        window.JCTermos1.state.initToken++;
        window.JCTermos1.state.activeRunToken = 0;
        root.dataset.termos1Initialized = 'false';
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      });
    }

    document
     .querySelectorAll('#section-termos1 [data-typing="true"]')
     .forEach((el) => {
       el.classList.remove('typing-active');
       el.classList.add('typing-done');
       el.dataset.typingDone = '1';
       el.style.opacity = '1';
       el.style.visibility = 'visible';
     });

    window.JCTermos1.state.ready = true;
    console.log('[JCTermos1] pronto — início pós-transição validado, typing, aura, i18n e voz aplicados');
  }
  
  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;

    const root = node || document.getElementById(SECTION_ID);
    if (!root) return;

    cancelAllSpeech();
    window.JCTermos1.state.initToken += 1;
    const myToken = window.JCTermos1.state.initToken;

    initOnce(root, myToken);
  }

  function bind() {
    if (!window.JCTermos1.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      window.JCTermos1.state.listenerOn = true;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
