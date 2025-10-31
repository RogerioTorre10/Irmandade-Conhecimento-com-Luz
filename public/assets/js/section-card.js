/* /assets/js/section-card.js — versão com suporte a /assets/data/guias.json + fallbacks */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_ID = 'section-eu-na-irmandade';
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  // Caminhos fixos dos cards (fallback) e placeholder
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  // JSON com metadados dos guias (preferencial)
  const GUIAS_JSON = '/assets/data/guias.json';
  let GUIAS_CACHE = null; // cache leve em memória

  // Atalhos
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---------- Utilitários ----------
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
        } catch (e) {
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
    } catch (_) {}
  }

  function setSvgImageHref(imgEl, url) {
    try { imgEl.setAttribute('href', url); } catch {}
    try { imgEl.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', url); } catch {}
  }

  function readSelfieUrlOrPlaceholder() {
    const keys = [
      'jornada.selfieDataUrl', 'selfie.dataUrl', 'selfieDataUrl',
      'jornada.selfie', 'selfie.image', 'selfieImageData'
    ];
    for (const k of keys) {
      try {
        const v = sessionStorage.getItem(k);
        if (v && /^data:image\//.test(v)) return v;
      } catch {}
    }
    return PLACEHOLDER_SELFIE;
  }

  // ---------- JSON dos guias (preferencial) ----------
  async function loadGuiasJson() {
    if (GUIAS_CACHE) return GUIAS_CACHE;
    try {
      const res = await fetch(GUIAS_JSON, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Normaliza para array de objetos {id, nome, bgImage}
      if (Array.isArray(data)) {
        GUIAS_CACHE = data.map(g => ({
          id: String(g.id || '').toLowerCase(),
          nome: g.nome || g.name || '',
          bgImage: g.bgImage || g.bg || ''
        }));
      } else if (data && typeof data === 'object' && data.guias) {
        GUIAS_CACHE = (data.guias || []).map(g => ({
          id: String(g.id || '').toLowerCase(),
          nome: g.nome || g.name || '',
          bgImage: g.bgImage || g.bg || ''
        }));
      } else {
        GUIAS_CACHE = [];
      }
    } catch (e) {
      console.warn(`[${MOD}] Falha ao carregar ${GUIAS_JSON}:`, e);
      GUIAS_CACHE = [];
    }
    return GUIAS_CACHE;
  }

  async function resolveSelectedGuide() {
    const selId = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
    // 1) tenta via JSON
    const guias = await loadGuiasJson();
    const fromJson = guias.find(g => g.id === selId);
    if (fromJson && (fromJson.bgImage || fromJson.nome)) {
      return {
        id: selId,
        nome: (fromJson.nome || capitalize(selId)),
        bgImage: fromJson.bgImage || CARD_BG[selId] || CARD_BG.zion
      };
    }
    // 2) fallback fixo
    return {
      id: selId,
      nome: capitalize(selId),
      bgImage: CARD_BG[selId] || CARD_BG.zion
    };
  }

  function capitalize(id) {
    if (!id) return '';
    const map = { arian: 'Arian', lumen: 'Lumen', zion: 'Zion' };
    return map[id] || (id.charAt(0).toUpperCase() + id.slice(1));
  }

  // ---------- Inicialização do Card ----------
  async function initCard(root) {
    const nameSlot = qs('#userNameSlot', root);
    const guideNameSlot = qs('#guideNameSlot', root);
    const guiaBg = qs('#guideBg', root);
    const flameLayer = qs('.flame-layer', root);
    const selfieSvgImage = qs('#selfieImage', root);

    // Nome herdado
    const nome = (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase();
    if (nameSlot) nameSlot.textContent = nome;

    // Guia (JSON preferencial + fallback)
    const guia = await resolveSelectedGuide();
    if (guiaBg && guia.bgImage) {
      guiaBg.src = guia.bgImage;
      guiaBg.alt = `${guia.nome} — Card da Irmandade`;
    }
    if (guideNameSlot) guideNameSlot.textContent = guia.nome.toUpperCase();

    // Selfie (ou placeholder) na chama
    const url = readSelfieUrlOrPlaceholder();
    if (selfieSvgImage && url) {
      setSvgImageHref(selfieSvgImage, url);
      flameLayer?.classList.add('show');
      selfieSvgImage.addEventListener?.('error', () => {
        setSvgImageHref(selfieSvgImage, PLACEHOLDER_SELFIE);
        flameLayer?.classList.add('show');
      });
    }

    // Respeita transição (vídeo/efeitos) e aplica digitação/voz
    await waitForTransitionUnlock();
    const elements = qsa('[data-typing="true"]', root);
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    // Continuar → vídeo de transição + próxima seção
    const btn = qs('#btnNext', root);
    if (btn) {
      btn.addEventListener('click', () => {
        try { speechSynthesis.cancel(); } catch {}
        qsa('video').forEach(v => { try { v.pause(); v.src = ''; v.load(); } catch {} });

        if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
          window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID);
        }
      });
    }

    console.log(`[${MOD}] Card exibido · guia=${guia.id} (${guia.nome}) · participante=${nome}`);
  }

  // ---------- Escuta do evento de seção ----------
  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (id !== SECTION_ID) return;
    const root = e.detail.node;
    if (!root) return;
    initCard(root);
  });

  console.log(`[${MOD}] carregado (com suporte a ${GUIAS_JSON})`);
})();
