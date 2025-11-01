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

  // ---------------- Utilitários ----------------
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

  // ---------------- JSON dos guias ----------------
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
  async function resolveSelectedGuide() {
    const selId = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
    const guias = await loadGuiasJson();
    const j = guias.find(g => g.id === selId);
    if (j && (j.bgImage || j.nome)) return { id: selId, nome: j.nome || titleize(selId), bgImage: j.bgImage || CARD_BG[selId] || CARD_BG.zion };
    return { id: selId, nome: titleize(selId), bgImage: CARD_BG[selId] || CARD_BG.zion };
  }

  // ---------------- Compat layer: acha ou cria estrutura ----------------
  function ensureStructure(root) {
    // container base (card-stage)
    let stage = root.querySelector('.card-stage, .card-stage-wrap, .card-container, .card');
    if (!stage) {
      stage = document.createElement('div');
      stage.className = 'card-stage';
      root.appendChild(stage);
    }
    stage.style.position = stage.style.position || 'relative';

    // BG do guia: tenta vários seletores; se não existir, cria <img id="guideBg">
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

    // Nome do guia (topo)
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

    // Camada da chama
    let flameLayer = stage.querySelector('.flame-layer');
    if (!flameLayer) {
      flameLayer = document.createElement('div');
      flameLayer.className = 'flame-layer';
      stage.appendChild(flameLayer);
    }

    // SVG + image da selfie
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

    // Rodapé com nome do participante
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

    // Botão continuar
    let btn = root.querySelector('#btnNext, .btn-next-card');
    if (!btn) {
      const actions = root.querySelector('.card-actions') || root.appendChild(Object.assign(document.createElement('div'), {className:'card-actions'}));
      btn = document.createElement('button');
      btn.id = 'btnNext';
      btn.className = 'btn btn-stone';
      btn.textContent = 'Continuar';
      actions.appendChild(btn);
    }

    return { stage, guideBg, guideNameSlot, flameLayer, selfieSvgImage, userNameSlot: userNameSlot, btnNext: btn };
  }

  // ---------------- Inicialização ----------------
  async function initCard(root) {
    // Se a seção veio embrulhada, tenta achar o nó da própria seção
    const section = SECTION_IDS.map(id => root.id === id ? root : qs(`#${id}`, root) || qs(`#${id}`)).find(Boolean) || root;

    const nome = (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase();
    const guia = await resolveSelectedGuide();

    // Garante estrutura e pega refs
    const { guideBg, guideNameSlot, flameLayer, selfieSvgImage, userNameSlot, btnNext } = ensureStructure(section);

    // Aplica BG do guia (preferência por <img>; se não existir, aplica como background do stage)
    if (guideBg && guideBg.tagName === 'IMG') {
      guideBg.src = guia.bgImage;
      guideBg.alt = `${guia.nome} — Card da Irmandade`;
    } else {
      // fallback: usar background no container
      section.style.backgroundImage = `url("${guia.bgImage}")`;
      section.style.backgroundSize = 'cover';
      section.style.backgroundPosition = 'center';
    }
    if (guideNameSlot) guideNameSlot.textContent = (guia.nome || '').toUpperCase();
    if (userNameSlot) userNameSlot.textContent = nome;

    // Selfie (ou placeholder) na chama
    const url = readSelfieUrlOrPlaceholder();
    if (selfieSvgImage) {
      setSvgImageHref(selfieSvgImage, url);
      flameLayer?.classList.add('show');
      selfieSvgImage.addEventListener?.('error', () => {
        setSvgImageHref(selfieSvgImage, PLACEHOLDER_SELFIE);
        flameLayer?.classList.add('show');
      });
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

  // Fallback para render direto
  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS.map(id => qs(`#${id}`)).find(el => el && (el.offsetParent !== null || el.style.display !== 'none'));
    if (visible) initCard(visible);
  });

  console.log(`[${MOD}] carregado (robusto)`);
})();
