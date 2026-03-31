(function () {
  'use strict';

  const SECTION_ID = 'section-intro';
  const NEXT_SECTION_ID = 'section-termos1';

  if (window.JCIntro?.__bound) return;
  window.JCIntro = window.JCIntro || {};
  window.JCIntro.__bound = true;
  window.JCIntro.state = { initialized: false };

  function buildLangModal() {
    const modal = document.createElement('div');
    modal.id = 'intro-lang-modal';
    modal.style.cssText = `
      position: fixed; inset: 0; z-index: 999999; 
      display: flex; align-items: center; justify-content: center; 
      background: rgba(0,0,0,0.85);
    `;

    modal.innerHTML = `
      <div style="
        width: 90%; max-width: 420px; padding: 30px 24px; border-radius: 18px;
        background: rgba(15,15,25,0.98); border: 1px solid #d4af37;
        color: #f5e7b0; text-align: center; box-shadow: 0 0 40px rgba(212,175,55,0.4);
      ">
        <h3 style="margin:0 0 12px; font-size:1.55rem; color:#ffd700;">Escolha seu idioma</h3>
        <p style="margin:0 0 24px; font-size:0.97rem; opacity:0.9;">
          Selecione o idioma para navegar. Após confirmar, não será possível alterar.
        </p>

        <select id="intro-lang-select" style="
          width:100%; padding:14px; margin-bottom:20px; border-radius:10px;
          background:rgba(0,0,0,0.7); border:1px solid #d4af37; color:#f5e7b0; font-size:1.05rem;
        ">
          <option value="pt-BR">Português (BR)</option>
          <option value="en-US">English (US)</option>
          <option value="es-ES">Español (ES)</option>
          <option value="fr-FR">Français (FR)</option>
          <option value="zh-CN">中文（简体）</option>
        </select>

        <button id="intro-lang-confirm" style="
          width:100%; padding:16px; font-size:1.2rem; font-weight:bold;
          border:none; border-radius:12px; background: url('/assets/img/textura-de-pedra.jpg') center/cover;
          color:#111; cursor:pointer;
        ">
          Confirmar
        </button>
      </div>
    `;

    return modal;
  }

  async function requireLanguageChoice() {
    const old = document.getElementById('intro-lang-modal');
    if (old) old.remove();

    const modal = buildLangModal();
    document.body.appendChild(modal);

    return new Promise((resolve) => {
      const select = modal.querySelector('#intro-lang-select');
      const btn = modal.querySelector('#intro-lang-confirm');

      btn.addEventListener('click', () => {
        const chosenLang = select.value;

        // Define o idioma
        if (window.i18n?.forceLang) {
          window.i18n.forceLang(chosenLang, true).catch(() => {});
        } else if (window.i18n?.setLang) {
          window.i18n.setLang(chosenLang).catch(() => {});
        }

        localStorage.setItem('i18n_lang', chosenLang);
        document.documentElement.lang = chosenLang.split('-')[0] || 'pt';

        console.log('[IntroLang] Idioma confirmado:', chosenLang);

        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 400);

        resolve(chosenLang);
      });
    });
  }

  async function runTyping(root) {
    if (!root) return;
    console.log('[Typing] Iniciando datilografia após escolha do idioma...');

    const elements = root.querySelectorAll('[data-typing="true"]');
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      if (text) {
        el.textContent = '';
        if (typeof window.runTyping === 'function') {
          await new Promise(r => window.runTyping(el, text, r));
        } else {
          el.textContent = text;
        }
      }
    }
  }

  async function init(root) {
    if (window.JCIntro.state.initialized) return;
    window.JCIntro.state.initialized = true;

    console.log('[Intro] Aguardando escolha de idioma...');
    await requireLanguageChoice();

    console.log('[Intro] Idioma confirmado → iniciando typing');
    await runTyping(root);

    console.log('[Intro] Inicialização completa.');
  }

  function bind() {
    const existing = document.getElementById(SECTION_ID);
    if (existing) init(existing);

    document.addEventListener('section:shown', (e) => {
      if (e?.detail?.sectionId === SECTION_ID) {
        init(e.detail.node || document.getElementById(SECTION_ID));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
