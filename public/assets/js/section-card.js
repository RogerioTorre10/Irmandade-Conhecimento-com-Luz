/* /assets/js/section-card.js — versão unificada com suporte a selfie, placeholder e card do guia */
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_ID = 'section-eu-na-irmandade';
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  // Caminhos fixos dos cards e placeholder
  const CARD_BG = {
    arian: '/assets/img/irmandade-quarteto-bg-arian.png',
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png'
  };
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.jpg';

  // Atalhos rápidos
  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // ---- Funções utilitárias ----
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
        const tick = () => {
          if (i < text.length) {
            el.textContent += text.charAt(i++);
            setTimeout(tick, speed);
          } else {
            resolve();
          }
        };
        tick();
      });
    }

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    try {
      const p = window.EffectCoordinator?.speak?.(text, { rate: 1.0 });
      if (p && typeof p.then === 'function') await p;
    } catch (_) {}
  }

  // ---- Leitura e seleção dos dados ----
  function getSelectedGuide() {
    const id = (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase();
    const nome = id === 'arian' ? 'Arian' : id === 'lumen' ? 'Lumen' : 'Zion';
    return { id, nome, bgImage: CARD_BG[id] || CARD_BG.zion };
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

  // ---- Inicialização do card ----
  async function initCard(root) {
    const nameSlot = qs('#userNameSlot', root);
    const guideNameSlot = qs('#guideNameSlot', root);
    const guiaBg = qs('#guideBg', root);
    const flameLayer = qs('.flame-layer', root);
    const selfieSvgImage = qs('#selfieImage', root);

    // Nome herdado da página guia
    const nome = (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase();
    if (nameSlot) nameSlot.textContent = nome;

    // Guia e BG
    const guia = getSelectedGuide();
    if (guiaBg && guia.bgImage) {
      guiaBg.src = guia.bgImage;
      guiaBg.alt = `${guia.nome} — Card da Irmandade`;
    }
    if (guideNameSlot) guideNameSlot.textContent = guia.nome.toUpperCase();

    // Selfie ou placeholder
    const url = readSelfieUrlOrPlaceholder();
    if (selfieSvgImage && url) {
      setSvgImageHref(selfieSvgImage, url);
      flameLayer?.classList.add('show');
      selfieSvgImage.addEventListener?.('error', () => {
        setSvgImageHref(selfieSvgImage, PLACEHOLDER_SELFIE);
        flameLayer?.classList.add('show');
      });
    }

    // Espera a transição acabar e aplica efeitos de texto
    await waitForTransitionUnlock();
    const elements = qsa('[data-typing="true"]', root);
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    // Botão continuar (id #btnNext)
    const btn = qs('#btnNext', root);
    if (btn) {
      btn.addEventListener('click', () => {
        try { speechSynthesis.cancel(); } catch {}
        qsa('video').forEach(video => { try { video.pause(); video.src = ''; video.load(); } catch {} });

        if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
          window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID);
        }
      });
    }

    console.log(`[${MOD}] Card exibido com guia ${guia.nome} e participante ${nome}`);
  }

  // ---- Escuta de evento da jornada ----
  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (id !== SECTION_ID) return;
    const root = e.detail.node;
    if (!root) return;
    initCard(root);
  });

  console.log(`[${MOD}] carregado`);
})();
