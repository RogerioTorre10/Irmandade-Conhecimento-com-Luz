/* /assets/js/section-card.js — robusto: auto-cria estrutura se faltar + valida nome */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const PREV_SECTION_ID = 'section-guia';
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

  // -------- Utils --------
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

  // -------- Nome do participante: validar/sanitizar --------
  function sanitizeName(name) {
    if (!name || typeof name !== 'string') return '';
    // normaliza espaços e remove múltiplos
    let n = name.replace(/\s+/g, ' ').trim();
    // limita tamanho razoável
    if (n.length > 60) n = n.slice(0, 60);
    return n;
  }

  function isValidName(name) {
    // Letras (com acentos), espaços, hífen, apóstrofo, ponto — 2 a 60 chars
    return /^[A-Za-zÀ-ÖØ-öø-ÿ'’\-\.\s]{2,60}$/u.test(name);
  }

  function getParticipantNameValidated() {
    // procura em várias chaves para compatibilidade
    const keys = [
      'jornada.nome', 'jc.nome', 'participantName',
      'jornada.participante', 'jornada.guia.nome'
    ];
    let raw = '';
    for (const k of keys) {
      try { const v = sessionStorage.getItem(k); if (v) { raw = v; break; } } catch {}
    }
    let n = sanitizeName(raw);
    if (!n || !isValidName(n)) {
      return { ok: false, name: '', reason: 'missing_or_invalid' };
    }
    // título-caso leve (mantendo maiúsculas de siglas se houver)
    const titled = n.split(' ').map(p => p ? (p[0].toUpperCase() + p.slice(1).toLowerCase()) : '').join(' ');
    // persiste normalizado para uso futuro
    try { sessionStorage.setItem('jornada.nome', titled); } catch {}
    return { ok: true, name: titled };
  }

  // -------- Guias JSON --------
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
    const fallback = CARD_BG[selId] || CARD_BG.zion || `/assets/img/${selId}.png`;
    const bgImage = (j && j.bgImage) || fallback;
    return { id: selId, nome: (j && (j.nome || titleize(selId))) || titleize(selId), bgImage };
  }

  // -------- limpeza de imagens estranhas --------
  function isBadSrc(src) {
    if (!src) return false; // não remove sem src: será preenchido
    src = String(src).trim();
    if (src === 'null' || src === 'undefined' || src === '#') return true;
    if (/^data:image\//.test(src)) return false;
    if (/^https?:\/\//.test(src)) return false;
    if (src.includes('/')) return false;
    if (/\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(src)) return false;
    return true;
  }
  function cleanupBrokenImages(root) {
    qsa('img:not(#guideBg):not(#selfieImage)', root).forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('href');
      if (isBadSrc(src)) img.remove();
      else img.addEventListener?.('error', () => img.remove());
    });
  }

  // -------- compat: estrutura --------
  function ensureStructure(root) {
    let stage = root.querySelector('.card-stage, .card-stage-wrap, .card-container, .card');
    if (!stage) {
      stage = document.createElement('div'); stage.className = 'card-stage'; root.appendChild(stage);
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
    if (!guideNameWrap) { guideNameWrap = document.createElement('div'); guideNameWrap.className = 'card-guide-name'; stage.appendChild(guideNameWrap); }
    if (!guideNameSlot) { guideNameSlot = document.createElement('span'); guideNameSlot.id = 'guideNameSlot'; guideNameWrap.appendChild(guideNameSlot); }

    let flameLayer = stage.querySelector('.flame-layer');
    if (!flameLayer) { flameLayer = document.createElement('div'); flameLayer.className = 'flame-layer'; stage.appendChild(flameLayer); }

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
    if (!footer) { footer = document.createElement('div'); footer.className = 'card-footer'; stage.appendChild(footer); }
    let badge = footer.querySelector('.card-name-badge');
    if (!badge) { badge = document.createElement('span'); badge.className = 'card-name-badge'; footer.appendChild(badge); }
    let userNameSlot = footer.querySelector('#userNameSlot');
    if (!userNameSlot) { userNameSlot = document.createElement('span'); userNameSlot.id = 'userNameSlot'; badge.appendChild(userNameSlot); }

    let btn = root.querySelector('#btnNext, .btn-next-card');
    if (!btn) {
      const actions = root.querySelector('.card-actions') || root.appendChild(Object.assign(document.createElement('div'), {className:'card-actions'}));
      btn = document.createElement('button');
      btn.id = 'btnNext'; btn.className = 'btn btn-stone'; btn.textContent = 'Continuar'; actions.appendChild(btn);
    }

    return { stage, guideBg, guideNameSlot, flameLayer, selfieSvgImage, userNameSlot, btnNext: btn };
  }

  // -------- inicialização --------
  async function initCard(root) {
    const section = SECTION_IDS.map(id => root.id === id ? root : qs(`#${id}`, root) || qs(`#${id}`)).find(Boolean) || root;

    // 1) Valida nome (redireciona para section-guia se faltar)
    const pv = getParticipantNameValidated();
    if (!pv.ok) {
      try { alert('Para seguir, informe seu nome na página do Guia.'); } catch {}
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo(null, PREV_SECTION_ID);
      } else {
        window.JC?.show?.(PREV_SECTION_ID);
      }
      return; // interrompe render deste card até ter nome válido
    }
    const nome = pv.name.toUpperCase();

    // 2) Resolve guia e estrutura
    const guia = await resolveSelectedGuide();
    const { guideBg, guideNameSlot, flameLayer, selfieSvgImage, userNameSlot, btnNext } = ensureStructure(section);

    // 3) BG do guia
    if (guideBg && guideBg.tagName === 'IMG') {
      guideBg.src = guia.bgImage;
      guideBg.alt = `${guia.nome} — Card da Irmandade`;
      guideBg.addEventListener?.('error', () => { guideBg.src = CARD_BG.zion; });
    } else {
      section.style.backgroundImage = `url("${guia.bgImage}")`;
      section.style.backgroundSize = 'cover';
      section.style
