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
// ===== PATCH: Expor Loader.ensure(id) =====
(() => {
  const Loader = window.Loader = window.Loader || {};

  Loader.ensure = async function(id) {
    // Já existe no DOM?
    let el = document.getElementById(id);
    if (el) return el;

    console.log('[Loader.ensure] Montando', id);

    // 1) Se você já tem o "carregarEtapa", use-o como caminho preferencial atual
    if (typeof window.carregarEtapa === 'function') {
      try {
        const maybeRoot = await window.carregarEtapa(id);
        el = document.getElementById(id) || maybeRoot;
        if (el) {
          console.log('[Loader.ensure] Montado via carregarEtapa');
          window.i18n?.apply?.(); // reaplica traduções após inserir HTML
          return el;
        }
      } catch (e) {
        console.warn('[Loader.ensure] carregarEtapa falhou:', e);
      }
    }

    // 2) Caminho futuro (templates por arquivo). Tenta buscar:
    const tryFetch = async (url) => {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        const html = await res.text();
        const mountAt = document.getElementById('app') || document.body;
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        const found = tmp.querySelector(`#${id}`) || tmp.firstElementChild;
        if (found) {
          mountAt.appendChild(found);
          console.log('[Loader.ensure] Inserido a partir de', url);
          return found;
        }
      } catch { /* ignora */ }
      return null;
    };

    el = await tryFetch(`/html/${id}.html`) ||
         await tryFetch(`/html/${id.replace('section-','')}.html`);

    // 3) Fallback final: cria contêiner vazio para não quebrar fluxo
    if (!el) {
      const mountAt = document.getElementById('app') || document.body;
      const sec = document.createElement('section');
      sec.id = id;
      sec.className = 'section bloco hidden';
      mountAt.appendChild(sec);
      el = sec;
      console.warn('[Loader.ensure] Fallback: criou contêiner vazio para', id);
    }

    window.i18n?.apply?.();
    return el;
  };
})();


