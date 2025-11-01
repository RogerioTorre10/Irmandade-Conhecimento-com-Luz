/* /assets/js/section-card.js — compatível com section-card e section-eu-na-irmandade */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  // Fallbacks fixos (CASO O JSON FALHE)
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg'; // ORBE DOURADO

  const GUIAS_JSON = '/assets/data/guias.json';
  let GUIAS_CACHE = null;

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- UTILITÁRIOS ----------
  async function waitForTransitionUnlock(timeoutMs = 15000) {
    if (!window.__TRANSITION_LOCK) return;
    let resolved = false;
    const p = new Promise(resolve => {
      const onEnd = () => {
        if (!resolved) {
          resolved = true;
          document.removeEventListener('transition:ended', onEnd);
          resolve();
        }
      };
      document.addEventListener('transition:ended', onEnd, { once: true });
    });
    const t = new Promise((resolve) => setTimeout(resolve, timeoutMs));
    await Promise.race([p, t]);
  }

  async function runTypingAndSpeak(el, text) {
    if (!el || !text) return;

    el.classList.remove('typing-done', 'typing-active');
    el.classList.add('typing-active');
    el.style.setProperty('text-align', 'left', 'important');
    el.setAttribute('dir', 'ltr');

    const speed = Number(el.dataset.speed || 40);
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try {
          window.runTyping(el, text, res, { speed, cursor: el.dataset.cursor !== 'false' });
        } catch {
          el.textContent = text;
          res();
        }
      });
    } else {
      await new Promise(resolve => {
        el.textContent = '';
        let i = 0;
        (function tick() {
          if (i < text.length) {
            el.textContent += text.charAt(i++);
            setTimeout(tick, speed);
          } else {
            resolve();
          }
        })();
      });
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: 1.0 });
      if (p && typeof p.then === 'function') await p;
    } catch {}
  }

  function setSvgImageHref(imgEl, url) {
    try { imgEl.setAttribute('href', url); } catch {}
    try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch {}
  }

  function readSelfieUrlOrPlaceholder() {
    const keys = [
      'jornada.selfieDataUrl', 'selfie.dataUrl', 'selfieDataUrl',
      'jornada.selfie', 'selfie.image', 'selfieImageData',
      'jc.selfieDataUrl' // ← compatibilidade com section-selfie.js
    ];
    for (const k of keys) {
      try {
        const v = sessionStorage.getItem(k) || localStorage.getItem(k);
        if (v && /^data:image\//.test(v)) return v;
      } catch {}
    }
    return PLACEHOLDER_SELFIE; // ORBE DOURADO
  }

  // ---------- CARREGA GUIAS.JSON ----------
  async function loadGuiasJson() {
    if (GUIAS_CACHE) return GUIAS_CACHE;

    try {
      const res = await fetch(GUIAS_JSON + '?t=' + Date.now(), { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const arr = Array.isArray(data) ? data : (Array.isArray(data.guias) ? data.guias : []);
      GUIAS_CACHE = arr.map(g => ({
        id: String(g.id || '').toLowerCase().trim(),
        nome: (g.nome || g.name || '').trim(),
        bgImage: (g.bgImage || g.bg || '').trim()
      })).filter(g => g.id && g.nome);

      console.log(`[${MOD}] guias.json carregado:`, GUIAS_CACHE);
    } catch (e) {
      console.warn(`[${MOD}] Falha ao carregar ${GUIAS_JSON}:`, e);
      GUIAS_CACHE = [
        { id: 'zion', nome: 'Zion', bgImage: CARD_BG.zion },
        { id: 'lumen', nome: 'Lumen', bgImage: CARD_BG.lumen },
        { id: 'arian', nome: 'Arian', bgImage: CARD_BG.arian }
      ];
    }
    return GUIAS_CACHE;
  }

  function titleizeId(id) {
    const map = { arian: 'Arian', lumen: 'Lumen', zion: 'Zion' };
    return map[id] || (id ? id[0].toUpperCase() + id.slice(1) : 'Guia');
  }

  async function resolveSelectedGuide() {
    const selId = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase().trim();
    const guias = await loadGuiasJson();
    const fromJson = guias.find(g => g.id === selId);

    if (fromJson && fromJson.bgImage) {
      return { id: selId, nome: fromJson.nome, bgImage: fromJson.bgImage };
    }

    return {
      id: selId,
      nome: fromJson?.nome || titleizeId(selId),
      bgImage: CARD_BG[selId] || CARD_BG.zion
    };
  }

  // ---------- INICIALIZAÇÃO DO CARD ----------
  async function initCard(root) {
    if (!root) return;

    const nameSlot = qs('#userNameSlot', root) || qs('#cardParticipantName', root);
    const guideNameSlot = qs('#guideNameSlot', root) || qs('#cardGuideName', root);
    const guiaBg = qs('#guideBg', root);
    const flameLayer = qs('.flame-layer', root);
    const selfieSvgImage = qs('#selfieImage', root);

    // NOME DO PARTICIPANTE
    const nome = (
      sessionStorage.getItem('jornada.nome') ||
      localStorage.getItem('jc.nome') ||
      window.JC?.data?.nome ||
      'AMOR'
    ).toUpperCase().trim();
    if (nameSlot) nameSlot.textContent = nome;

    // GUIA SELECIONADO
    const guia = await resolveSelectedGuide();
    if (guiaBg && guia.bgImage) {
      guiaBg.src = guia.bgImage;
      guiaBg.alt = `${guia.nome} — Card da Irmandade`;
    }
    if (guideNameSlot) guideNameSlot.textContent = guia.nome.toUpperCase();

    // SELFIE OU ORBE DOURADO
    const url = readSelfieUrlOrPlaceholder();
    if (selfieSvgImage && url) {
      setSvgImageHref(selfieSvgImage, url);
      if (flameLayer) flameLayer.style.opacity = '1';
      selfieSvgImage.onerror = () => {
        setSvgImageHref(selfieSvgImage, PLACEHOLDER_SELFIE);
        if (flameLayer) flameLayer.style.opacity = '1';
      };
    }

    // DATILOGRAFIA + VOZ
    await waitForTransitionUnlock();
    const elements = qsa('[data-typing="true"]', root);
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      if (text) await runTypingAndSpeak(el, text);
    }

    // BOTÃO CONTINUAR
    const btn = qs('#btnNext', root) || qs('#btnStartJourney', root);
    if (btn) {
      btn.onclick = () => {
        try { speechSynthesis.cancel(); } catch {}
        qsa('video').forEach(v => { try { v.pause(); v.src = ''; v.load(); } catch {} });

        if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
          window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        } else if (window.JC?.show) {
          window.JC.show(NEXT_SECTION_ID);
        } else {
          forceShowSection(NEXT_SECTION_ID);
        }
      };
    }

    console.log(`[${MOD}] Card inicializado → ${nome} com ${guia.nome}`);
  }

  // ---------- FORÇA EXIBIÇÃO (FALLBACK) ----------
  function forceShowSection(id) {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'block';
      el.scrollIntoView({ behavior: 'smooth' });
      el.dispatchEvent(new CustomEvent('sectionLoaded', {
        detail: { sectionId: id, node: el },
        bubbles: true
      }));
    }
  }

  // ---------- EVENTOS ----------
  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (SECTION_IDS.includes(id)) {
      const root = e.detail.node || document.getElementById(id);
      if (root) initCard(root);
    }
  });

  document.addEventListener('sectionLoaded', (e) => {
    const id = e.detail.sectionId;
    if (SECTION_IDS.includes(id)) {
      const root = e.detail.node || document.getElementById(id);
      if (root) initCard(root);
    }
  });

  // Fallback: se já estiver no DOM
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      const visible = SECTION_IDS.map(id => document.getElementById(id))
        .find(el => el && el.offsetParent !== null);
      if (visible) initCard(visible);
    }, 500);
  });

  console.log(`[${MOD}] carregado — guias.json: ${GUIAS_JSON}`);
})();
