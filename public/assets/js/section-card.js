/* /assets/js/section-card.js — v4.4-final (LOOP CORRIGIDO)
   - Botão FORA do card, ABAIXO do rodapé
   - Sem loop no storage
   - Renderiza ao carregar e ao sync
   - Compatível com guias.json, storage, vídeo
*/
(function () {
  'use strict';
  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion: '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';
  const GUIAS_JSON = '/assets/data/guias.json';
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));
  const log = (...a) => console.log(`%c[${MOD}]`, 'color:#7dd3fc', ...a);

  let GUIA_BG_CACHE = null;
  let isRendering = false;

  async function maybeLoadGuias() {
    if (GUIA_BG_CACHE) return GUIA_BG_CACHE;
    try {
      const res = await fetch(GUIAS_JSON, { cache: 'no-store' });
      if (!res.ok) throw new Error('guias.json não encontrado');
      const arr = await res.json();
      GUIA_BG_CACHE = {};
      for (const g of arr) {
        const key = (g.id || g.key || (g.nome || '').toLowerCase() || '').toString().toLowerCase();
        const bg = g.bgImage || g.bg || g.image;
        if (key && bg) GUIA_BG_CACHE[key] = bg.startsWith('/') ? bg : `/assets/img/${bg}`;
      }
      log('guias.json carregado', GUIA_BG_CACHE);
    } catch (e) {
      GUIA_BG_CACHE = {};
      log('Usando BGs estáticos (sem guias.json)');
    }
    return GUIA_BG_CACHE;
  }

  // SYNC SEM LOOP
  window.addEventListener('storage', (e) => {
    if (!['jc.guia', 'jc.nome', 'jc.selfieDataUrl'].includes(e.key)) return;

    const current = getUserData();
    const shouldRender = 
      (e.key === 'jc.guia' && e.newValue !== current.guia) ||
      (e.key === 'jc.nome' && e.newValue !== current.nome) ||
      (e.key === 'jc.selfieDataUrl');

    if (shouldRender) {
      log('SYNC: dados mudaram, re-renderizando');
      renderCard();
    }
  });

  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';
    try {
      const ssNome = sessionStorage.getItem('jornada.nome');
      const ssGuia = sessionStorage.getItem('jornada.guia');
      if (ssNome) nome = ssNome;
      if (ssGuia) guia = ssGuia;
      const lsNome = localStorage.getItem('jc.nome');
      const lsGuia = localStorage.getItem('jc.guia');
      if (lsNome) nome = lsNome;
      if (lsGuia) guia = lsGuia;
      if (window.JC?.data) {
        if (window.JC.data.nome) nome = window.JC.data.nome;
        if (window.JC.data.guia) guia = window.JC.data.guia;
      }
    } catch {}
    nome = (nome || 'AMOR').toString().toUpperCase().trim();
    guia = (guia || 'zion').toString().toLowerCase().trim();
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

  function ensureStructure(root) {
    if (!root) return {};

    let stage = qs('.card-stage', root);
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'card-stage';
      stage.style.position = 'relative';
      root.appendChild(stage);
    }

    let guideBg = qs('#guideBg', stage);
    if (!guideBg) {
      guideBg = document.createElement('img');
      guideBg.id = 'guideBg';
      guideBg.alt = 'Fundo do guia';
      guideBg.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;';
      stage.appendChild(guideBg);
    }

    let overlay = qs('#cardOverlay', stage);
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'cardOverlay';
      overlay.className = 'card-overlay';
      overlay.style.cssText = 'position:absolute;inset:0;z-index:2;pointer-events:none;';
      stage.appendChild(overlay);
    }

    let inner = qs('#cardInner', stage);
    if (!inner) {
      inner = document.createElement('div');
      inner.id = 'cardInner';
      inner.className = 'card-inner';
      inner.style.cssText = 'position:relative;z-index:3;';
      stage.appendChild(inner);
    }

    let flameLayer = qs('.flame-layer', stage);
    if (!flameLayer) {
      flameLayer = document.createElement('div');
      flameLayer.className = 'flame-layer';
      flameLayer.style.cssText =
        'position:absolute;left:50%;bottom:160px;transform:translateX(-50%);width:38%;z-index:3;';
      flameLayer.innerHTML = `<img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" alt="Selfie">`;
      stage.appendChild(flameLayer);
    }

    let footer = qs('.card-footer', stage);
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'card-footer';
      footer.style.cssText =
        'position:absolute;left:50%;bottom:72px;transform:translateX(-50%);z-index:4;';
      footer.innerHTML =
        `<span class="card-name-badge"><span id="cardName"></span></span>`;
      stage.appendChild(footer);
    } else {
      const hasCardName = qs('#cardName', footer);
      const userSlot = qs('#userNameSlot', footer);
      if (!hasCardName && !userSlot) {
        const span = document.createElement('span');
        span.className = 'card-name-badge';
        span.innerHTML = `<span id="cardName"></span>`;
        footer.appendChild(span);
      }
    }

    // BOTÃO CONTINUAR — FORA DO CARD
    let actionsBelow = qs('.card-actions-below', root);
    if (!actionsBelow) {
      actionsBelow = document.createElement('div');
      actionsBelow.className = 'card-actions-below';
      root.appendChild(actionsBelow);
    }

    let btnNext = qs('#btnNext', actionsBelow);
    if (!btnNext) {
      btnNext = document.createElement('button');
      btnNext.id = 'btnNext';
      btnNext.className = 'btn btn-stone';
      btnNext.textContent = 'Continuar';
      actionsBelow.appendChild(btnNext);
    }

    btnNext.style.pointerEvents = 'auto';
    btnNext.disabled = false;
    btnNext.onclick = goNext;

    return { stage, guideBg };
  }

  async function applyGuideBG(section, guia) {
    const guideBg = qs('#guideBg', section);
    if (!guideBg) return;
    const cache = await maybeLoadGuias();
    const fromJson = cache[guia];
    const fromConst = CARD_BG[guia] || CARD_BG.zion;
    const target = fromJson || fromConst;
    if (!guideBg.src) guideBg.src = CARD_BG.zion;
    if (guideBg.src !== target) {
      guideBg.style.opacity = '0';
      guideBg.onload = () => { guideBg.style.opacity = '1'; guideBg.onload = null; };
      guideBg.onerror = () => { guideBg.src = CARD_BG.zion; guideBg.style.opacity = '1'; };
      guideBg.src = target;
    } else {
      guideBg.style.opacity = '1';
    }
  }

  async function renderCard() {
    if (isRendering) {
      log('renderCard já em execução, ignorando');
      return;
    }
    isRendering = true;

    try {
      const section = qs('#section-card') || qs('#section-eu-na-irmandade');
      if (!section) return;

      ensureStructure(section);
      const { nome, guia } = getUserData();
      await applyGuideBG(section, guia);

      const selfieImg = qs('#selfieImage', section);
      if (selfieImg) {
        const url = window.JC?.data?.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl');
        selfieImg.src = url || PLACEHOLDER_SELFIE;
        const flameLayer = selfieImg.closest('.flame-layer');
        if (flameLayer) flameLayer.classList.add('show');
      }

      const el1 = qs('#cardName', section);
      const el2 = qs('#userNameSlot', section);
      if (el1) el1.textContent = nome;
      if (el2) el2.textContent = nome;

      log('Renderizado', { guia, nome });
    } finally {
      isRendering = false;
    }
  }

  function goNext() {
    try { speechSynthesis.cancel(); } catch {}
    qsa('video').forEach(v => { try { v.pause(); v.src = ''; } catch {} });
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else {
      const v = document.createElement('video');
      v.src = VIDEO_SRC;
      v.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:9999;background:#000;';
      v.muted = true; v.playsInline = true;
      v.onended = () => { v.remove(); window.JC?.show?.(NEXT_SECTION_ID, { force: true }); };
      document.body.appendChild(v);
      v.play().catch(() => { v.remove(); window.JC?.show?.(NEXT_SECTION_ID, { force: true }); });
    }
  }

  async function initCard(root) {
    await renderCard();
    const typingEls = qsa('[data-typing="true"]', root);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res => window.runTyping(el, text, res, { speed: 40, cursor: true }));
      } else {
        el.textContent = text;
      }
      if (typeof window.speak === 'function') window.speak(text);
    }
  }

  // EVENTO PRINCIPAL
  document.addEventListener('section:shown', e => {
    const id = e.detail.sectionId;
    if (SECTION_IDS.includes(id)) {
      const root = e.detail.node || qs(`#${id}`) || document.body;
      ensureStructure(root);
      renderCard();
      initCard(root);
    }
  });

  // AUTOINIT
  document.addEventListener('DOMContentLoaded', () => {
    const sec = qs('#section-card') || qs('#section-eu-na-irmandade');
    if (sec && !sec.querySelector('.card-stage')) {
      ensureStructure(sec);
      renderCard();
    }
  });

  log('carregado e pronto!');
})();
