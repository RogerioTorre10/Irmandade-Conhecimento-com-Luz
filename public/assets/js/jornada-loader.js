(function () {
  'use strict';

  const etapas = {
    intro: 'assets/html/section-intro.html',
    termos: 'assets/html/section-termos.html',
    senha: 'assets/html/section-senha.html',
    guia: 'assets/html/section-guia.html',
    selfie: 'assets/html/section-selfie.html',
    perguntas: 'assets/html/section-perguntas.html',
    final: 'assets/html/section-final.html',
  };

  const SECTION_CONTAINER_ID = 'section-conteudo';

  // Função para verificar se os elementos críticos estão no DOM
  function checkCriticalElements(section, nome) {
    if (nome === 'intro') {
      const criticalElements = ['#intro-p1', '#intro-p2', '#btn-avancar'];
      for (const selector of criticalElements) {
        if (!section.querySelector(selector)) {
          console.warn(`[carregarEtapa] Elemento crítico ${selector} não encontrado na seção ${nome}`);
          return false;
        }
      }
      console.log(`[carregarEtapa] Todos os elementos críticos encontrados para ${nome}`);
      return true;
    }
    return true; // Para outras seções, assume que está OK
  }

  // O objetivo desta função é GARANTIR que a seção esteja no DOM antes de resolver
  async function carregarEtapa(nome) {
    let section = null;
    const url = etapas[nome] || `/assets/html/section-${nome}.html`;
    const id = `section-${nome}`;

    // Se já estiver no DOM, retorna o elemento
    if (document.getElementById(id)) {
      console.log(`[carregarEtapa] Seção #${id} já está no DOM. Pulando fetch.`);
      return document.getElementById(id);
    }

    console.log('[carregarEtapa] Carregando etapa', nome, 'de:', url);

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.error('[carregarEtapa] Falha HTTP ao carregar etapa:', res.status, url);
      throw new Error(`HTTP ${res.status} em ${url}`);
    }
    const html = await res.text();

    // Tenta encontrar o fragmento
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    section = doc.querySelector('#' + id) || doc.querySelector(`[data-section="${nome}"]`) || doc.querySelector('section');

    if (!section) {
      console.error(`[carregarEtapa] Fragmento HTML da seção '${nome}' não encontrado no arquivo recebido!`);
      throw new Error(`Fragmento HTML da seção '${nome}' não encontrado.`);
    }

    // Limpa e prepara a seção
    section.querySelectorAll('script').forEach(s => s.remove());
    if (!section.id) section.id = id;
    section.classList.add('section');

    // O container auxiliar (#jornada-content-wrapper)
    const container = document.getElementById('jornada-content-wrapper');
    if (!container) {
      console.error('[carregarEtapa] Content Wrapper (#jornada-content-wrapper) não encontrado!');
      throw new Error('Jornada Content Wrapper não encontrado.');
    }

    // Limpa o wrapper e anexa a nova seção
    container.innerHTML = '';
    container.appendChild(section);
    console.log('[carregarEtapa] Injetada e apensa no wrapper:', section.outerHTML.slice(0, 120) + '...');

    // Aguarda o DOM estar completamente pronto
    return new Promise(resolve => {
      // Usa dois ciclos de requestAnimationFrame para garantir parsing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Verifica elementos críticos antes de disparar o evento
          if (checkCriticalElements(section, nome)) {
            console.log(`[carregarEtapa] DOM pronto, disparando sectionLoaded para ${nome}`);
            document.dispatchEvent(new CustomEvent('sectionLoaded', {
              detail: { sectionId: id, name: nome, node: section }
            }));
          } else {
            console.warn(`[carregarEtapa] Elementos críticos ausentes, tentando fallback para ${nome}`);
            // Tenta mais uma vez após um pequeno delay
            setTimeout(() => {
              if (checkCriticalElements(section, nome)) {
                document.dispatchEvent(new CustomEvent('sectionLoaded', {
                  detail: { sectionId: id, name: nome, node: section }
                }));
              } else {
                console.error(`[carregarEtapa] Falha ao encontrar elementos críticos para ${nome}`);
                window.toast?.(`Falha ao carregar elementos da seção ${nome}.`, 'error');
              }
              resolve(section);
            }, 100);
          }
          resolve(section);
        });
      });
    });
  }

  window.carregarEtapa = carregarEtapa;
})();
