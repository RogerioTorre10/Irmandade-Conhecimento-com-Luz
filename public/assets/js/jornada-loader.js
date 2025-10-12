(function () {
  'use strict';

  // Templates embutidos para seções críticas (sem dependência de arquivos externos)
  const templates = {
    intro: `
      <section id="section-intro" class="card pergaminho pergaminho-v section">
        <div id="jornada-content-wrapper">
          <div class="intro-wrap">
            <div id="intro-p1" class="intro-paragraph" data-typing="true" data-speed="36" data-cursor="true">
              <p Bem-vindo à Jornada Conhecimento com Luz.></p>
            </div>
            <div id="intro-p2" class="intro-paragraph" data-typing="true" data-speed="36" data-cursor="true">
             <p Respire fundo. Vamos caminhar juntos com fé, coragem e propósito.></p>
            </div>
            <div class="intro-actions">
              <button id="btn-avancar" class="btn btn-primary btn-stone" data-action="avancar" disabled>Iniciar</button>
            </div>
          </div>
        </div>
      </section>
    `,
    // Adicione templates para outras seções aqui, se necessário
    // Exemplo:
    // termos: `<section id="section-termos">...</section>`
  };

  // Definição de URLs para seções não embutidas (ex.: vídeos)
  const etapas = {
    intro:    '/assets/html/section-intro.html',
    termos:   '/assets/html/section-termos.html',
    senha:    '/assets/html/section-senha.html',
    filme:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    guia:     '/assets/html/section-guia.html',
    filme:    '/assets/img/conhecimento-com-luz-jardim.mp4',
    selfie:   '/assets/html/section-selfie.html',
    filme:    '/assets/img/filme-0-ao-encontro-da-jornada.mp4',
    perguntas:'/assets/html/section-perguntas.html', 
    filme:    '/assets/img/filme-5-fim-da-jornada.mp4',
    final:    '/assets/html/section-final.html'
    };

 // Função para verificar elementos críticos no HTML
  function checkCriticalElements(section, sectionId) {
    const criticalSelectors = {
      'section-intro': ['#intro-p1', '#intro-p2', '#btn-avancar'],
      // Adicione seletores para outras seções, se necessário
      // 'section-termos': ['[data-action="termos-next"]']
    }[sectionId] || [];

    const found = {};
    for (const selector of criticalSelectors) {
      found[selector] = !!section.querySelector(selector);
      if (found[selector]) {
        console.log(`[carregarEtapa] Elemento crítico ${selector} ENCONTRADO.`);
      } else {
        console.warn(`[carregarEtapa] Elemento crítico ${selector} NÃO encontrado.`);
      }
    }
    return found;
  }

  async function carregarEtapa(nome) {
    const id = `section-${nome}`;
    console.log('[carregarEtapa] Iniciando carregamento para', nome, 'ID:', id);

    // Verifica se a seção já existe no DOM
    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Seção #${id} já está no DOM. Pulando.`);
      const section = document.getElementById(id);
      return new Promise(resolve => {
        requestAnimationFrame(() => {
          document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
          resolve(section);
        });
      });
    }

    // Tenta carregar o template embutido
    let html = templates[nome];
    if (html) {
      console.log('[carregarEtapa] Usando template embutido para', nome);
    } else {
      const url = etapas[nome] || `/assets/html/section-${nome}.html`;
      console.log('[carregarEtapa] Carregando via fetch:', url);
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) {
        console.error('[carregarEtapa] Falha HTTP ao carregar etapa:', res.status, url);
        throw new Error(`HTTP ${res.status} em ${url}`);
      }
      html = await res.text();
    }

    // Cria um contêiner temporário para processar o HTML
    const container = document.createElement('div');
    container.innerHTML = html;
    let section = container.querySelector('#' + id);
    if (!section) {
      console.warn('[carregarEtapa] Seção #' + id + ' não encontrada no HTML. Usando primeiro elemento ou criando novo.');
      section = container.firstElementChild || document.createElement('section');
      section.id = id;
      section.innerHTML = container.innerHTML;
    }

    // Garante que o ID e a classe estejam corretos
    section.id = id;
    section.classList.add('section');
    const criticalElements = checkCriticalElements(section, id);

    // Verifica se o wrapper existe
    const wrapper = document.getElementById('jornada-content-wrapper');
    if (!wrapper) {
      console.error('[carregarEtapa] Wrapper #jornada-content-wrapper não encontrado!');
      throw new Error('Wrapper #jornada-content-wrapper não encontrado.');
    }

    // Limpa o wrapper e injeta a seção
    wrapper.innerHTML = '';
    wrapper.appendChild(section);
    console.log('[carregarEtapa] Injetada no wrapper:', section.outerHTML.slice(0, 120) + '...');
    console.log('[carregarEtapa] Elemento #' + id + ' presente:', !!document.getElementById(id));
    console.log('[carregarEtapa] Elementos críticos presentes:', criticalElements);

    return new Promise(resolve => {
      requestAnimationFrame(() => {
        document.dispatchEvent(new CustomEvent('sectionLoaded', { detail: { sectionId: id, name: nome, node: section } }));
        resolve(section);
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
