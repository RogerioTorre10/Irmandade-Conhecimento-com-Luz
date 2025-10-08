(function () {
  'use strict';

  const etapas = {
    intro: '/html/jornada-intro.html',
    termos: '/html/jornada-termos.html',
    senha: '/html/jornada-senha.html',
    barra: '/html/jornada_barracontador.html',
    olho: '/html/jornada_olhomagico.html',
    final: '/html/jornada-final.html'
  };

  function carregarEtapa(nome, html, callback) {
    console.log(`[carregarEtapa] Usando HTML para ${nome}`);
    const container = document.getElementById('jornada-conteudo');
    if (!container) {
      console.error('[carregarEtapa] Contêiner #jornada-conteudo não encontrado');
      return;
    }
    container.innerHTML = ''; // Limpa o contêiner

    const temp = document.createElement('div');
    temp.innerHTML = html;

    // Processar scripts embutidos
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
        newScript.async = true; // Adiciona async para scripts externos
      } else {
        try {
          // Avalia o conteúdo do script como uma função
          const scriptContent = script.textContent.trim();
          if (scriptContent) {
            // Se for uma arrow function, executa diretamente
            if (scriptContent.startsWith('() =>')) {
              eval(`(${scriptContent})()`); // Executa a função
            } else {
              newScript.textContent = scriptContent;
              document.body.appendChild(newScript);
            }
          }
        } catch (error) {
          console.error('[carregarEtapa] Erro ao executar script embutido:', error);
        }
      }
    });
    scripts.forEach(s => s.remove());

    // Transfere o conteúdo para o contêiner
    while (temp.firstChild) {
      container.appendChild(temp.firstChild);
    }

    // Verifica a seção carregada
    setTimeout(() => {
      const root = container.querySelector(`#section-${nome}`);
      console.log(`[carregarEtapa] Root encontrado para section-${nome}:`, root);
      if (!root) {
        console.error(`[carregarEtapa] Elemento #section-${nome} não encontrado`);
      }
      document.dispatchEvent(new CustomEvent('sectionLoaded', {
        detail: { sectionId: `section-${nome}`, root }
      }));
      if (callback && typeof callback === 'function') {
        callback();
      }
    }, 0);
  }

  window.carregarEtapa = carregarEtapa;
})();
