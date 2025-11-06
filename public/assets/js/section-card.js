/* /assets/js/section-card.js — VERSÃO FINAL: Card + Início da Jornada */
(function () {
  'use strict';

  const MOD = 'section-card.js';

  // IDs aceitos para a seção
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  // Imagens fallback
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  const GUIAS_JSON = '/assets/data/guias.json';
  let GUIAS_CACHE = null;

  // Helpers
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
      'jornada.selfieDataUrl','selfie.dataUrl','selfieDataUrl',
      'jornada.selfie','selfie.image','selfieImageData',
      'jc.selfie','jc.selfieDataUrl','jc.selfie.image',
      'user.selfie','user.selfieDataUrl'
    ];

    for (const k of CANDIDATES) {
      try {
        const v = sessionStorage.getItem(k);
        if (v && /^data:image\//.test(v)) return v;
      } catch {}
    }
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

  function titleize(id) {
    const m = { arian: 'Arian', lumen: 'Lumen', zion: 'Zion' };
    return m[id] || (id ? id[0].toUpperCase() + id.slice(1) : '');
  }

  async function resolveSelectedGuide() {
    const selId = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
    const guias = await loadGuiasJson();
    const j = guias.find(g => g.id === selId);
    if (j && (j.bgImage || j.nome)) {
      return { id: selId, nome: j.nome || titleize(selId), bgImage: j.bgImage || CARD_BG[selId] || CARD_BG.zion };
    }
    return { id: selId, nome: titleize(selId), bgImage: CARD_BG[selId] || CARD_BG.zion };
  }

  // ---------- Estrutura do Card ----------
  function ensureStructure(root) {
    let stage = root.querySelector('.card-stage');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'card-stage';
      root.appendChild(stage);
    }
    stage.style.position = 'relative';
    if (!stage.style.minHeight) stage.style.minHeight = '52vh';

    let guideBg = stage.querySelector('#guideBg');
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

    let flameLayer = stage.querySelector('.flame-layer');
    if (!flameLayer) {
      flameLayer = document.createElement('div');
      flameLayer.className = 'flame-layer';
      stage.appendChild(flameLayer);
    }

    let flameSelfie = stage.querySelector('.flame-selfie');
    if (!flameSelfie) {
      flameLayer.innerHTML = `<img class="flame-selfie" id="selfieImage" src="${PLACEHOLDER_SELFIE}" alt="Selfie" loading="lazy">`;
      flameSelfie = flameLayer.querySelector('.flame-selfie');
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

    let btnNext = root.querySelector('#btnNext');
    if (!btnNext) {
      const actions = root.querySelector('.card-actions') || root.appendChild(Object.assign(document.createElement('div'), { className: 'card-actions' }));
      btnNext = document.createElement('button');
      btnNext.id = 'btnNext';
      btnNext.className = 'btn btn-stone';
      btnNext.textContent = 'Continuar';
      actions.appendChild(btnNext);
    }

    btnNext.disabled = false;
    btnNext.style.pointerEvents = 'auto';
    btnNext.style.opacity = '1';
    btnNext.style.cursor = 'pointer';
    btnNext.style.zIndex = '9999';

    btnNext.addEventListener('click', (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      console.log('[section-card.js] Botão Continuar clicado!');
      if (typeof playTransitionThenGo === 'function') {
        playTransitionThenGo(NEXT_SECTION_ID);
      } else if (window.JC?.nextSection) {
        window.JC.nextSection(NEXT_SECTION_ID);
      } else {
        console.warn('Transição não encontrada.');
      }
    });

    return { stage, guideBg, guideNameSlot, flameLayer, flameSelfie, userNameSlot, btnNext };
  }

  // ---------- Leitura Robusta do Nome ----------
  function getParticipantName() {
    const CHAVES = [
      'jornada.nome', 'jornada.participante', 'nomeParticipante',
      'user.name', 'participante.nome', 'jornada.selfie.nome',
      'selfie.nome', 'jc.nome'
    ];
    let nome = 'USUÁRIO';

    for (const chave of CHAVES) {
      const valor = sessionStorage.getItem(chave) || localStorage.getItem(chave);
      if (valor && valor.trim() && !valor.includes('USUÁRIO')) {
        nome = valor.trim();
        console.log(`[${MOD}] Nome encontrado em: ${chave} → ${nome}`);
        break;
      }
    }

    return nome.toUpperCase();
  }

  // ---------- Iniciar Jornada ----------
  function iniciarJornada(guiaId, nome) {
    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) return;

    console.log(`[${MOD}] Iniciando jornada: guia=${guiaId}, nome=${nome}`);

    if (window.Jornada?.iniciar) {
      window.Jornada.iniciar(guiaId, nome.toLowerCase());
    } else if (window.JC?.iniciarJornada) {
      window.JC.iniciarJornada(guiaId, nome);
    } else if (window.iniciarEtapa) {
      window.iniciarEtapa(guiaId);
    } else {
      // Fallback visual
      wrapper.innerHTML = `
        <div style="padding:40px; text-align:center; background:rgba(255,255,220,0.95); border-radius:15px; font-family:Georgia; margin:20px;">
          <h2>Olá, <strong>${nome}</strong>!</h2>
          <p>Você foi chamado pela <strong>${titleize(guiaId)}</strong> para a Jornada da Chama Eterna.</p>
          <p><em>A luz que você carrega já começou a brilhar.</em></p>
        </div>
      `;
    }
  }

  // ---------- Inicialização ----------
  async function initCard(root) {
    const section = SECTION_IDS.map(id => root.id === id ? root : qs(`#${id}`, root) || qs(`#${id}`)).find(Boolean) || root;

    const nome = getParticipantName();
    const guia = await resolveSelectedGuide();

    ['zion','lumen','arian'].forEach(g => section.classList.remove(`guide-${g}`));
    section.classList.add(`guide-${guia.id}`);

    const { guideBg, guideNameSlot, flameLayer, flameSelfie, userNameSlot } = ensureStructure(section);

    // BG
    if (guideBg.tagName === 'IMG') {
      guideBg.src = guia.bgImage;
      guideBg.alt = `${guia.nome} — Card da Irmandade`;
      const applyFallback = () => {
        if (!guideBg.naturalWidth) {
          guideBg.closest('.card-stage').style.backgroundImage = `url("${guia.bgImage}")`;
          guideBg.closest('.card-stage').style.backgroundSize = 'cover';
        }
      };
      guideBg.complete ? applyFallback() : guideBg.onload = guideBg.onerror = applyFallback;
    }

    // Nomes
    if (guideNameSlot) guideNameSlot.textContent = (guia.nome || '').toUpperCase();
    if (userNameSlot) userNameSlot.textContent = nome;

    // Selfie
    const url = readSelfieUrlOrPlaceholder();
    if (flameSelfie && url) {
      const isPlaceholder = url === PLACEHOLDER_SELFIE;
      flameSelfie.src = url;
      flameSelfie.onload = () => flameLayer.classList.add('show');
      flameSelfie.onerror = () => {
        flameSelfie.src = PLACEHOLDER_SELFIE;
        flameLayer.classList.add('show', 'placeholder-only');
      };
      if (isPlaceholder) flameLayer.classList.add('placeholder-only');
      flameLayer.classList.add('show');
    }

    await waitForTransitionUnlock();
    for (const el of qsa('[data-typing="true"]', section)) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    console.log(`[${MOD}] Card exibido · guia=${guia.id} (${guia.nome}) · participante=${nome}`);

    // === INICIAR JORNADA (era feito na selfie) ===
    setTimeout(() => iniciarJornada(guia.id, nome), 600);
  }

  // ---------- Escutas ----------
  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (!SECTION_IDS.includes(id)) return;
    const root = e.detail.node || qs(`#${id}`) || qs('#jornada-content-wrapper') || document.body;
    initCard(root);
  });

  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS.map(id => qs(`#${id}`)).find(el => el && el.offsetParent !== null);
    if (visible) initCard(visible);
  });

  console.log(`[${MOD}] carregado e pronto para iniciar a jornada`);
})();
