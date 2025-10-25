(function () {
  'use strict';

  const log = (...args) => console.log('[carregarEtapa]', ...args);

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

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      section = tempDiv.querySelector(sectionSelector) || tempDiv.querySelector('section');

      if (!section || !html.includes(`id="section-${sectionId}"`)) {
        console.warn('[carregarEtapa] HTML does not contain expected section:', sectionId);
        section = document.createElement('section');
        section.id = `section-${sectionId}`;
        section.classList.add('section', 'pergaminho', 'pergaminho-v');
        section.innerHTML = `<div id="${sectionId}-pg1" data-typing="true">Placeholder para ${sectionId}</div>`;
      }

      section.id = `section-${sectionId}`;
      section.classList.add('section');
      section.dataset.initialized = 'true';

      const criticalElements = {
        [`#${sectionId}-pg1`]: false,
        [`#${sectionId}-pg2`]: sectionId === 'termos',
        '.nextBtn[data-action="termos-next"]': sectionId === 'termos',
        '.prevBtn[data-action="termos-prev"]': sectionId === 'termos',
        '.avancarBtn[data-action="avancar"]': sectionId === 'termos'
      };

      Object.keys(criticalElements).forEach(selector => {
        criticalElements[selector] = !!section.querySelector(selector);
        log('Critical element', selector, criticalElements[selector] ? 'FOUND' : 'NOT FOUND');
      });
      log('Critical elements check:', criticalElements);

      const wrapper = document.getElementById('jornada-content-wrapper');
      if (!wrapper) throw new Error('jornada-content-wrapper not found');
      wrapper.innerHTML = '';
      wrapper.appendChild(section);
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
      const fallbackSection = document.createElement('section');
      fallbackSection.id = `section-${sectionId}`;
      fallbackSection.classList.add('section', 'pergaminho', 'pergaminho-v');
      fallbackSection.innerHTML = `<div id="${sectionId}-pg1" data-typing="true">Erro ao carregar ${sectionId}. Tente novamente.</div>`;
      const wrapper = document.getElementById('jornada-content-wrapper');
      if (wrapper) {
        wrapper.innerHTML = '';
        wrapper.appendChild(fallbackSection);
      }
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId, name: sectionId, node: fallbackSection } }));
          resolve(fallbackSection);
        });
      });
    }
  }

  window.carregarEtapa = carregarEtapa;
})();
