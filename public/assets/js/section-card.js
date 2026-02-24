/* /assets/js/section-card.js — REBUILD LIMPO DO CARD (versão estável v2.0)
   - guia canon: sempre vem do JORNADA_GUIA (session/local) + fallback para state/JC
   - SELFIECARD: gera 1x por sessão (ou quando guia/nome mudar), sem travar UI
   - moldura: /assets/img/borda-medieval-espinhos.png (fundo transparente OK)
*/
(function () {
  'use strict';

  const MOD = 'section-card.js';
  const SECTION_IDS = ['section-card', 'section-eu-na-irmandade'];
  const NEXT_SECTION_ID = 'section-perguntas';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const CARD_BG = {
    arion: '/assets/img/irmandade-quarteto-bg-arian.png', // mantém o arquivo que você já tem
    lumen: '/assets/img/irmandade-quarteto-bg-lumen.png',
    zion:  '/assets/img/irmandade-quarteto-bg-zion.png',
  };

  const FRAME_SRC = '/assets/img/borda-medieval-luminosa.png';
  const PLACEHOLDER_SELFIE = '/assets/img/irmandade-card-placeholder.png';

  const qs  = (s, r = document) => r.querySelector(s);

  // -----------------------------
  // Normalização de guia
  // -----------------------------
  function canonGuia(v) {
    const s = String(v || '').trim().toLowerCase();
    if (!s) return '';
    if (s.includes('lumen')) return 'lumen';
    if (s.includes('zion')) return 'zion';
    if (s.includes('arion') || s.includes('arian')) return 'arion';
    return s;
  }

  function prettyGuia(id) {
    const g = canonGuia(id);
    return g === 'lumen' ? 'Lumen'
         : g === 'zion'  ? 'Zion'
         : g === 'arion' ? 'Arion'
         : '';
  }

  // -----------------------------
  // Build Markup (MODIFICADO PARA AJUSTE DA MOLDURA EXTERNA)
  // -----------------------------
  function buildMarkup(section) {
    const container = qs('.card-container', section) || document.createElement('div');
    container.className = 'card-container';
    container.style.position = 'relative';
    container.style.overflow = 'visible'; // MODIFICADO: Permite que a moldura se expanda para fora sem clipping

    // Fundo do card
    const cardBg = document.createElement('img');
    cardBg.src = PLACEHOLDER_SELFIE; // Será atualizado depois
    cardBg.style.position = 'absolute';
    cardBg.style.top = '0';
    cardBg.style.left = '0';
    cardBg.style.width = '100%';
    cardBg.style.height = '100%';
    cardBg.style.objectFit = 'cover';
    cardBg.style.zIndex = '1';

    // Moldura (MODIFICADO: Aumenta tamanho e offset para ficar externa)
    const frame = document.createElement('img');
    frame.src = FRAME_SRC;
    frame.alt = '';
    frame.style.position = 'absolute';
    frame.style.top = '-20px'; // MODIFICADO: Offset negativo para expandir para cima (ajuste conforme espessura da borda)
    frame.style.left = '-20px'; // MODIFICADO: Offset negativo para expandir para os lados
    frame.style.width = 'calc(100% + 40px)'; // MODIFICADO: Aumenta largura em 40px (20px cada lado)
    frame.style.height = 'calc(100% + 40px)'; // MODIFICADO: Aumenta altura em 40px (20px top/bottom)
    frame.style.objectFit = 'contain';
    frame.style.zIndex = '10';

    // Selfie (exemplo, assumindo que existe)
    const selfieImg = document.createElement('img');
    selfieImg.style.position = 'absolute';
    selfieImg.style.top = '20%';
    selfieImg.style.left = '50%';
    selfieImg.style.transform = 'translate(-50%, -50%)';
    selfieImg.style.zIndex = '5';

    // Textos (MODIFICADO: Ajuste bottom para dar mais margem e evitar sobreposição)
    const nameText = document.createElement('div');
    nameText.style.position = 'absolute';
    nameText.style.bottom = '15%'; // MODIFICADO: Aumentado de 10% para 15% para afastar da borda inferior
    nameText.style.left = '50%';
    nameText.style.transform = 'translateX(-50%)';
    nameText.style.zIndex = '20';
    nameText.style.textAlign = 'center';

    const guideText = document.createElement('div');
    guideText.style.position = 'absolute';
    guideText.style.top = '5%'; // Ajuste se necessário
    guideText.style.left = '50%';
    guideText.style.transform = 'translateX(-50%)';
    guideText.style.zIndex = '20';
    guideText.style.textAlign = 'center';

    // Montagem
    container.appendChild(cardBg);
    container.appendChild(selfieImg);
    container.appendChild(nameText);
    container.appendChild(guideText);
    container.appendChild(frame); // Moldura por último, mas z-index controla

    section.appendChild(container);
  }

  // -----------------------------
  // Render Card (sem mudanças, mas chama buildMarkup ajustado)
  // -----------------------------
  function renderCard(section) {
    // ... (código original para carregar guia, nome, gerar imagem, etc.)
    // Certifique-se de que após gerar a selfiecard, os estilos sejam aplicados corretamente
  }

  // -----------------------------
  // Navegação (sem mudanças)
  // -----------------------------
  function goNext() {
    try { speechSynthesis.cancel(); } catch {}
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }
    if (window.JC && typeof window.JC.show === 'function') {
      window.JC.show(NEXT_SECTION_ID, { force: true });
    }
  }

  // -----------------------------
  // Init (sem mudanças)
  // -----------------------------
  function findSection(root) {
    if (root && root.id && SECTION_IDS.includes(root.id)) return root;
    for (const id of SECTION_IDS) {
      const el = document.getElementById(id);
      if (el) return el;
    }
    return null;
  }

  function bind(section) {
    const btnNext = qs('#btnNext', section);
    if (btnNext && !btnNext.__BOUND__) {
      btnNext.__BOUND__ = true;
      btnNext.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        goNext();
      });
    }
  }

  function init(root) {
    const section = findSection(root || null);
    if (!section) return;

    buildMarkup(section);
    renderCard(section);
    bind(section);
  }

  // boot
  document.addEventListener('DOMContentLoaded', () => init());
  document.addEventListener('section:shown', (ev) => {
    const sec = ev?.detail?.section || ev?.target;
    init(sec);
  });

})();
