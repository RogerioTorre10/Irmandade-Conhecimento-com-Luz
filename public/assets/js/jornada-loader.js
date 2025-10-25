(function () {
  'use strict';

  const log = (...args) => console.log('[carregarEtapa]', ...args);

  async function carregarEtapa(sectionId) {
    log('Starting load for', sectionId,(function () {
  'use strict';

  // jornada-loader.js: Definição de URLs para seções
 const etapas = {
    intro:    '/html/section-intro.html',
    termos:   '/html/section-termos.html',
    senha:    '/html/section-senha.html',
    filme1:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    guia:     '/html/section-guia.html',
    filme2:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    selfie:   '/html/section-selfie.html',
    filme3:    '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    perguntas:'/html/section-perguntas.html', 
    filme4:    '/assets/img/filme-5-fim-da-jornada.mp4',
    final:    '/html/section-final.html'
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
        section.appendChild(el);
        console.warn(`[carregarEtapa] Created placeholder for ${selector}`);
      }
      if (!el && (selector.startsWith('.nextBtn') || selector.startsWith('.prevBtn') || selector.startsWith('.avancarBtn'))) {
        el = document.createElement('button');
        el.classList.add('btn', 'btn-primary', 'btn-stone');
        el.dataset.action = selector.includes('next') ? 'termos-next' : selector.includes('prev') ? 'termos-prev' : 'avancar';
        el.textContent = selector.includes('next') ? 'Próxima página' : selector.includes('prev') ? 'Voltar' : 'Aceito e quero continuar';
        section.querySelector('.parchment-actions-rough')?.appendChild(el);
        console.warn(`[carregarEtapa] Created placeholder for ${selector}`);
      }
      found[selector] = !!el;
      if (found[selector]) {
        console.log(`[carregarEtapa] Critical element ${selector} FOUND.`);
      } else {
        console.warn(`[carregarEtapa] Critical element ${selector} NOT found.`);
      }
    }
    return found;
  }

  async function carregarEtapa(nome) {
    const id = `section-${nome}`;
    console.log('[carregarEtapa] Starting load for', nome, 'ID:', id);

    const existingSection = document.getElementById(id);
    if (existingSection && existingSection.dataset.initialized) {
      console.log(`[carregarEtapa] Section #${id} already initialized. Skipping.`);
      return existingSection;
    }

    if (existingSection) {
      console.log(`[carregarEtapa] Section #${id} already in DOM. Triggering sectionLoaded.`);
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: existingSection } }));
          resolve(existingSection);
        });
      });
    }

    const url = etapas[nome] || `/assets/html/section-${nome}.html`;
    console.log('[carregarEtapa] Loading via fetch:', url);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[carregarEtapa] HTTP failure loading stage:', res.status, url);
      throw new Error(`HTTP ${res.status} at ${url}`);
    }
    const html = await res.text();
    console.log('[carregarEtapa] Fetched HTML:', html.slice(0, 120) + '...');

    const container = document.createElement('div');
    container.innerHTML = html;
    let section = container.querySelector('#' + id);
    if (!section) {
      console.warn('[carregarEtapa] Section #' + id + ' not found in HTML. Using first element or creating new.');
      section = container.firstElementChild || document.createElement('section');
      section.id = id;
      section.innerHTML = container.innerHTML;
    }

    section.id = id;
    section.classList.add('section');
    section.dataset.initialized = 'true';
    const criticalElements = checkCriticalElements(section, id);

    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) {
      console.error('[carregarEtapa] Wrapper #jornada-content-wrapper not found!');
      throw new Error('Wrapper #jornada-content-wrapper not found.');
    }

    wrapper.innerHTML = '';
    wrapper.appendChild(section);
    console.log('[carregarEtapa] Injected into wrapper:', section.outerHTML.slice(0, 120) + '...');
    console.log('[carregarEtapa] (function () {
  'use strict';

  // jornada-loader.js: Definição de URLs para seções
 const etapas = {
    intro:    '/html/section-intro.html',
    termos:   '/html/section-termos.html',
    senha:    '/html/section-senha.html',
    filme1:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    guia:     '/html/section-guia.html',
    filme2:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    selfie:   '/html/section-selfie.html',
    filme3:    '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    perguntas:'/html/section-perguntas.html', 
    filme4:    '/assets/img/filme-5-fim-da-jornada.mp4',
    final:    '/html/section-final.html'
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
        section.appendChild(el);
        console.warn(`[carregarEtapa] Created placeholder for ${selector}`);
      }
      if (!el && (selector.startsWith('.nextBtn') || selector.startsWith('.prevBtn') || selector.startsWith('.avancarBtn'))) {
        el = document.createElement('button');
        el.classList.add('btn', 'btn-primary', 'btn-stone');
        el.dataset.action = selector.includes('next') ? 'termos-next' : selector.includes('prev') ? 'termos-prev' : 'avancar';
        el.textContent = selector.includes('next') ? 'Próxima página' : selector.includes('prev') ? 'Voltar' : 'Aceito e quero continuar';
        section.querySelector('.parchment-actions-rough')?.appendChild(el);
        console.warn(`[carregarEtapa] Created placeholder for ${selector}`);
      }
      found[selector] = !!el;
      if (found[selector]) {
        console.log(`[carregarEtapa] Critical element ${selector} FOUND.`);
      } else {
        console.warn(`[carregarEtapa] Critical element ${selector} NOT found.`);
      }
    }
    return found;
  }

  async function carregarEtapa(nome) {
    const id = `section-${nome}`;
    console.log('[carregarEtapa] Starting load for', nome, 'ID:', id);

    const existingSection = document.getElementById(id);
    if (existingSection && existingSection.dataset.initialized) {
      console.log(`[carregarEtapa] Section #${id} already initialized. Skipping.`);
      return existingSection;
    }

    if (existingSection) {
      console.log(`[carregarEtapa] Section #${id} already in DOM. Triggering sectionLoaded.`);
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: existingSection } }));
          resolve(existingSection);
        });
      });
    }

    const url = etapas[nome] || `/assets/html/section-${nome}.html`;
    console.log('[carregarEtapa] Loading via fetch:', url);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[carregarEtapa] HTTP failure loading stage:', res.status, url);
      throw new Error(`HTTP ${res.status} at ${url}`);
    }
    const html = await res.text();
    console.log('[carregarEtapa] Fetched HTML:', html.slice(0, 120) + '...');

    const container = document.createElement('div');
    container.innerHTML = html;
    let section = container.querySelector('#' + id);
    if (!section) {
      console.warn('[carregarEtapa] Section #' + id + ' not found in HTML. Using first element or creating new.');
      section = container.firstElementChild || document.createElement('section');
      section.id = id;
      section.innerHTML = container.innerHTML;
    }

    section.id = id;
    section.classList.add('section');
    section.dataset.initialized = 'true';
    const criticalElements = checkCriticalElements(section, id);

    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) {
      console.error('[carregarEtapa] Wrapper #jornada-content-wrapper not found!');
      throw new Error('Wrapper #jornada-content-wrapper not found.');
    }

    wrapper.innerHTML = '';
    wrapper.appendChild(section);
    console.log('[carregarEtapa] Injected into wrapper:', section.outerHTML.slice(0, 120) + '...');
    console.log('[carregarEtapa] Section #' + id + ' present:', !!document.getElementById(id));
    console.log('[carregarEtapa] Critical elements present:', criticalElements);

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
        resolve(section);
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
Section #' + id + ' present:', !!document.getElementById(id));
    console.log('[carregarEtapa] Critical elements present:', criticalElements);

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
        resolve(section);
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
 'ID:', `section-${sectionId}`);
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
