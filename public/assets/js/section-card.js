/* /assets/js/section-card.js — REWRITE v3 (estável)
   Objetivo: restaurar a lógica da página CARD de forma idempotente e previsível.

   Principais pontos:
   • Inicializa sozinho (no load) e também expõe hooks manuais: window.JCCard.init(), window.__forceInitCard()
   • Lê dados de várias fontes (window.JC.data → sessionStorage → localStorage)
   • Cria a estrutura do card no contêiner correto (#section-conteudo, .conteudo-pergaminho, .card-wrap, ou o próprio #section-card)
   • Injeta CSS de proteção para elevar o palco sobre o pergaminho e neutralizar overlays
   • Renderiza BG do guia, selfie (ou placeholder) e nome; liga o botão Continuar ao fluxo real
   • Idempotente: não duplica DOM, não entra em loop, pode ser chamado várias vezes
*/
(function (global) {
  'use strict';

  // ==========================
  // Namespace / guardas
  // ==========================
  const MOD = 'section-card.js@v3';
  const d = document;
  const NS = (global.JCCard = global.JCCard || {});
  if (NS.__bound) return; // evita múltiplos binds
  NS.__bound = true;

  // ==========================
  // Config
  // ==========================
  const DEFAULT_NEXT_SECTION_ID = 'section-perguntas';
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png',
  };

  // ==========================
  // Utils
  // ==========================
  const qid = (id) => d.getElementById(id);
  const qs  = (sel, root = d) => root.querySelector(sel);
  const on  = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  function pickGuideBg(guia) {
    return CARD_BG[guia] || CARD_BG.zion;
  }

  function getUserData() {
    const jc = (global.JC && global.JC.data) ? global.JC.data : {};

    let guia = jc.guia || sessionStorage.getItem('jornada.guia') || localStorage.getItem('jc.guia') || 'zion';
    let nome = jc.nome || jc.participantName || localStorage.getItem('jc.nome') || 'USUÁRIO';
    let selfieDataUrl = jc.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl') || null;

    guia = String(guia).toLowerCase().trim();
    nome = String(nome).toUpperCase().trim();

    return { guia, nome, selfieDataUrl };
  }

  function resolveGoNext() {
    // Preferência: transição com vídeo, depois transição genérica, depois controlador da jornada.
    if (typeof global.playTransitionVideo === 'function') {
      return (nextId = DEFAULT_NEXT_SECTION_ID) => global.playTransitionVideo('/assets/videos/filme-0-ao-encontro-da-jornada.mp4', nextId);
    }
    if (typeof global.playTransitionThenGo === 'function') {
      return (nextId = DEFAULT_NEXT_SECTION_ID) => global.playTransitionThenGo(nextId);
    }
    if (global.JC && typeof global.JC.show === 'function') {
      return (nextId = DEFAULT_NEXT_SECTION_ID) => global.JC.show(nextId, { force: true });
    }
    // Fallback: hash
    return (nextId = DEFAULT_NEXT_SECTION_ID) => { try { location.hash = '#' + nextId; } catch {} };
  }

  // ==========================
  // CSS de proteção (injetado 1x)
  // ==========================
  function injectCardCSS() {
    if (qid('card-hotfix')) return;
    const css = `#section-card{position:relative;isolation:isolate}
#section-card .card-stage{position:relative;z-index:20;min-height:clamp(560px,66vw,920px);overflow:hidden}
#section-card #guideBg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1;display:block}
#section-card .flame-layer{position:absolute;left:50%;bottom:clamp(96px,14vh,160px);transform:translateX(-50%);width:clamp(240px,38%,520px);z-index:30}
#section-card .card-footer{position:absolute;left:50%;bottom:clamp(56px,9vh,96px);transform:translateX(-50%);z-index:31}
#section-card #btnNext{position:absolute;left:50%;bottom:clamp(16px,6vh,40px);transform:translateX(-50%);z-index:32}
/* Neutraliza overlays do pergaminho que possam cobrir o palco */
.pergaminho::before,.pergaminho-v::before,#section-card.pergaminho::before,#section-card.pergaminho-v::before{z-index:0!important;pointer-events:none!important}
/* Se a seção injeta filhos extras, esconda-os mantendo apenas o palco */
#section-card .conteudo-pergaminho > *:not(.card-stage),
#section-card #section-conteudo > *:not(.card-stage){display:none!important}`;
    const s = d.createElement('style');
    s.id = 'card-hotfix';
    s.textContent = css;
    d.head.appendChild(s);
  }

  // ==========================
  // DOM / Estrutura
  // ==========================
  function resolveContainer() {
    const sec = qid('section-card');
    if (!sec) return null;
    return (
      sec.querySelector('#section-conteudo') ||
      sec.querySelector('.conteudo-pergaminho') ||
      sec.querySelector('.card-wrap') ||
      sec
    );
  }

  function buildStructureOnce(container) {
    if (!container) return null;
    if (container.querySelector('.card-stage')) return container.querySelector('.card-stage');

    const stage = d.createElement('div');
    stage.className = 'card-stage';

    stage.innerHTML = `
      <img id="guideBg" class="guide-bg" src="${pickGuideBg('zion')}" alt="Fundo do Guia"/>
      <div class="flame-layer"><img id="selfieImage" class="flame-selfie" src="${PLACEHOLDER_SELFIE}" alt="Selfie"/></div>
      <div class="card-footer"><span class="card-name-badge"><span id="userNameSlot">USUÁRIO</span></span></div>
      <button id="btnNext" class="btn btn-stone" disabled>Continuar</button>
    `;

    container.appendChild(stage);
    return stage;
  }

  // ==========================
  // Render
  // ==========================
  let _rendering = false;
  function render() {
    if (_rendering) return; // evita reentrância
    _rendering = true;
    try {
      const container = resolveContainer();
      if (!container) return;

      const stage = buildStructureOnce(container);
      if (!stage) return;

      const { guia, nome, selfieDataUrl } = getUserData();

      const guideBg     = qid('guideBg');
      const selfieImage = qid('selfieImage');
      const nameSlot    = qid('userNameSlot');
      const btnNext     = qid('btnNext');

      // BG
      const bgUrl = pickGuideBg(guia);
      if (guideBg && guideBg.src !== bgUrl) {
        guideBg.style.opacity = '0';
        guideBg.onload = () => (guideBg.style.opacity = '1');
        guideBg.onerror = () => { guideBg.src = pickGuideBg('zion'); guideBg.style.opacity = '1'; };
        guideBg.src = bgUrl;
      }

      // Selfie
      const finalSelfie = selfieDataUrl || PLACEHOLDER_SELFIE;
      if (selfieImage && selfieImage.src !== finalSelfie) selfieImage.src = finalSelfie;

      // Nome
      if (nameSlot) nameSlot.textContent = nome || 'USUÁRIO';

      // Botão
      if (btnNext) {
        btnNext.disabled = false;
        btnNext.style.pointerEvents = 'auto';
        const goNext = resolveGoNext();
        btnNext.onclick = () => goNext(DEFAULT_NEXT_SECTION_ID);
      }

      // Evento
      try { d.dispatchEvent(new CustomEvent('section:card:rendered', { detail: { guia, nome } })); } catch {}
      console.log(`[${MOD}] Render OK`, { guia, nome, hasSelfie: !!selfieDataUrl });
    } finally {
      _rendering = false;
    }
  }

  // ==========================
  // Init
  // ==========================
  function init() {
    injectCardCSS();
    render();
  }

  // Expor hooks
  NS.init = init;
  NS.render = render;
  global.__forceInitCard = init;

  if (d.readyState === 'loading') {
    on(d, 'DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  console.log(`[${MOD}] bound`);
})(window);
