(function () {
  'use strict';

  const SECTION_ID = 'section-termos1';
  const PREV_SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos2';
  const HIDE_CLASS = 'hidden';

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

  function syncTranslatedFallbacksFromDOM(root) {
    if (!root) return;

    root.querySelectorAll('[data-i18n-text]').forEach((el) => {
      const key = el.dataset.i18nText || '';
      const originalFallback = el.getAttribute('data-text') || '';
      const domText = (el.textContent || '').trim();

      if (isRealTranslatedText(domText, key)) {
        el.dataset.text = domText;
        el.setAttribute('data-text', domText);
        return;
      }

      const translated = window.i18n?.t?.(key);
      if (isRealTranslatedText(translated, key)) {
        el.textContent = translated;
        el.dataset.text = translated;
        el.setAttribute('data-text', translated);
        return;
      }

      if (originalFallback) {
        el.textContent = originalFallback;
        el.dataset.text = originalFallback;
        el.setAttribute('data-text', originalFallback);
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
    });
  }

  async function flushFrames(count = 2) {
    for (let i = 0; i < count; i++) {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    }
  }

  async function initOnce(root) {
    if (!root) return;

    root.dataset.transitionReady = 'false';

    await waitForTransitionUnlock();
    ensureVisible(root);

    await applySectionI18n(root);
    await flushFrames(2);

    syncTranslatedFallbacksFromDOM(root);
    prepareTypingNodes(root);
    syncGuideVoiceContext(root);

    await flushFrames(1);
    root.dataset.transitionReady = 'true';

    const { btnNext, btnPrev } = pick(root);

    if (btnPrev && btnPrev.dataset.termos1Bound !== '1') {
      btnPrev.dataset.termos1Bound = '1';
      btnPrev.addEventListener('click', () => {
        try { window.speechSynthesis?.cancel?.(); } catch {}
        window.JC?.show?.(PREV_SECTION_ID) ?? history.back();
      });
    }

    if (btnNext && btnNext.dataset.termos1Bound !== '1') {
      btnNext.dataset.termos1Bound = '1';
      btnNext.addEventListener('click', () => {
        try { window.speechSynthesis?.cancel?.(); } catch {}
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      });
    }

    btnPrev?.removeAttribute('disabled');
    btnNext?.removeAttribute('disabled');

    btnNext?.classList?.add('btn-ready-pulse');
    setTimeout(() => btnNext?.classList?.remove('btn-ready-pulse'), 700);

    root.dataset.termos1Initialized = 'true';
    window.JCTermos1.state.ready = true;

    console.log('[JCTermos1] pronto — mesma técnica da intro aplicada ao termos1');
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
    if (now && !now.classList.contains(HIDE_CLASS)) {
      initOnce(now);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
