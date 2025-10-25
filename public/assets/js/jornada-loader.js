(function () {
  'use strict';

  const log = (...args) => console.log('[carregarEtapa]', ...args); // Restaurado

  // Mapeamento de URLs para cada etapa
  const etapas = {
    intro: '/html/section-intro.html',
    filme1: '/assets/img/filme-pergaminho-ao-vento.mp4',
    termos: '/html/section-termos.html',
    filme2: '/assets/img/filme-senha.mp4',
    senha: '/html/section-senha.html',
    filme3: '/assets/img/filme-senha-confirmada.mp4',
    guia: '/html/section-guia.html',
    filme4: '/assets/img/conhecimento-com-luz-jardim.mp4',
    selfie: '/html/section-selfie.html',
    filme5: '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    perguntas: '/html/section-perguntas.html',
    filme6: '/assets/img/filme-5-fim-da-jornada.mp4',
    final: '/html/section-final.html'
  };

    async function carregarEtapa(sectionId) {
    log('Starting load for', sectionId, 'ID:', `section-${sectionId}`);
    const sectionSelector = `#section-${sectionId}`;
    let section = document.querySelector(sectionSelector);

    if (section && section.dataset.initialized === 'true') {
      log('Section', sectionSelector, 'already initialized. Forcing reinitialization.');
      section.dataset.initialized = '';
    }

    if (section) {
      log('Section', sectionSelector, 'already in DOM. Triggering sectionLoaded.');
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId, name: sectionId, node: section } }));
          resolve(section);
        });
      });
    }

    const url = `/html/section-${sectionId}.html`;
    log('Loading via fetch:', url);
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to fetch ${url}: ${response.status}`);
      const html = await response.text();
      log('Fetched HTML:', html.slice(0, 120) + '...');

      const criticalElements = {
        [`#${sectionId}-pg1`]: false,
        [`#${sectionId}-pg2`]: sectionId === 'termos',
        '.nextBtn[data-action="termos-next"]': sectionId === 'termos',
        '.prevBtn[data-action="termos-prev"]': sectionId === 'termos',
        '.avancarBtn[data-action="avancar"]': sectionId === 'termos'
      };

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      Object.keys(criticalElements).forEach(selector => {
        criticalElements[selector] = !!tempDiv.querySelector(selector);
        log('Critical element', selector, criticalElements[selector] ? 'FOUND' : 'NOT FOUND');
      });
      log('Critical elements check:', criticalElements);

      const wrapper = document.getElementById('jornada-content-wrapper');
      if (!wrapper) throw new Error('jornada-content-wrapper not found');
      wrapper.innerHTML = '';
      wrapper.appendChild(tempDiv.firstElementChild);
      section = wrapper.querySelector(sectionSelector);
      log('Injected into wrapper:', section?.outerHTML.slice(0, 120) + '...');
      log('Section', sectionSelector, 'present:', !!section);
      log('Critical elements present:', criticalElements);

      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId, name: sectionId, node: section } }));
          resolve(section);
        });
      });
    } catch (e) {
      console.error('[carregarEtapa] Error loading section:', sectionId, e);
      return null;
    }
  }

  window.carregarEtapa = carregarEtapa;
})();
