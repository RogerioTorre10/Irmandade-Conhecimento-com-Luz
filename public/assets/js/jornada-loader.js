(function () {
  'use strict';

  const etapas = {
    intro:  '/html/jornada-intro.html',
    termos: '/html/jornada-termos.html',
    senha:  '/html/jornada-senha.html',
    barra:  '/html/jornada_barracontador.html',
    olho:   '/html/jornada_olhomagico.html',
    final:  '/html/jornada-final.html'
  };

  `; // HTML hardcoded pra teste
  console.log(`[carregarEtapa] Usando HTML hardcoded para ${nome}`);
  const container = document.getElementById('jornada-conteudo');
  container.innerHTML = ''; // limpa antes
  const temp = document.createElement('div');
  temp.innerHTML = html;
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
  scripts.forEach(s => s.remove());
  while (temp.firstChild) {
    container.appendChild(temp.firstChild);
  }
  setTimeout(() => {
    const root = container.querySelector(`#section-${nome}`);
    console.log(`[carregarEtapa] Root encontrado para section-${nome}:`, root);
    if (!root) {
      console.error(`[carregarEtapa] Elemento #section-${nome} não encontrado após injeção`);
    }
    document.dispatchEvent(new CustomEvent('sectionLoaded', {
      detail: { sectionId: `section-${nome}`, root }
    }));
    if (callback) callback();
  }, 0);
}


