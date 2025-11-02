/* /assets/js/section-card.js — robusto: auto-cria estrutura se faltar */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-card-dourado.mp4';

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
  
  function getCardContainer(root) {
  // preferimos renderizar dentro do wrapper oficial
  return root.querySelector('#jornada-content-wrapper') || root;
} 

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

  function setSvgImageHref(imgEl, url) {
    try { imgEl.setAttribute('href', url); } catch {}
    try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch {}
  }

  function readSelfieUrlOrPlaceholder() {
    const keys = ['jornada.selfieDataUrl','selfie.dataUrl','selfieDataUrl','jornada.selfie','selfie.image','selfieImageData'];
    for (const k of keys) { try { const v = sessionStorage.getItem(k); if (v && /^data:image\//.test(v)) return v; } catch {} }
    return PLACEHOLDER_SELFIE;
  }

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
    } catch (e) {
      console.warn(`[${MOD}] Falha ao carregar ${GUIAS_JSON}:`, e);
      GUIAS_CACHE = [];
    }
    return GUIAS_CACHE;
  }

  function titleize(id){ const m={arian:'Arian',lumen:'Lumen',zion:'Zion'}; return m[id] || (id? id[0].toUpperCase()+id.slice(1):''); }

  // Sempre devolve imagem válida
  async function resolveSelectedGuide() {
    const selId = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
    const guias = await loadGuiasJson();
    const j = guias.find(g => g.id === selId);

    const fallback = CARD_BG[selId] || CARD_BG.zion || `/assets/img/${selId}.png`;
    const bgImage = (j && j.bgImage) || fallback;

    return {
      id: selId,
      nome: (j && (j.nome || titleize(selId))) || titleize(selId),
      bgImage
    };
  }

  function readParticipantName() {
   const keys = [
    'jornada.nome', 'jc.nome', 'participantName',
    'jornada.participantName', 'nomeParticipante', 'jc.participant'
  ];
  for (const k of keys) {
    try {
      const v = sessionStorage.getItem(k) || localStorage.getItem(k);
      if (v && String(v).trim()) return String(v).trim();
    } catch {}
  }
  const input = document.querySelector('#guiaNameInput, #nomeParticipante');
  if (input && input.value) return String(input.value).trim();
  return 'USUÁRIO';
 }
  
  // ----- limpeza de imagens inválidas (sem tocar nos elementos do card) -----
  function isBadSrc(src) {
    if (!src) return false;          // <== não remove imagens sem src; o JS ainda vai setar
    src = String(src).trim();
    if (src === 'null' || src === 'undefined' || src === '#') return true;
    if (/^data:image\//.test(src)) return false;
    if (/^https?:\/\//.test(src)) return false;
    if (src.includes('/')) return false;
    if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(src)) return false;
    return true; // ex.: "zion"
  }

  function cleanupBrokenImages(root) {
    qsa('img:not(#guideBg):not(#selfieImage)', root).forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('href');
      if (isBadSrc(src)) img.remove();
      else img.addEventListener?.('error', () => img.remove());
    });
  }

  // ---------------- Compat layer ----------------
  function ensureStructure(root) {
    let stage = root.querySelector('.card-stage, .card-stage-wrap, .card-container, .card');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'card-stage';
      root.appendChild(stage);
    }
    stage.style.position = stage.style.position || 'relative';

    let guideBg = stage.querySelector('#guideBg, .guide-bg, .card-bg img, img.card-bg');
    if (!guideBg) {
      guideBg = document.createElement('img');
      guideBg.id = 'guideBg';
      guideBg.alt = 'Card da Irmandade';
      guideBg.style.display = 'block';
      guideBg.style.width = '100%';
      guideBg.style.height = '100%';
      guideBg.style.objectFit = 'cover';
      guideBg.loading = 'lazy';
      stage.appendChild(guideBg);
    }

    let guideNameSlot = stage.querySelector('#guideNameSlot, .card-guide-name #guideNameSlot, .card-guide-name span');
    let guideNameWrap = stage.querySelector('.card-guide-name');
    if (!guideNameWrap) {
      guideNameWrap = document.createElement('div');
      guideNameWrap.className = 'card-guide-name';
      stage.appendChild(guideNameWrap);
    }
    if (!guideNameSlot) {
      guideNameSlot = document.createElement('span');
      guideNameSlot.id = 'guideNameSlot';
      guideNameWrap.appendChild(guideNameSlot);
    }

    let flameLayer = stage.querySelector('.flame-layer');
    if (!flameLayer) {
      flameLayer = document.createElement('div');
      flameLayer.className = 'flame-layer';
      stage.appendChild(flameLayer);
    }

    let selfieSvgImage = stage.querySelector('#selfieImage');
    if (!selfieSvgImage) {
      flameLayer.innerHTML = `
        <svg viewBox="0 0 1000 1200" xmlns="http://www.w3.org/2000/svg" role="img">
          <defs>
            <mask id="flameMask" maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
              <image href="/assets/img/chama-card.png" x="0" y="0" width="1" height="1" preserveAspectRatio="xMidYMid meet"/>
            </mask>
          </defs>
          <image id="selfieImage" x="0" y="0" width="1000" height="1200" preserveAspectRatio="xMidYMid slice"
                 href="${PLACEHOLDER_SELFIE}" mask="url(#flameMask)"/>
        </svg>`;
      selfieSvgImage = flameLayer.querySelector('#selfieImage');
    }

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

    let btn = root.querySelector('#btnNext, .btn-next-card');
    if (!btn) {
      const actions = root.querySelector('.card-actions') || root.appendChild(Object.assign(document.createElement('div'), {className:'card-actions'}));
      btn = document.createElement('button');
      btn.id = 'btnNext';
      btn.className = 'btn btn-stone';
      btn.textContent = 'Continuar';
      actions.appendChild(btn);
    }

    return { stage, guideBg, guideNameSlot, flameLayer, selfieSvgImage, userNameSlot, btnNext: btn };
  }

  // ---------------- Inicialização ----------------
  async function initCard(root) {
  const section = getCardContainer(root);

    // nome herdado e normalizado
  const nome = readParticipantName().toUpperCase();

   // garante estrutura mínima e que esteja DENTRO do card
  const { stage, guideBg, guideNameSlot, flameLayer, flameSelfie, userNameSlot, btnNext } = ensureStructure(section);

   // escreve o nome no rodapé (dentro do card)
  if (userNameSlot) userNameSlot.textContent = nome;

   // ativa a chama (selfie/placeholder) e mostra o container
  const url = readSelfieUrlOrPlaceholder();
  if (flameSelfie && url) {
  flameSelfie.src = url;
  flameLayer?.classList.add('show');
 }



    const nome = (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase();
    const guia = await resolveSelectedGuide();

    const { guideBg, guideNameSlot, flameLayer, selfieSvgImage, userNameSlot, btnNext } = ensureStructure(section);

    // 1) Configura BG do guia
    if (guideBg && guideBg.tagName === 'IMG') {
      guideBg.src = guia.bgImage;
      guideBg.alt = `${guia.nome} — Card da Irmandade`;
      guideBg.addEventListener?.('error', () => { guideBg.src = CARD_BG.zion; });
    } else {
      section.style.backgroundImage = `url("${guia.bgImage}")`;
      section.style.backgroundSize = 'cover';
      section.style.backgroundPosition = 'center';
    }

    if (guideNameSlot) guideNameSlot.textContent = (guia.nome || '').toUpperCase();
    if (userNameSlot) userNameSlot.textContent = nome;

    // 2) Configura selfie
    const url = readSelfieUrlOrPlaceholder();
    if (selfieSvgImage) {
      setSvgImageHref(selfieSvgImage, url);
      flameLayer?.classList.add('show');
      selfieSvgImage.addEventListener?.('error', () => {
        setSvgImageHref(selfieSvgImage, PLACEHOLDER_SELFIE);
        flameLayer?.classList.add('show');
      });
    }

    // 3) Agora sim: limpa imagens estranhas no container
    cleanupBrokenImages(section);

    // 4) Mensagem datilografada (se existir)
    const intro = qs('#cardIntro', section);
    if (intro) {
      const texto = `Eu na Irmandade — ${guia.nome}. Bem-vindo, ${nome}.`;
      intro.setAttribute('data-text', texto);
    }

    await waitForTransitionUnlock();
    const typings = qsa('[data-typing="true"]', section);
    for (const el of typings) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

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

  // ---------------- Escutas ----------------
  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (!SECTION_IDS.includes(id)) return;
    const root = e.detail.node || qs(`#${id}`) || qs('#jornada-content-wrapper') || document.body;
    initCard(root);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS.map(id => qs(`#${id}`)).find(el => el && (el.offsetParent !== null || el.style.display !== 'none'));
    if (visible) initCard(visible);
  });

  console.log(`[${MOD}] carregado (robusto)`);

// === GUARDIÃO DE EMERGÊNCIA: renderiza o card se ficar "vazio" ===
(function emergencyCardGuard() {
  const MOD = 'section-card.guard';

  async function getGuideDataSafe() {
    try {
      const id = (typeof readSelectedGuideId === 'function') ? readSelectedGuideId() : (sessionStorage.getItem('jornada.guia') || 'zion');
      const data = (typeof loadGuiasJson === 'function') ? await loadGuiasJson() : [];
      const found = data.find(g => String(g.id || '').toLowerCase() === String(id).toLowerCase());
      const map = { arian:'/assets/img/irmandade-quarteto-bg-arian.png', lumen:'/assets/img/irmandade-quarteto-bg-lumen.png', zion:'/assets/img/irmandade-quarteto-bg-zion.png' };
      return {
        id: (found?.id || id || 'zion').toLowerCase(),
        nome: found?.nome || (id[0].toUpperCase()+id.slice(1)),
        bgImage: found?.bgImage || map[(id||'zion').toLowerCase()] || map.zion
      };
    } catch {
      return { id:'zion', nome:'Zion', bgImage:'/assets/img/irmandade-quarteto-bg-zion.png' };
    }
  }

  function readNameSafe() {
    const keys = ['jornada.nome','jc.nome','participantName','jornada.participantName','nomeParticipante','jc.participant'];
    for (const k of keys) {
      try {
        const v = sessionStorage.getItem(k) || localStorage.getItem(k);
        if (v && String(v).trim()) return String(v).trim();
      } catch {}
    }
    const input = document.querySelector('#guiaNameInput, #nomeParticipante');
    if (input?.value) return String(input.value).trim();
    return 'USUÁRIO';
  }

  async function renderFallbackIfEmpty() {
    const sec = document.querySelector('#section-card');
    if (!sec) return;

    // já tem palco e conteúdo?
    const stage = sec.querySelector('.card-stage');
    const hasVisual = !!(stage && (stage.style.backgroundImage || stage.querySelector('#guideBg')));
    if (hasVisual) return;

    // constrói visual mínimo
    const guia = await getGuideDataSafe();
    const nome = readNameSafe().toUpperCase();

    let s = stage || document.createElement('div');
    s.className = 'card-stage';
    s.style.position = 'relative';
    s.style.minHeight = s.style.minHeight || '66vw';
    s.style.paddingBottom = s.style.paddingBottom || '16vh';
    s.style.marginTop = s.style.marginTop || 'min(-4vw, -48px)';
    s.style.backgroundImage = `url("${guia.bgImage}")`;
    s.style.backgroundSize = 'cover';
    s.style.backgroundPosition = 'center';

    if (!stage) sec.appendChild(s);

    // chama
    if (!s.querySelector('.flame-layer')) {
      const flame = document.createElement('div');
      flame.className = 'flame-layer show';
      flame.innerHTML = `<img class="flame-selfie" src="/assets/img/irmandade-card-placeholder.jpg" alt="" />`;
      flame.style.position = 'absolute';
      flame.style.left = '50%';
      flame.style.transform = 'translateX(-50%)';
      flame.style.bottom = '18vh';
      flame.style.width = '46%';
      s.appendChild(flame);
    }

    // rodapé
    if (!s.querySelector('.card-footer')) {
      const foot = document.createElement('div');
      foot.className = 'card-footer';
      foot.style.position = 'absolute';
      foot.style.left = '50%';
      foot.style.transform = 'translateX(-50%)';
      foot.style.bottom = '8vh';
      foot.innerHTML = `<span class="card-name-badge"><span id="userNameSlot">${nome}</span></span>`;
      s.appendChild(foot);
    }

    console.warn(`[${MOD}] Fallback visual aplicado (guia=${guia.id}, nome=${nome}).`);
  }

  // roda logo após o section:shown (com pequeno atraso) e também no DOMContentLoaded
  document.addEventListener('section:shown', (e) => {
    if (e.detail?.sectionId !== 'section-card') return;
    setTimeout(renderFallbackIfEmpty, 50);
  });
  document.addEventListener('DOMContentLoaded', () => setTimeout(renderFallbackIfEmpty, 80));
})();

  
})();
