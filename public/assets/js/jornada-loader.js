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

  // Função para carregar uma etapa
  function carregarEtapa(nome, html, callback) {
    console.log(`[carregarEtapa] Usando HTML para ${nome}`);
    const container = document.getElementById('jornada-conteudo');
    container.innerHTML = ''; // Limpa o contêiner antes

    const temp = document.createElement('div');
    temp.innerHTML = html; // Insere o HTML recebido

    // Executa scripts embutidos (se houver)
    const scripts = temp.querySelectorAll('script');
    scripts.forEach(script => {
      const newScript = document.createElement('script');
      if (script.src) {
        newScript.src = script.src;
      } else {
        newScript.textContent = script.textContent;
      }
      document.body.appendChild(newScript);
    });
    scripts.forEach(s => s.remove()); // Remove scripts originais

    // Transfere o conteúdo do temp para o contêiner
    while (temp.firstChild) {
      container.appendChild(temp.firstChild);
    }

    // Verifica se o elemento da seção foi encontrado
    setTimeout(() => {
      const root = container.querySelector(`#section-${nome}`);
      console.log(`[carregarEtapa] Root encontrado para section-${nome}:`, root);
      if (!root) {
        console.error(`[carregarEtapa] Elemento #section-${nome} não encontrado após injeção`);
      }
      document.dispatchEvent(new CustomEvent('sectionLoaded', {
        detail: { sectionId: `section-${nome}`, root }
      }));
      if (callback && typeof callback === 'function') {
        callback();
      }
    }, 0);
  }

  // Exemplo de uso (remova isso em produção, é só para teste)
  // carregarEtapa('intro', '<div id="section-intro">Conteúdo de teste</div>', () => {
  //   console.log('Callback executado!');
  // });

  // Expor a função globalmente, se necessário
  window.carregarEtapa = carregarEtapa;
})();
