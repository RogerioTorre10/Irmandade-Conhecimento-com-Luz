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
    el.classList.add('typing-active');
    el.classList.remove('typing-done');
    let usedFallback = false;
    // --- DATILOGRAFIA ---
    if (typeof window.runTyping === 'function') {
      await new Promise((res) => {
        try {
          window.runTyping(el, text, () => res(), { speed, cursor: true });
        } catch {
          usedFallback = true;
          res();
        }
      });
    } else {
      usedFallback = true;
    }
    if (usedFallback) {
      await localType(el, text, speed);
    }
    el.classList.remove('typing-active');
    el.classList.add('typing-done');
    // --- TTS (voz) ---
    if (speak && text && !el.dataset.spoken) {
      try {
        const langNow = localStorage.getItem('i18n_lang') || window.i18n?.lang || 'pt-BR';
        window.speechSynthesis?.cancel?.();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(text, {
            lang: langNow,
            rate: 1.05,
            pitch: 1.0
          });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch (e) {
        console.warn('[TTS] Erro ao falar:', e);
      }
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
    return (btn?.dataset?.transitionSrc) || (root?.dataset?.transitionSrc) || '/assets/videos/filme-pergaminho-ao-vento.mp4';
  }
  // ===========================================================
  // i18n LOCK — Escolha de idioma apenas na Intro
  // ===========================================================
  function isLangLocked() {
    return localStorage.getItem('i18n_locked') === '1';
  }
  async function setLangAndLock(lang) {
    if (!lang) {
      console.warn('[IntroLang] Idioma inválido:', lang);
      return;
    }
    // Aplica idioma
    if (window.i18n?.waitForReady) await window.i18n.waitForReady(10000);
    if (window.i18n?.forceLang) {
      await window.i18n.forceLang(lang, true);
    } else if (window.i18n?.setLang) {
      await window.i18n.setLang(lang);
    } else {
      console.warn('[IntroLang] i18n não disponível.');
      return;
    }
    // Trava
    localStorage.setItem('i18n_lang', lang);
    localStorage.setItem('i18n_locked', '1');
    // HTML lang
    document.documentElement.lang = lang.split('-')[0] || 'pt';
    // Desabilita seletores globais
    document.querySelectorAll('#language-select, [data-i18n-selector]').forEach(sel => {
      sel.value = lang;
      sel.disabled = true;
      sel.style.pointerEvents = 'none';
      sel.style.opacity = '0.65';
    });
    // Broadcast pra outras partes do app (se suportado, e.g., via CustomEvent)
    document.dispatchEvent(new CustomEvent('i18n:changed', { detail: { lang } }));
    console.log('[IntroLang] Idioma travado:', lang);
  }
  function syncTypingDataText(root) {
    try {
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        const tc = (el.textContent || '').trim();
        if (tc) el.dataset.text = tc;
      });
    } catch (e) {
      console.warn('[SyncText] Erro:', e);
    }
  }
  function buildLangModal(root) {
    const modal = document.createElement('div');
    modal.id = 'intro-lang-modal';
    modal.innerHTML = `
      <div class="intro-lang-backdrop"></div>
      <div class="intro-lang-card" role="dialog" aria-modal="true" aria-labelledby="intro-lang-title">
        <h3 id="intro-lang-title" class="intro-lang-title">Escolha seu idioma</h3>
        <p class="intro-lang-sub">Selecione o idioma para navegar. Após confirmar, não será possível alterar.</p>
        <div class="intro-lang-row">
          <select id="intro-lang-select" class="intro-lang-select" aria-label="Selecione o idioma">
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (ES)</option>
            <!-- Adicione mais opções aqui se precisar, e.g., <option value="fr-FR">Français (FR)</option> -->
          </select>
        </div>
        <div class="intro-lang-actions">
          <button id="intro-lang-confirm" type="button" class="btn btn-primary btn-stone">Confirmar</button>
        </div>
      </div>
    `;
    root.appendChild(modal);
    // CSS (mesmo do original, sem mudanças)
    const style = document.createElement('style');
    style.textContent = `
      /* Seu CSS original aqui, sem alterações */
    `;
    modal.appendChild(style);
    return modal;
  }
  async function requireLanguageChoice(root) {
    if (isLangLocked()) {
      console.log('[IntroLang] Idioma já travado, prosseguindo.');
      return;
    }
    const modal = buildLangModal(root);
    const last = localStorage.getItem('i18n_lang') || window.i18n?.lang || 'pt-BR';
    const sel = modal.querySelector('#intro-lang-select');
    if (sel) sel.value = last;
    await new Promise((resolve) => {
      const btn = modal.querySelector('#intro-lang-confirm');
      btn.addEventListener('click', async () => {
        const chosen = sel?.value || 'pt-BR';
        await setLangAndLock(chosen);
        // Aplica i18n na intro
        try {
          if (window.i18n?.apply) window.i18n.apply(root);
        } catch (e) {
          console.warn('[i18nApply] Erro ao aplicar na intro:', e);
        }
        syncTypingDataText(root);
        modal.remove();
        resolve();
      }, { once: true });
    });
  }
  async function runTyping(root) {
    if (!isLangLocked()) {
      console.warn('[Intro] Idioma não confirmado — bloqueando runTyping.');
      return;
    }
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
      window.speechSynthesis?.cancel?.();
      const src = getTransitionSrc(root, btn);
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(src, NEXT_SECTION_ID);
      } else {
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      }
    }, { once: true });
  }
  // Novo: Aplica i18n em QUALQUER seção mostrada
  async function applyGlobalI18n(node) {
    if (isLangLocked() && window.i18n?.apply) {
      try {
        const lang = localStorage.getItem('i18n_lang');
        if (lang) await window.i18n.forceLang(lang, true); // Reforça em cada load
        window.i18n.apply(node || document);
        console.log('[GlobalI18n] Aplicado em', node?.id);
      } catch (e) {
        console.warn('[GlobalI18n] Erro:', e);
      }
    }
  }
  async function init(root) {
    if (!root || window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;
    ensureVisible(root);
    await requireLanguageChoice(root);
    await runTyping(root);
    console.log('[JCIntro] pronto');
  }
  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    applyGlobalI18n(node); // Aplica i18n em TODAS as seções
    if (sectionId !== SECTION_ID) return;
    init(node || document.getElementById(SECTION_ID));
  }
  function bind() {
    if (!window.JCIntro.state.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      // Listener pra mudança de i18n global
      document.addEventListener('i18n:changed', (e) => applyGlobalI18n(document));
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
  // Init global i18n no load
  applyGlobalI18n(document);
})();
