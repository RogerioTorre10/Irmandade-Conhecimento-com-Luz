(function () {
  'use strict';

  const MOD = 'section-card.js';
  // Alinha com seu HTML:
  const SECTION_ID = 'section-eu-na-irmandade';
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-card-dourado.mp4';

  const qs = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // Espera o "transition lock" liberar (se houver vídeo/efeito rodando)
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

  async function loadGuias() {
    try {
      const response = await fetch('/assets/data/guias.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (e) {
      console.error(`[${MOD}] Erro ao carregar guias:`, e);
      return [
        { id: 'zion', nome: 'Zion', bgImage: '/assets/img/irmandade-quarteto-bg-zion.png' },
        { id: 'lumen', nome: 'Lumen', bgImage: '/assets/img/irmandade-quarteto-bg-lumen.png' },
        { id: 'arian', nome: 'Arian', bgImage: '/assets/img/irmandade-quarteto-bg-arian.png' }
      ];
    }
  }

  function readSelfieDataUrl() {
    // Tenta múltiplas chaves plausíveis
    const keys = [
      'jornada.selfieDataUrl', 'selfie.dataUrl', 'selfieDataUrl',
      'jornada.selfie', 'selfie.image', 'selfieImageData'
    ];
    for (const k of keys) {
      const v = sessionStorage.getItem(k);
      if (v && /^data:image\//.test(v)) return v;
    }
    return '';
  }

  async function initCard(root) {
    const nameInput = qs('#nameInput', root);
    const nameSlot = qs('#userNameSlot', root);
    const guideNameSlot = qs('#guideNameSlot', root);
    const guiaBg = qs('#guideBg', root);
    const selfieImg = qs('#selfieImage', root);
    const flameLayer = qs('.flame-layer', root);

    const saved = {
      nome: (sessionStorage.getItem('jornada.nome') || 'USUÁRIO').toUpperCase(),
      guia: (sessionStorage.getItem('jornada.guia') || 'zion').toLowerCase()
    };

    if (nameInput) {
      nameInput.value = saved.nome;
      nameInput.addEventListener('input', () => {
        const newName = (nameInput.value || '').trim().toUpperCase();
        sessionStorage.setItem('jornada.nome', newName);
        if (nameSlot) nameSlot.textContent = newName || 'USUÁRIO';
      });
    }
    if (nameSlot) nameSlot.textContent = saved.nome;

    // Carrega guias e aplica BG + nome correto do guia
    const guias = await loadGuias();
    const selectedGuia = guias.find(g => g.id === saved.guia) || guias[0];

    if (guiaBg && selectedGuia?.bgImage) guiaBg.src = selectedGuia.bgImage;
    if (guideNameSlot) guideNameSlot.textContent = (selectedGuia?.nome || saved.guia).toUpperCase();

    // Aplica selfie dentro do clipPath (se existir)
    const dataUrl = readSelfieDataUrl();
    if (selfieImg && dataUrl) {
      selfieImg.setAttribute('href', dataUrl);
      // Mostra a camada da chama quando a imagem estiver pronta
      // (image em <svg> não tem onload confiável em todos os browsers, então libera direto)
      if (flameLayer) flameLayer.classList.add('show');
    }

    // Aguarda fim de transição antes da digitação (evita atropelar vídeo/efeito)
    await waitForTransitionUnlock();

    // Digitação dos elementos marcados
    const elements = qsa('[data-typing="true"]', root);
    for (const el of elements) {
      const text = (el.dataset.text || el.textContent || '').trim();
      await runTypingAndSpeak(el, text);
    }

    // BOTÃO → avançar (alinha com seu HTML: #btnNext)
    const btn = qs('#btnNext', root);
    if (btn) {
      btn.addEventListener('click', () => {
        try { speechSynthesis.cancel(); } catch {}
        // Para e esvazia quaisquer <video> que estejam rodando
        qsa('video').forEach(video => { try { video.pause(); video.src = ''; video.load(); } catch {} });

        if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
          window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID);
        }
      });
    }

    console.log(`[${MOD}] Bloco de card carregado`);
  }

  document.addEventListener('section:shown', (e) => {
    const id = e.detail.sectionId;
    if (id !== SECTION_ID) return;
    const root = e.detail.node;
    if (!root) return;
    initCard(root);
  });

  console.log(`[${MOD}] carregado`);
})();
