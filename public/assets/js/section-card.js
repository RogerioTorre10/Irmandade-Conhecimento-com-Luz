/* /assets/js/section-card.js — BUILD FINAL COM i18n + typing */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-dados-pessoais';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    arion: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };

  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.png';

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // =========================
  // DADOS
  // =========================

  function canonGuia(v) {
    const s = String(v || '').trim().toLowerCase();
    if (s.includes('lumen')) return 'lumen';
    if (s.includes('zion')) return 'zion';
    if (s.includes('arion') || s.includes('arian')) return 'arion';
    return 'zion';
  }

  function prettyGuia(id) {
    return id === 'lumen' ? 'Lumen'
      : id === 'zion'  ? 'Zion'
      : 'Arion';
  }

  function getNome() {
    return (
      window.JC?.data?.nome ||
      sessionStorage.getItem('jornada.nome') ||
      localStorage.getItem('jc.nome') ||
      'AMOR'
    ).toUpperCase();
  }

  function getGuiaCanon() {
    return canonGuia(
      window.JC?.data?.guia ||
      sessionStorage.getItem('jornada.guia') ||
      localStorage.getItem('jc.guia')
    );
  }

  // =========================
  // i18n (🔥 CORREÇÃO PRINCIPAL)
  // =========================

  function applyCardI18n(section) {
    const title = qs('#card-title', section);
    const btn = qs('#btnNext', section);

    const translatedTitle =
      window.i18n?.t?.('card.title') ||
      'Eu na Irmandade';

    const translatedBtn =
      window.i18n?.t?.('card.continuar') ||
      'Continuar';

    if (title) {
      title.textContent = '';
      title.setAttribute('data-typing', 'true');

      if (window.typeWriter) {
        window.typeWriter(title, translatedTitle, 40);
      } else {
        title.textContent = translatedTitle;
      }
    }

    if (btn) {
      btn.textContent = translatedBtn;
    }
  }

  // =========================
  // MARKUP (🔥 CORRIGIDO)
  // =========================

  function buildMarkup(section) {
    if (section.__BUILT__) return;

    section.innerHTML = `
      <div class="j-panel-glow card-panel">
        <div class="conteudo-pergaminho">

          <h2 id="card-title" class="titulo-selfie"></h2>

          <img id="guideBg" class="guide-bg" />

          <div class="flame-layer show placeholder-only">
            <img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" />

            <div class="card-footer">
              <span class="card-name-badge">
                <span id="userNameSlot"></span>
              </span>
            </div>
          </div>

          <div class="card-actions-below">
            <button id="btnNext" class="btn btn-stone"></button>
          </div>

        </div>
      </div>
    `;

    section.__BUILT__ = true;
  }

  // =========================
  // RENDER
  // =========================

  function renderCard(section) {
    const nome = getNome();
    const guia = getGuiaCanon();

    qs('#guideBg', section).src = CARD_BG[guia];
    qs('#userNameSlot', section).textContent = nome;

    const selfie =
      window.JC?.data?.selfieDataUrl ||
      localStorage.getItem('jc.selfieDataUrl');

    if (selfie) {
      qs('#selfieImage', section).src = selfie;
    }

    applyCardI18n(section);

    console.log('[CARD] OK', { nome, guia });
  }

  // =========================
  // NAVEGAÇÃO
  // =========================

  function goNext() {
    if (window.playTransitionVideo) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else {
      window.JC?.show?.(NEXT_SECTION_ID, { force: true });
    }
  }

  function bind(section) {
    const btn = qs('#btnNext', section);
    if (btn && !btn.__BOUND__) {
      btn.__BOUND__ = true;
      btn.onclick = goNext;
    }
  }

  // =========================
  // INIT
  // =========================

  function init(section) {
    buildMarkup(section);
    renderCard(section);
    bind(section);
  }

  // =========================
  // EVENTOS
  // =========================

  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId;
    if (!SECTION_IDS.includes(id)) return;

    const node = document.getElementById(id);
    if (!node) return;

    init(node);
  });

  document.addEventListener('i18n:changed', () => {
    const section = document.getElementById('section-card');
    if (!section?.classList.contains('active')) return;

    applyCardI18n(section);
  });

  console.log('[section-card] FINAL carregado');
})();
