/* /assets/js/section-card.js — CSS manda, JS só garante estrutura + dados + navegação */
(function () {
  'use strict';

  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };

  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  const qs  = (s, r = document) => (r || document).querySelector(s);
  const qsa = (s, r = document) => Array.from((r || document).querySelectorAll(s));

  if (window.__JC_CARD_BOUND__) return;
  window.__JC_CARD_BOUND__ = true;

  window.addEventListener('storage', (e) => {
    if (e.key === 'jc.guia' || e.key === 'jc.nome' || e.key === 'jc.selfieDataUrl') {
      renderCard();
    }
  });

  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    if (window.JC?.data) {
      if (window.JC.data.nome) nome = window.JC.data.nome;
      if (window.JC.data.guia) guia = window.JC.data.guia;
    }

    const lsNome = localStorage.getItem('jc.nome');
    const lsGuia = localStorage.getItem('jc.guia');
    if (lsNome) nome = lsNome;
    if (lsGuia) guia = lsGuia;

    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssGuia) guia = ssGuia;

    nome = String(nome).toUpperCase().trim();
    guia = String(guia).toLowerCase().trim();

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      localStorage.setItem('jc.nome', nome);
      localStorage.setItem('jc.guia', guia);
      sessionStorage.setItem('jornada.guia', guia);
    } catch {}

    return { nome, guia };
  }

  function ensureStructure(section) {
    if (!section) return null;

    // 1) card-stage
    let stage = qs('.card-stage', section);
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'card-stage';
      section.appendChild(stage);
    }

    // 2) imagem de fundo do guia
    let guideBg = qs('#guideBg', stage) || qs('img.card-guide-bg', stage);
    if (!guideBg) {
      guideBg = document.createElement('img');
      guideBg.id = 'guideBg';
      guideBg.className = 'card-guide-bg';
      guideBg.alt = 'Guia';
      stage.appendChild(guideBg);
    }

    // 3) flame-layer + selfieImage
    let flameLayer = qs('.flame-layer', stage);
    if (!flameLayer) {
      flameLayer = document.createElement('div');
      flameLayer.className = 'flame-layer';
      stage.appendChild(flameLayer);
    }

    let selfieImg = qs('#selfieImage', flameLayer) || qs('#selfieImage', stage);
    if (!selfieImg) {
      selfieImg = document.createElement('img');
      selfieImg.id = 'selfieImage';
      selfieImg.className = 'flame-selfie';
      selfieImg.alt = 'Selfie do participante';
      flameLayer.appendChild(selfieImg);
    } else if (selfieImg.parentElement !== flameLayer) {
      flameLayer.appendChild(selfieImg);
    }

    // 4) rodapé com nome
    let footer = qs('.card-footer', stage);
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'card-footer';
      stage.appendChild(footer);
    }

    let nameSlot = qs('#userNameSlot', footer) || qs('#userNameSlot', stage);
    if (!nameSlot) {
      nameSlot = document.createElement('div');
      nameSlot.id = 'userNameSlot';
      footer.appendChild(nameSlot);
    } else if (nameSlot.parentElement !== footer) {
      footer.appendChild(nameSlot);
    }

    // 5) ações abaixo do card (fora da selfie)
    let actionsBelow = qs('.card-actions-below', section);
    if (!actionsBelow) {
      actionsBelow = document.createElement('div');
      actionsBelow.className = 'card-actions-below';
      section.appendChild(actionsBelow);
    }

    // 6) botão continuar
    let btnNext = qs('#btnNext', actionsBelow) || qs('.btn-next-card', actionsBelow);
    if (!btnNext) {
      btnNext = document.createElement('button');
      btnNext.id = 'btnNext';
      btnNext.className = 'btn btn-stone btn-next-card';
      btnNext.textContent = 'Continuar';
      actionsBelow.appendChild(btnNext);
    }

    return stage;
  }

  function renderCard() {
    const section = qs('#section-card') || qs('#section-eu-na-irmandade');
    if (!section) return;

    ensureStructure(section);

    const { nome, guia } = getUserData();

    const stage = qs('.card-stage', section);
    if (!stage) return;

    // fundo do guia
    const guideBg = qs('#guideBg', stage) || qs('img.card-guide-bg', stage);
    if (guideBg) {
      const bgUrl = CARD_BG[guia] || CARD_BG.zion;
      if (guideBg.src !== bgUrl) guideBg.src = bgUrl;
    }

    // selfie / placeholder
    const selfieImg = qs('#selfieImage', stage);
    if (selfieImg) {
      const url =
        window.JC?.data?.selfieDataUrl ||
        localStorage.getItem('jc.selfieDataUrl');

      const finalUrl = url || PLACEHOLDER_SELFIE;
      if (selfieImg.src !== finalUrl) selfieImg.src = finalUrl;

      const flameLayer = selfieImg.closest('.flame-layer');
      if (flameLayer) flameLayer.classList.add('show');
    }

    // nome
    const nameSlot = qs('#userNameSlot', stage);
    if (nameSlot) nameSlot.textContent = nome;
  }

  function goNext() {
    try { speechSynthesis.cancel(); } catch {}
    qsa('video').forEach(v => { try { v.pause(); } catch {} });

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    const v = document.createElement('video');
    v.src = VIDEO_SRC;
    v.muted = true;
    v.playsInline = true;
    v.autoplay = true;

    v.onended = () => {
      v.remove();
      if (typeof window.JC?.show === 'function') {
        window.JC.show(NEXT_SECTION_ID, { force: true });
      }
    };

    document.body.appendChild(v);
    v.play().catch(() => {
      v.remove();
      if (typeof window.JC?.show === 'function') {
        window.JC.show(NEXT_SECTION_ID, { force: true });
      }
    });
  }

  async function initCard(root) {
    if (!root || root.dataset.cardInit === 'true') return;
    root.dataset.cardInit = 'true';

    ensureStructure(root);
    renderCard();

    const btnNext = qs('#btnNext', root);
    if (btnNext) btnNext.onclick = goNext;

    const typingEls = qsa('[data-typing="true"]', root);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res =>
          window.runTyping(el, text, res, { speed: 40, cursor: true })
        );
      } else {
        el.textContent = text;
      }
      if (typeof window.speak === 'function') window.speak(text);
    }
  }

  document.addEventListener('section:shown', (e) => {
    const id = e.detail?.sectionId;
    if (!SECTION_IDS.includes(id)) return;
    const root = e.detail?.node || qs(`#${id}`) || document.body;
    initCard(root);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS
      .map(id => qs(`#${id}`))
      .find(el => el && el.offsetParent !== null);
    if (visible) initCard(visible);
  });

})();
