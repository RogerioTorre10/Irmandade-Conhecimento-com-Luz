/* /assets/js/section-card.js — robusto: auto-cria estrutura se faltar */
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
  const GUIAS_JSON = '/assets/data/guias.json';
  let GUIAS_CACHE = null;

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

   // ---------- Utilitários ----------
  async function waitForTransitionUnlock(timeoutMs = 12000) {
    if (!window.__TRANSITION_LOCK) return;
    let done = false;
    const p = new Promise(res => {
      const fn = () => { if (!done) { done = true; document.removeEventListener('transition:ended', fn); res(); } };
      document.addEventListener('transition:ended', fn, { once: true });
    });
    const t = new Promise(res => setTimeout(res, timeoutMs));
    await Promise.race([p, t]);
  }

  async function runTypingAndSpeak(el, text) {
    if (!el || !text) return;
    const speed = Number(el.dataset.speed || 40);
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try { window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' }); }
        catch { el.textContent = text; res(); }
      });
    } else {
      el.textContent = '';
      let i = 0;
      await new Promise(res => (function tick(){ (i<text.length) ? (el.textContent+=text[i++], setTimeout(tick, speed)) : res(); })());
    }
    try { await window.EffectCoordinator?.speak?.(text, { rate: 1.0 }); } catch {}
  }

  function readSelfieUrlOrPlaceholder() {
    const keys = ['jornada.selfieDataUrl','selfie.dataUrl','selfieDataUrl','jornada.selfie','selfie.image','selfieImageData'];
    for (const k of keys) {
      try {
        const v = sessionStorage.getItem(k);
        if (v && /^data:image\//.test(v)) return v;
      } catch {}
    }
    return PLACEHOLDER_SELFIE;
  }

  // ---------- JSON dos guias ----------
  async function loadGuiasJson() {
    if (GUIAS_CACHE) return GUIAS_CACHE;
    try {
      const r = await fetch(GUIAS_JSON, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      const arr = Array.isArray(data) ? data : (Array.isArray(data.guias) ? data.guias : []);
      GUIAS_CACHE = arr.map(g => ({
        id: String(g.id || '').toLowerCase(),
        nome: g.nome || g.name || '',
        bgImage: g.bgImage || g.bg || ''
      }));
      console.log(`[${MOD}] guias.json carregado:`, GUIAS_CACHE);
    } catch (e) {
      console.warn(`[${MOD}] Falha ao carregar ${GUIAS_JSON}:`, e);
      GUIAS_CACHE = [];
    }
    return GUIAS_CACHE;
  }
  function titleize(id){ const m={arian:'Arian',lumen:'Lumen',zion:'Zion'}; return m[id] || (id? id[0].toUpperCase()+id.slice(1):''); }
  async function resolveSelectedGuide() {
    const selId = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
    const guias = await loadGuiasJson();
    const j = guias.find(g => g.id === selId);
    if (j && (j.bgImage || j.nome)) return { id: selId, nome: j.nome || titleize(selId), bgImage: j.bgImage || CARD_BG[selId] || CARD_BG.zion };
    return { id: selId, nome: titleize(selId), bgImage: CARD_BG[selId] || CARD_BG.zion };
  }

  // ---------- Compat layer: acha OU cria estrutura mínima ----------
  function ensureStructure(root) {
    // 1) palco/base
    let stage = root.querySelector('.card-stage, .card-stage-wrap, .card-container, .card');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'card-stage';
      root.appendChild(stage);
    }
    stage.style.position = stage.style.position || 'relative';

    // 2) BG do guia
    let guideBg = stage.querySelector('#guideBg, .guide-bg, .card-bg img, img.card-bg');
    if (!guideBg) {
      guideBg = document.createElement('img');
      guideBg.id = 'guideBg';
      guideBg.alt = 'Card da Irmandade';
      guideBg.style.display = 'block';
      guideBg.style.width = '100%';
      guideBg.style.height = 'auto';
      guideBg.loading = 'lazy';
      stage.appendChild(guideBg);
    }

    // 3) Nome do guia (topo)
    let guideNameWrap = stage.querySelector('.card-guide-name');
    if (!guideNameWrap) {
      guideNameWrap = document.createElement('div');
      guideNameWrap.className = 'card-guide-name';
      stage.appendChild(guideNameWrap);
    }
    let guideNameSlot = stage.querySelector('#guideNameSlot') || guideNameWrap.querySelector('span');
    if (!guideNameSlot) {
      guideNameSlot = document.createElement('span');
      guideNameSlot.id = 'guideNameSlot';
      guideNameWrap.appendChild(guideNameSlot);
    }

    // 4) Camada da chama
    let flameLayer = stage.querySelector('.flame-layer');
    if (!flameLayer) {
      flameLayer = document.createElement('div');
      flameLayer.className = 'flame-layer';
      stage.appendChild(flameLayer);
    }

    // 5) Selfie/placeholder com CSS mask (SEM SVG)
    let flameSelfie = stage.querySelector('.flame-selfie');
    if (!flameSelfie) {
      flameLayer.innerHTML = `
        <img class="flame-selfie" id="selfieImage"
             src="${PLACEHOLDER_SELFIE}"
             alt="Selfie ou Placeholder"
             loading="lazy" />`;
      flameSelfie = flameLayer.querySelector('.flame-selfie');
    }

    // 6) Rodapé (nome do participante)
    let footer = stage.querySelector('.card-footer');
    if (!footer) {
      footer = document.createElement('div');
      footer.className = 'card-footer';
      stage.appendChild(footer);
    }
    let badge = footer.querySelector('.card-name-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'card-name-badge';
      footer.appendChild(badge);
    }
    let userNameSlot = footer.querySelector('#userNameSlot');
    if (!userNameSlot) {
      userNameSlot = document.createElement('span');
      userNameSlot.id = 'userNameSlot';
      badge.appendChild(userNameSlot);
    }

    // 7) Ações (botão continuar)
    let btnNext = root.querySelector('#btnNext, .btn-next-card');
    if (!btnNext) {
      const actions = root.querySelector('.card-actions') || root.appendChild(Object.assign(document.createElement('div'), {className:'card-actions'}));
      btnNext = document.createElement('button');
      btnNext.id = 'btnNext';
      btnNext.className = 'btn btn-stone';
      btnNext.textContent = 'Continuar';
      actions.appendChild(btnNext);
    }

    return { stage, guideBg, guideNameSlot, flameLayer, flameSelfie, userNameSlot, btnNext };
  }

  // ---------- Inicialização ----------
  async function initCard(root) {
    // detecta a seção alvo
    const section = SECTION_IDS.map(id => root.id === id ? root : qs(`#${id}`, root) || qs(`#${id}`)).find(Boolean) || root;

    const nome = (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase();
    const guia = await resolveSelectedGuide();

    // Garante estrutura mínima
    const { stage, guideBg, guideNameSlot, flameLayer, flameSelfie, userNameSlot, btnNext } = ensureStructure(section);

    // Altura mínima do palco (evita achatamento por CSS externo)
    if (stage && !stage.style.minHeight) stage.style.minHeight = '52vh';

    // BG do guia → preferir <img>; se falhar, pintar no stage
    if (guideBg && guideBg.tagName === 'IMG') {
      guideBg.src = guia.bgImage;
      guideBg.alt = `${guia.nome} — Card da Irmandade`;
      const applyFallbackBG = () => {
        // se não carregou, pinta o plano de fundo do stage
        if (!guideBg.naturalWidth) {
          stage.style.backgroundImage = `url("${guia.bgImage}")`;
          stage.style.backgroundSize = 'cover';
          stage.style.backgroundPosition = 'center';
        }
      };
      if (guideBg.complete) {
        applyFallbackBG();
      } else {
        guideBg.addEventListener('load', applyFallbackBG, { once: true });
        guideBg.addEventListener('error', applyFallbackBG, { once: true });
      }
    } else {
      stage.style.backgroundImage = `url("${guia.bgImage}")`;
      stage.style.backgroundSize = 'cover';
      stage.style.backgroundPosition = 'center';
    }

    // Nome do guia e do participante
    if (guideNameSlot) guideNameSlot.textContent = (guia.nome || '').toUpperCase();
    if (userNameSlot)  userNameSlot.textContent  = nome;

    // Selfie/placeholder + exibir camada
    const url = readSelfieUrlOrPlaceholder();
    if (flameSelfie && url) {
      flameSelfie.src = url;
      flameLayer?.classList.add('show');
      flameSelfie.addEventListener?.('error', () => {
        flameSelfie.src = PLACEHOLDER_SELFIE;
        flameLayer?.classList.add('show');
      });
    }

    // Espera transição e aplica datilografia/TTS
    await waitForTransitionUnlock();
    const typings = qsa('[data-typing="true"]', section);
    for (const el of typings) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    // Botão continuar
    if (btnNext) {
      btnNext.onclick = () => {
        try { speechSynthesis.cancel(); } catch {}
        qsa('video').forEach(v => { try { v.pause(); v.src=''; v.load(); } catch {} });
        if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
          window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID);
        }
      };
    }

    console.log(`[${MOD}] Card exibido · guia=${guia.id} (${guia.nome}) · participante=${nome}`);
  }

  // ---------- Escutas ----------
  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (!SECTION_IDS.includes(id)) return;
    const root = e.detail.node || qs(`#${id}`) || qs('#jornada-content-wrapper') || document.body;
    initCard(root);
  });

  // Fallback: se a seção já estiver visível sem evento
  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS.map(id => qs(`#${id}`)).find(el => el && (el.offsetParent !== null || el.style.display !== 'none'));
    if (visible) initCard(visible);
  });

  console.log(`[${MOD}] carregado (CSS mask; guias.json; robusto)`);
})();

