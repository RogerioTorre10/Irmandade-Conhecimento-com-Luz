(function () {
  'use strict';

  const etapas = {
    intro: '/html/section-intro.html',
    filme1: '/assets/videos/filme-pergaminho-ao-vento.mp4',
    termos1: '/html/section-termos1.html',
    termos2: '/html/section-termos2.html',
    filme2: '/assets/videos/filme-senha.mp4',
    senha: '/html/section-senha.html',
    filme3: '/assets/videos/filme-senha-confirmada.mp4',
    guia: '/html/section-guia.html',
    filme4: '/assets/videos/conhecimento-com-luz-jardim.mp4',
    selfie: '/html/section-selfie.html',
    filme5: '/assets/videos/filme-0-ao-encontro-da-jornada.mp4',
    perguntas: '/html/section-perguntas.html',
    filme6: '/assets/videos/filme-5-fim-da-jornada.mp4',
    final: '/html/section-final.html'
  };

  async function carregarEtapa(nome) {
    const id = `section-${nome}`;
    const existingSection = document.getElementById(id);
    if (existingSection && existingSection.dataset.initialized) {
      console.log('[Loader] Seção já inicializada, ignorando:', id);
      return existingSection;
    }

    if (existingSection) {
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', {
            detail: { sectionId: id, name: nome, node: existingSection }
          }));
          resolve(existingSection);
        });
      });
    }

    const url = etapas[nome] || `/assets/html/section-${nome}.html`;
    if (url.endsWith('.mp4')) {
      return new Promise(resolve => {
        window.playTransitionVideo(url, id);
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: id, name: nome, node: null }
        }));
        resolve(null);
      });
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status} at ${url}`);
    const html = await res.text();

    const container = document.createElement('div');
    container.innerHTML = html;
    let section = container.querySelector(`#${id}`) || container.querySelector('section');
    if (!section) {
      section = document.createElement('section');
      section.id = id;
      section.innerHTML = `<div id="${id}-pg1" data-typing="true">Erro ao carregar ${id}. Tente novamente.</div>`;
    }

    section.id = id;
    section.classList.add('section');
    section.dataset.initialized = 'true';

    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) throw new Error('Wrapper #jornada-content-wrapper not found.');
    wrapper.innerHTML = '';
    wrapper.appendChild(section);

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: id, name: nome, node: section }
        }));
        resolve(section);
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
