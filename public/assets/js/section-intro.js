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

  // ===========================================================
  //  i18n LOCK — Escolha de idioma apenas na Intro
  // ===========================================================
  function isLangLocked() {
    return localStorage.getItem('i18n_locked') === '1';
  }

  async function setLangAndLock(lang) {
    // aplica idioma no i18n
    if (window.i18n?.waitForReady) await window.i18n.waitForReady(10000);

    if (window.i18n?.forceLang) {
      await window.i18n.forceLang(lang, true);
    } else if (window.i18n?.setLang) {
      await window.i18n.setLang(lang);
    } else {
      console.warn('[IntroLang] i18n não disponível para trocar idioma.');
    }

    // trava
    localStorage.setItem('i18n_lang', lang);
    localStorage.setItem('i18n_locked', '1');

    // html lang
    document.documentElement.lang = String(lang).split('-')[0] || 'pt';

    // desabilita seletor (se existir no topo)
    const sel = document.getElementById('language-select');
    if (sel) {
      sel.value = lang;
      sel.disabled = true;
      sel.style.pointerEvents = 'none';
      sel.style.opacity = '0.65';
    }
  }

  function syncTypingDataText(root) {
    try {
      root.querySelectorAll('[data-typing="true"]').forEach(el => {
        const tc = (el.textContent || '').trim();
        if (tc) el.dataset.text = tc;
      });
    } catch {}
  }

  function buildLangModal(root) {
    const modal = document.createElement('div');
    modal.id = 'intro-lang-modal';
    modal.innerHTML = `
      <div class="intro-lang-backdrop"></div>
      <div class="intro-lang-card" role="dialog" aria-modal="true" aria-label="Escolha de idioma">
        <h3 class="intro-lang-title">Escolha seu idioma</h3>
        <p class="intro-lang-sub">Selecione o idioma para navegar. Após confirmar, não será possível alterar.</p>

        <div class="intro-lang-row">
          <select id="intro-lang-select" class="intro-lang-select" aria-label="Selecione o idioma">
            <option value="pt-BR">Português (BR)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (ES)</option>
          </select>
        </div>

        <div class="intro-lang-actions">
          <button id="intro-lang-confirm" type="button" class="btn btn-primary btn-stone">Confirmar</button>
        </div>
      </div>
    `;
    root.appendChild(modal);

    // CSS mínimo embutido (não depende de arquivo externo)
    const style = document.createElement('style');
    style.textContent = `
      #intro-lang-modal { position: fixed; inset: 0; z-index: 9999; }
      #intro-lang-modal .intro-lang-backdrop {
        position: absolute; inset: 0;
        background: rgba(0,0,0,.65);
        backdrop-filter: blur(2px);
      }
      #intro-lang-modal .intro-lang-card {
        position: absolute; left: 50%; top: 50%;
        transform: translate(-50%,-50%);
        width: min(92vw, 460px);
        border-radius: 18px;
        padding: 16px 16px 14px;
        border: 1px solid rgba(212,175,55,.55);
        background: rgba(10,10,18,.72);
        box-shadow: 0 0 24px rgba(212,175,55,.35), inset 0 0 18px rgba(255,230,150,.12);
        color: #f6e7c6;
        text-align: center;
        font-family: "Cardo", serif;
      }
      #intro-lang-modal .intro-lang-title {
        margin: 0 0 6px; font-size: 1.15rem; letter-spacing: .06em;
        font-family: "ManufacturingConsent-Regular","Cardo",serif;
      }
      #intro-lang-modal .intro-lang-sub {
        margin: 0 0 12px; font-size: .92rem; opacity: .92;
      }
      #intro-lang-modal .intro-lang-row { margin: 10px 0 12px; }
      #intro-lang-modal .intro-lang-select {
        width: 100%;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid rgba(212,175,55,.5);
        background: rgba(0,0,0,.35);
        color: #f6e7c6;
        outline: none;
      }
      #intro-lang-modal .intro-lang-actions { margin-top: 8px; }
      #intro-lang-modal .intro-lang-actions .btn { width: 100%; }
    `;
    modal.appendChild(style);

    return modal;
  }

  async function requireLanguageChoice(root) {
    // se já travou, não pergunta
    if (isLangLocked()) return;

    // cria modal
    const modal = buildLangModal(root);

    // preseleciona último lang (se tiver)
    const last = localStorage.getItem('i18n_lang') || window.i18n?.lang || 'pt-BR';
    const sel = modal.querySelector('#intro-lang-select');
    if (sel) sel.value = last;

    // aguarda confirmação
    await new Promise((resolve) => {
      const btn = modal.querySelector('#intro-lang-confirm');
      btn.addEventListener('click', async () => {
        const chosen = sel?.value || 'pt-BR';
        await setLangAndLock(chosen);

        // aplica tradução na intro (agora com idioma definido)
        try {
          if (window.i18n?.apply) window.i18n.apply(root);
        } catch {}

        // sincroniza data-text para a datilografia
        syncTypingDataText(root);

        // remove modal e segue
        modal.remove();
        resolve();
      }, { once: true });
    });
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

    // ✅ 1) trava idioma aqui, antes de qualquer datilografia/TTS
    await requireLanguageChoice(root);

    // ✅ 2) roda datilografia (já com idioma definido)
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
