/* /assets/js/section-card.js — versão consolidada (CSS mask + guias.json + fallbacks) */
(function () {
  'use strict';

  const MOD = 'section-card.js';

  // IDs aceitos para a seção
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];

  // Navegação/fluxo
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';
  
  const PREVIEW_MIN_H = 240;
  const PREVIEW_MAX_H = 420;
  const PREVIEW_VH = 38;
  const PREVIEW_AR_W = 3;
  const PREVIEW_AR_H = 4;
  
  // Imagens fallback e placeholder
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  // Fonte preferencial de dados do guia
  const GUIAS_JSON = '/assets/data/guias.json';
  let GUIAS_CACHE = null;

  // Helpers de DOM
  const qs  = (s, r = document) => r.querySelector(s);
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
  const CANDIDATES = [
    // sessão
    'jornada.selfieDataUrl','selfie.dataUrl','selfieDataUrl',
    'jornada.selfie','selfie.image','selfieImageData',
    // persistente (alguns fluxos salvam aqui)
    'jc.selfie','jc.selfieDataUrl','jc.selfie.image',
    'user.selfie','user.selfieDataUrl'
  ];

  // 1) tenta sessionStorage
  for (const k of CANDIDATES) {
    try {
      const v = sessionStorage.getItem(k);
      if (v && /^data:image\//.test(v)) return v;
    } catch {}
  }
  // 2) tenta localStorage
  for (const k of CANDIDATES) {
    try {
      const v = localStorage.getItem(k);
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
  const actions = root.querySelector('.card-actions') ||
    root.appendChild(Object.assign(document.createElement('div'), { className: 'card-actions' }));

  btnNext = document.createElement('button');
  btnNext.id = 'btnNext';
  btnNext.className = 'btn btn-stone';
  btnNext.textContent = 'Continuar';
  actions.appendChild(btnNext);
}

// --- garante que o botão fique habilitado e clicável ---
btnNext.disabled = false;
btnNext.removeAttribute('aria-disabled');
btnNext.style.pointerEvents = 'auto';
btnNext.style.opacity = '1';
btnNext.style.cursor = 'pointer';
btnNext.style.zIndex = '9999';

// --- adiciona o evento de clique para ir à próxima seção ---
btnNext.addEventListener('click', (ev) => {
  ev.stopPropagation();   // evita interferência de camadas acima
  ev.preventDefault();
  console.log('[section-card.js] Botão Continuar clicado!');
  if (typeof playTransitionThenGo === 'function') {
    playTransitionThenGo('section-perguntas'); // ou o ID da próxima seção
  } else if (window.JC?.nextSection) {
    JC.nextSection('section-perguntas');
  } else {
    console.warn('Função de transição não encontrada.');
  }
});
    
    return { stage, guideBg, guideNameSlot, flameLayer, flameSelfie, userNameSlot, btnNext };
  }

  // ---------- Inicialização ----------
  async function initCard(root) {
    // detecta a seção alvo
    const section = SECTION_IDS.map(id => root.id === id ? root : qs(`#${id}`, root) || qs(`#${id}`)).find(Boolean) || root;

    const nome = (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase();
    const guia = await resolveSelectedGuide();
    
    ['zion','lumen','arian'].forEach(g => section.classList.remove(`guide-${g}`));
    section.classList.add(`guide-${guia.id}`);
    
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
  const isPlaceholder = url === PLACEHOLDER_SELFIE;
  flameSelfie.src = url;

  // garante visibilidade
  flameSelfie.addEventListener?.('load', () => {
    flameLayer?.classList.add('show');
  });
  flameLayer?.classList.add('show');

  // se falhar o carregamento, volta pro placeholder
  flameSelfie.addEventListener?.('error', () => {
    flameSelfie.src = PLACEHOLDER_SELFIE;
    flameLayer?.classList.add('show');
    flameLayer?.classList.add('placeholder-only');
  });

  // adiciona classe especial se for placeholder desde o início
  if (isPlaceholder) {
    flameLayer?.classList.add('placeholder-only');
  }
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

  // === Fallback visual de emergência ===
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const sec = document.querySelector('#section-card');
    if (!sec) return;

    // Garante que a seção está visível
    sec.style.display = 'block';
    sec.style.zIndex = '2';
    sec.style.position = 'relative';

    // Cria palco se não existir
    const sel = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
const MAP = {
  arian: '/assets/img/irmandade-quarteto-bg-arian.png',
  lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
  zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
};
const safeBg = MAP[sel] || MAP.zion;

if (!stage) {
  stage = document.createElement('div');
  stage.className = 'card-stage';
  stage.style.position = 'relative';
  stage.style.minHeight = '66vw';
  stage.style.background = `#000 url("${safeBg}") center/cover no-repeat`;
  sec.appendChild(stage);
  console.warn('[section-card.js] stage recriado manualmente');
}

// Garante fundo se ainda não houver um
if (!stage.style.backgroundImage) {
  stage.style.backgroundImage = `url("${safeBg}")`;
  stage.style.backgroundSize = 'cover';
  stage.style.backgroundPosition = 'center';
}


    // Garante chama e rodapé
    if (!stage.querySelector('.flame-layer')) {
      const flame = document.createElement('div');
      flame.className = 'flame-layer show';
      flame.innerHTML = `<img src="/assets/img/irmandade-card-placeholder.jpg" style="width:45%;border-radius:50%;opacity:0.9;">`;
      flame.style.position = 'absolute';
      flame.style.left = '50%';
      flame.style.bottom = '160px';
      flame.style.transform = 'translateX(-50%)';
      stage.appendChild(flame);
    }

    if (!stage.querySelector('.card-footer')) {
      const foot = document.createElement('div');
      foot.className = 'card-footer';
      foot.innerHTML = `<span class="card-name-badge"><span id="userNameSlot">USUÁRIO</span></span>`;
      foot.style.position = 'absolute';
      foot.style.left = '50%';
      foot.style.bottom = '72px';
      foot.style.transform = 'translateX(-50%)';
      stage.appendChild(foot);
    }

    console.log('[section-card.js] Fallback visual aplicado com sucesso.');
  } catch (err) {
    console.error('[section-card.js] Fallback visual falhou', err);
  }
});

  console.log(`[${MOD}] carregado (CSS mask; guias.json; robusto)`);
})();
