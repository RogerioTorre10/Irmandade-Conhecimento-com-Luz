/* /assets/js/section-card.js — REBUILD LIMPO DO CARD (versão estável) */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };

  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---- Dados do usuário (nome + guia + selfie) ----
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    try {
      if (window.JC && window.JC.data) {
        if (window.JC.data.nome) nome = window.JC.data.nome;
        if (window.JC.data.guia) guia = window.JC.data.guia;
      }
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');
      if (lsNome) nome = lsNome;
      if (lsGuia) guia = lsGuia;
    } catch (e) {
      console.warn('[CARD] Erro ao ler dados:', e);
    }

    return {
      nome: (nome || 'AMOR').toUpperCase().trim(),
      guia: (guia || 'zion').toLowerCase().trim()
    };
  }

  // ---- Monta o HTML interno do card (uma vez só) ----
  function buildMarkup(section) {
    if (!section) return;
    if (section.__CARD_BUILT__) return; // não recria

    section.innerHTML = `
      <div class="j-panel-glow card-panel">
        <div class="conteudo-pergaminho">
          <h2
            data-typing="true"
            data-text="Eu na Irmandade"
            data-speed="40"
            data-cursor="true"
            class="titulo-selfie"
          >
            Eu na Irmandade
          </h2>

          <img id="guideBg" class="guide-bg" alt="Fundo do Guia" loading="lazy" />

          <div class="flame-layer show placeholder-only" aria-hidden="true">
            <img
              id="selfieImage"
              class="flame-selfie"
              src="${PLACEHOLDER_SELFIE}"
              alt="Sua foto na Irmandade"
              loading="lazy"
            />
            <div class="card-footer">
              <span class="card-name-badge">
                <span id="userNameSlot">Carregando...</span>
              </span>
            </div>
          </div>

          <div class="card-actions-below">
            <button id="btnNext" class="btn btn-stone">✅ Continuar</button>
          </div>
        </div>
      </div>
    `.trim();

    section.__CARD_BUILT__ = true;
  }

  // ---- Preenche fundo, selfie e nome ----
  function renderCard(section) {
    if (!section) return;

    const { nome, guia } = getUserData();

    const guideBg = qs('#guideBg', section);
    if (guideBg) {
      guideBg.src = CARD_BG[guia] || CARD_BG.zion;
    }

    const selfieImg = qs('#selfieImage', section);
    if (selfieImg) {
      let src = null;
      try {
        src = (window.JC && window.JC.data && window.JC.data.selfieDataUrl) ||
              localStorage.getItem('jc.selfieDataUrl');
      } catch {}
      selfieImg.src = src || PLACEHOLDER_SELFIE;
    }

    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) {
      nameSlot.textContent = nome;
    }

    console.log('%c[CARD] Render ok!', 'color: gold', { nome, guia });
  }

  // ---- Navegação para perguntas ----
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(NEXT_SECTION_ID, { force: true });
    }
  }

  // ---- Inicialização da seção ----
  async function init(root) {
    const section = root || qs('#section-card') || qs('#section-eu-na-irmandade');
    if (!section) return;

    buildMarkup(section);
    renderCard(section);

    const btnNext = qs('#btnNext', section);
    if (btnNext) {
      btnNext.onclick = goNext;
    }

    const typingEls = qsa('[data-typing="true"]', section);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res =>
          window.runTyping(el, text, res, { speed: 40, cursor: true })
        );
      } else {
        el.textContent = text;
      }
    }
  }

  // ---- Listener do controller ----
  document.addEventListener('section:shown', (e) => {
    const id = e.detail && e.detail.sectionId;
    if (!id || SECTION_IDS.indexOf(id) === -1) return;

    const node = e.detail.node || qs('#' + id);
    init(node);
  });

  console.log('[' + MOD + '] carregado');
})();
