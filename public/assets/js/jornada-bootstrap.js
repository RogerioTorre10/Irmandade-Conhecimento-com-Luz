/* jornada-bootstrap.js — micro-boot global */
(function (global) {
  'use strict';

  if (global.__JornadaBootstrapReady) {
    console.log('[BOOT] Já carregado, ignorando');
    return;
  }
  global.__JornadaBootstrapReady = true;

  console.log('[BOOT] Iniciando micro-boot…');

  const sectionOrder = [
    'section-intro',
    'section-termos',
    'section-filme1',
    'section-escolha-guia',
    'section-selfie',
    'section-filme2',
    'section-perguntas',
    'section-filme3',
    'section-final'
  ];

  let currentIndex = 0;

  function showSectionByIndex(index) {
    const id = sectionOrder[index];
    if (!id) return;

    sectionOrder.forEach(sec => {
      const el = document.getElementById(sec);
      if (el) el.classList.add('hidden');
    });

    const current = document.getElementById(id);
    if (current) {
      current.classList.remove('hidden');

      // Evita leitura duplicada
      if (global.runTyping && !global.G?.__typingLock) {
        global.runTyping(current);
      }

      if (global.playTypingAndSpeak) {
        global.playTypingAndSpeak('.text');
      }

      setupNavigation(current);

      if (id === 'section-perguntas' && global.loadDynamicBlocks) {
        global.loadDynamicBlocks();
      }
    }

    currentIndex = index;
    global.__currentSectionId = id;
    console.log('[BOOT] Seção exibida via índice:', id);
  }

  function setupNavigation(sectionEl) {
    const btnAvancar = sectionEl.querySelector('.btn-avancar');
    if (btnAvancar) {
      btnAvancar.addEventListener('click', () => {
        showSectionByIndex(currentIndex + 1);
      });
    }

    const btnNext = sectionEl.querySelector('[data-action="termos-next"]');
    const btnPrev = sectionEl.querySelector('[data-action="termos-prev"]');
    const btnTermosAvancar = sectionEl.querySelector('[data-action="avancar"]');

    const termosPg1 = document.getElementById('termos-pg1');
    const termosPg2 = document.getElementById('termos-pg2');

    if (btnNext && termosPg1 && termosPg2) {
      btnNext.addEventListener('click', () => {
        termosPg1.classList.add('hidden');
        termosPg2.classList.remove('hidden');
        if (global.runTyping) global.runTyping(termosPg2);
      });
    }

    if (btnPrev && termosPg1 && termosPg2) {
      btnPrev.addEventListener('click', () => {
        termosPg2.classList.add('hidden');
        termosPg1.classList.remove('hidden');
        if (global.runTyping) global.runTyping(termosPg1);
      });
    }

    if (btnTermosAvancar) {
      btnTermosAvancar.addEventListener('click', () => {
        showSectionByIndex(currentIndex + 1);
      });
    }

    const video = sectionEl.querySelector('video');
    if (video) {
      video.addEventListener('ended', () => {
        showSectionByIndex(currentIndex + 1);
      });
    }
  }

  function fire() {
    try {
      document.dispatchEvent(new CustomEvent('bootstrapComplete'));
      console.log('[BOOT] Evento bootstrapComplete disparado');

      // 🧠 Respeita a seção inicial definida pelo controlador
      const initialId = global.__currentSectionId || 'section-intro';
      const initialIndex = sectionOrder.indexOf(initialId);
      showSectionByIndex(initialIndex >= 0 ? initialIndex : 0);
    } catch (e) {
      console.error('[BOOT] Erro ao disparar bootstrapComplete:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fire, { once: true });
  } else {
    setTimeout(fire, 0);
  }

})(window);
