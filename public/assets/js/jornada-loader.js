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

const sectionCache = {};
function carregarEtapa(nome, callback) {
  const html = nome === 'intro' ? `
    <section id="section-intro" class="section bloco bloco-intro hidden">
      <div class="bloco-conteudo">
        <h1>Bem-vindo(a) à Jornada Essencial</h1>
        <p id="intro-p1" data-typing="true" data-text="Esta é uma experiência de reflexão profunda, simbólica e acolhedora." data-speed="36" data-cursor="true"></p>
        <p id="intro-p2" data-typing="true" data-text="Leia com atenção o Termo de Responsabilidade e siga quando estiver pronto(a)." data-speed="36" data-cursor="true"></p>
        <div class="termo">
          <h2>Termo de Responsabilidade e Consentimento</h2>
          <p>Ao iniciar, você concorda em participar de forma consciente, sabendo que este material é de autoconhecimento e não substitui apoio médico ou psicológico.</p>
        </div>
        <footer>
          <button id="btn-avancar" class="btn btn-primary hidd">Iniciar Jornada</button>
        </footer>
      </div>
    </section>
  ` : null;

  if (html) {
    console.log(`[carregarEtapa] Usando HTML hardcoded para ${nome}`);
    const container = document.getElementById('jornada-conteudo');
    container.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
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
    return;
  }

  const url = `/assets/html/jornada-${nome}.html`;
  if (sectionCache[url]) {
    console.log(`[carregarEtapa] Cache hit para ${url}`);
    const container = document.getElementById('jornada-conteudo');
    container.innerHTML = '';
    const temp = document.createElement('div');
    temp.innerHTML = sectionCache[url];
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
        console.error(`[carregarEtapa] Elemento #section-${nome} não encontrado após injeção (cache)`);
      }
      document.dispatchEvent(new CustomEvent('sectionLoaded', {
        detail: { sectionId: `section-${nome}`, root }
      }));
      if (callback) callback();
    }, 0);
    return;
  }

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.text();
    })
    .then(html => {
      console.log(`[carregarEtapa] HTML retornado para ${nome}:`, html);
      sectionCache[url] = html;
      const container = document.getElementById('jornada-conteudo');
      container.innerHTML = '';
      const temp = document.createElement('div');
      temp.innerHTML = html;
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
    })
    .catch(err => {
      console.error(`[carregarEtapa] Erro ao carregar etapa ${nome}:`, err);
      window.toast?.('Erro ao carregar etapa. Tente novamente.');
    });
}
  
  // Torna a função acessível globalmente
  window.carregarEtapa = carregarEtapa;

})();
