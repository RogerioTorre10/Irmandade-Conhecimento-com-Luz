(function () {
  'use strict';

  const etapas = {
    intro: '/html/section-intro.html',
    termos: '/assets/html/jornada-termos.html',
    senha: '/assets/html/jornada-senha.html',
    barra: '/assets/html/jornada_barracontador.html',
    olho: '/assets/html/jornada_olhomagico.html',
    final: '/assets/html/jornada-final.html'
  };

  const JORNADA_CONTAINER_ID = 'jornada-conteudo';

  async function carregarEtapa(nome, callback) {
    const url = etapas[nome];
    const container = document.getElementById(JORNADA_CONTAINER_ID);

    if (!url || !container) {
      console.error(`[carregarEtapa] URL ou contêiner inválido para etapa '${nome}'`);
      return;
    }

    console.log(`[carregarEtapa] Carregando etapa '${nome}' de: ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} ao buscar '${url}'`);

      const html = await response.text();
      console.log(`[carregarEtapa] HTML recebido para '${nome}':`, html);

      const temp = document.createElement('div');
      temp.innerHTML = html;

      // Executar scripts embutidos
      const scripts = temp.querySelectorAll('script');
      scripts.forEach(script => {
        const newScript = document.createElement('script');
        if (script.src) {
          newScript.src = script.src;
          newScript.async = true;
          document.body.appendChild(newScript);
        } else {
          const content = script.textContent.trim();
          if (content) {
            try {
              if (content.startsWith('() =>')) {
                eval(`(${content})()`);
              } else {
                newScript.textContent = content;
                document.body.appendChild(newScript);
              }
            } catch (err) {
              console.error('[carregarEtapa] Erro ao executar script embutido:', err);
            }
          }
        }
      });

      // Remover scripts do HTML antes de injetar
      scripts.forEach(s => s.remove());

      // Limpar e injetar conteúdo
      container.innerHTML = '';
      while (temp.firstChild) {
        container.appendChild(temp.firstChild);
      }

      // Log do DOM após injeção
      console.log(`[carregarEtapa] DOM após injeção para '${nome}':`, container.innerHTML);

      // Esperar o DOM renderizar (ajuste de tempo)
      setTimeout(() => {
        let root = container.querySelector(`#section-${nome}`) ||
                   container.querySelector(`section[data-section="section-${nome}"]`) ||
                   container.querySelector(`section.bloco-${nome}`);

        if (!root) {
          console.warn(`[carregarEtapa] Elemento #section-${nome} não encontrado após injeção. Criando fallback...`);
          root = document.createElement('section');
          root.id = `section-${nome}`;
          root.classList.add('hidden'); // Esconde o elemento
          container.appendChild(root);
        } else {
          console.log(`[carregarEtapa] Root encontrado:`, root);
        }

        // Disparar evento para o controller
        document.dispatchEvent(new CustomEvent('sectionLoaded', {
          detail: { sectionId: `section-${nome}`, root }
        }));

        if (typeof callback === 'function') callback();
      }, 150); // Tempo ajustado para garantir renderização

    } catch (error) {
      console.error(`[carregarEtapa] Falha ao carregar etapa '${nome}':`, error.message);
    }
  }

  window.carregarEtapa = carregarEtapa;
})();
