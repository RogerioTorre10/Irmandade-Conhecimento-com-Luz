/* /assets/js/section-card.js — VERSÃO CORRIGIDA (SEM FALLBACK QUEBRADO) */
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

  const qs  = (s, r = document) => r.querySelector(s);
  const qsa = (s, r = document) => Array.from(r.querySelectorAll(s));

  // === SINCRONIZAÇÃO MOBILE (localStorage) ===
  window.addEventListener('storage', (e) => {
    if (e.key === 'jc.guia' || e.key === 'jc.nome' || e.key === 'jc.selfieDataUrl') {
      console.log('%c[SYNC] Dados atualizados!', 'color: cyan', e);
      renderCard();
    }
  });

  // === LEITURA DE DADOS (nome + guia) ===
  function getUserData() {
    let nome = 'AMOR';
    let guia = 'zion';

    if (window.JC?.data) {
      if (window.JC.data.nome) nome = window.JC.data.nome;
      if (window.JC.data.guia) guia = window.JC.data.guia;
    }

    const lsNome = localStorage.getItem('jc.nome');
    const lsGuia = localStorage.getItem('jc.guia');
    if (lsNome) nome = lsNome;
    if (lsGuia) guia = lsGuia;

    const ssGuia = sessionStorage.getItem('jornada.guia');
    if (ssGuia) guia = ssGuia;

    nome = nome.toUpperCase().trim();
    guia = guia.toLowerCase().trim();

    window.JC = window.JC || {};
    window.JC.data = window.JC.data || {};
    window.JC.data.nome = nome;
    window.JC.data.guia = guia;

    try {
      localStorage.setItem('jc.nome', nome);
      localStorage.setItem('jc.guia', guia);
      sessionStorage.setItem('jornada.guia', guia);
    } catch {}

    return { nome, guia };
  }

  // === GARANTE QUE A ESTRUTURA DO CARD ESTEJA CORRETA ===
  function ensureCardStructure(section) {
    if (!section) return;

    // Se já tem .card-panel, não mexe
    if (section.querySelector('.card-panel')) return;

    console.warn('[CARD_FIX] Estrutura incompleta detectada → envolvendo conteúdo em .card-panel');

    const conteudo = section.innerHTML;
    section.innerHTML = `
      <div class="j-panel-glow card-panel">
        <div class="conteudo-pergaminho">
          ${conteudo}
        </div>
      </div>
    `;
  }

  // === RENDERIZA O CARD (fundo, selfie, nome) ===
  function renderCard() {
    const section =
      qs('#section-card') ||
      qs('#section-eu-na-irmandade');

    if (!section) return;

    const { nome, guia } = getUserData();

    // 1. FUNDO DO GUIA
    const guideBg =
      qs('#guideBg', section) ||
      qs('.guide-bg', section);

    if (guideBg) {
      const bgUrl = CARD_BG[guia] || CARD_BG.zion;

      if (!guideBg.src) {
        guideBg.src = CARD_BG.zion;
      }

      if (guideBg.src !== bgUrl) {
        guideBg.style.opacity = '0';
        guideBg.onload = () => {
          guideBg.style.opacity = '1';
          guideBg.onload = null;
        };
        guideBg.onerror = () => {
          console.warn('[CARD] Erro ao carregar fundo, voltando para Zion');
          guideBg.src = CARD_BG.zion;
          guideBg.style.opacity = '1';
        };
        guideBg.src = bgUrl;
      } else {
        guideBg.style.opacity = '1';
      }
    }

    // 2. SELFIE
    const selfieImg = qs('#selfieImage', section);
    if (selfieImg) {
      const url = window.JC?.data?.selfieDataUrl || localStorage.getItem('jc.selfieDataUrl');
      const finalUrl = url || PLACEHOLDER_SELFIE;
      if (selfieImg.src !== finalUrl) {
        selfieImg.src = finalUrl;
      }
      const flameLayer = selfieImg.closest('.flame-layer');
      if (flameLayer) flameLayer.classList.add('show');
    }

    // 3. NOME
    const nameSlot = qs('#userNameSlot', section);
    if (nameSlot) nameSlot.textContent = nome;

    console.log('%c[CARD] Renderizado com sucesso!', 'color: gold; font-weight: bold', { nome, guia });
  }

  // === NAVEGAÇÃO → PERGUNTAS ===
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}

    qsa('video').forEach(v => {
      try { v.pause(); v.src = ''; } catch {}
    });

    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    // Fallback simples (sem overlay complexo)
    const v = document.createElement('video');
    v.src = VIDEO_SRC;
    v.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'object-fit:cover;z-index:9999;background:#000;';
    v.muted = true;
    v.playsInline = true;

    v.onended = () => {
      v.remove();
      window.JC?.show?.(NEXT_SECTION_ID, { force: true });
    };

    document.body.appendChild(v);
    v.play().catch(() => {
      v.remove();
      window.JC?.show?.(NEXT_SECTION_ID, { force: true });
    });
  }

  // === INIT ===
  async function initCard(root) {
    const section =
      root?.id && SECTION_IDS.includes(root.id)
        ? root
        : qs('#section-card') || qs('#section-eu-na-irmandade');

    if (!section) return;

    // Garante estrutura certa (sem inventar card-stage maluco)
    ensureCardStructure(section);

    renderCard();

    // Botão continuar
    const btnNext =
      qs('#btnNext', section) ||
      qs('.btn-next-card', section);

    if (btnNext) btnNext.onclick = goNext;

    // Datilografia do título
    const typingEls = qsa('[data-typing="true"]', section);
    for (const el of typingEls) {
      const text = el.dataset.text || el.textContent || '';
      if (typeof window.runTyping === 'function') {
        await new Promise(res =>
          window.runTyping(el, text, res, { speed: 40, cursor: true })
        );
      } else {
        el.textContent = text;
      }
      if (typeof window.speak === 'function') {
        window.speak(text);
      }
    }
  }

  // === EVENTOS DO CONTROLLER ===
  document.addEventListener('section:shown', e => {
    const id = e.detail.sectionId;
    if (SECTION_IDS.includes(id)) {
      const root = e.detail.node || qs(`#${id}`) || document.body;
      initCard(root);
    }
  });

  // Init se o card já estiver visível no load
  document.addEventListener('DOMContentLoaded', () => {
    const visible = SECTION_IDS
      .map(id => qs(`#${id}`))
      .find(el => el && el.offsetParent !== null);

    if (visible) initCard(visible);
  });

  console.log(`[${MOD}] carregado e pronto!`);
})();
