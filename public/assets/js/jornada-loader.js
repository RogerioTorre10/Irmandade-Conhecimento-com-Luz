(function () {
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
      if (!el && selector.startsWith('.nextBtn') || selector.startsWith('.prevBtn') || selector.startsWith('.avancarBtn')) {
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

    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Section #${id} already in DOM. Skipping.`);
      const section = document.getElementById(id);
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
          resolve(section);
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
