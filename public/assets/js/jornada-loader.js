(function () {
  'use strict';

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

 function checkCriticalElements(section, sectionId) {
  const criticalSelectors = {
    'section-intro': ['#intro-p1-1', '#intro-p1-2', '#intro-p1-3', '#intro-p2-1', '#intro-p2-2', '#btn-avancar'],
    'section-termos': ['#termos-pg1', '#termos-pg2', '.nextBtn[data-action="termos-next"]', '.prevBtn[data-action="termos-prev"]', '.avancarBtn[data-action="avancar"]']
  }[sectionId] || [];

  const found = {};
  for (const selector of criticalSelectors) {
    let el = section.querySelector(selector);
    if (!el && selector.startsWith('#termos-pg')) {
      el = document.createElement('div');
      el.id = selector.slice(1);
      el.classList.add('parchment-text-rough', 'lumen-typing');
      el.dataset.typing = 'true';
      el.textContent = `Placeholder para ${selector}`;
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.display = 'block';
      section.appendChild(el);
      console.warn(`[carregarEtapa] Created placeholder for ${selector}`);
    }
    if (!el && (selector.startsWith('.nextBtn') || selector.startsWith('.prevBtn') || selector.startsWith('.avancarBtn'))) {
      el = document.createElement('button');
      el.classList.add('btn', 'btn-primary', 'btn-stone');
      el.dataset.action = selector.includes('next') ? 'termos-next' : selector.includes('prev') ? 'termos-prev' : 'avancar';
      el.textContent = selector.includes('next') ? 'Próxima página' : selector.includes('prev') ? 'Voltar' : 'Aceito e quero continuar';
      el.style.opacity = '1';
      el.style.visibility = 'visible';
      el.style.display = 'inline-block';
      section.querySelector('.parchment-actions-rough')?.appendChild(el) || section.appendChild(el);
      console.warn(`[carregarEtapa] Created placeholder for ${selector}`);
    }
    found[selector] = !!el;
    if (found[selector]) {
      console.log(`[carregarEtapa] Critical element ${selector} FOUND.`);
    } else {
      console.warn(`[carregarEtapa] Critical element ${selector} NOT found.`);
    }
  }
  console.log('[carregarEtapa] Critical elements check:', found);
  return found;
}

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
