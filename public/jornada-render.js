/* /jornada-render.js */
(function (ns) {
  // ---------- Utils ----------
  function qs(sel, root = document)  { return root.querySelector(sel); }
  function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }
  function showSection(id) {
    qsa('section.card').forEach(sec => {
      if (sec.id === id) sec.classList.remove('hidden');
      else sec.classList.add('hidden');
    });
  }
  ns.qs = ns.qs || qs;
  ns.qsa = ns.qsa || qsa;
  ns.showSection = ns.showSection || showSection;

  // ---------- Intro ----------
  ns.renderIntro = async function renderIntro() {
    if (location.hash !== '#intro') history.replaceState(null, '', '#intro');

    const introSection = qs('#intro');
    if (introSection) {
      showSection('intro');
      wireIntroButtons();
      return;
    }
    const app = qs('#app') || qs('main') || document.body;
    try {
      const res = await fetch('/html/intro.html', { cache: 'no-store' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const html = await res.text();

      const section = document.createElement('section');
      section.id = 'intro';
      section.className = 'card pergaminho pergaminho-v';
      section.innerHTML = html;

      qsa('section.card').forEach(s => s.classList.add('hidden'));
      app.appendChild(section);

      wireIntroButtons();
    } catch (err) {
      console.error('[JORNADA] Falha ao carregar /html/intro.html', err);
      alert('Não foi possível carregar a introdução.');
    }
  };

  function wireIntroButtons() {
    const goBtn = qs('#btnIniciarPerguntas') || qs('[data-action="iniciar-perguntas"]');
    if (goBtn) {
      goBtn.onclick = (e) => {
        e.preventDefault();
        if (typeof ns.renderPerguntas === 'function') ns.renderPerguntas(0);
        else console.warn('[JORNADA] renderPerguntas não definida.');
      };
    }
  }

  // ---------- Perguntas ----------
  ns.renderPerguntas = function renderPerguntas(startIndex = 0) {
    if (location.hash !== '#perguntas') history.replaceState(null, '', '#perguntas');

    const sec = qs('#perguntas');
    if (sec) {
      showSection('perguntas');
      initPerguntasUI(startIndex);
      return;
    }

    const app = qs('#app') || qs('main') || document.body;
    const section = document.createElement('section');
    section.id = 'perguntas';
    section.className = 'card pergaminho pergaminho-h';
    section.innerHTML = `
      <header class="titulo">
        <h2>Perguntas</h2>
        <p class="sub">Etapa de reflexão</p>
      </header>
      <div id="blocoPerguntas"></div>
      <div class="acoes">
        <button id="btnVoltarIntro">Voltar</button>
        <button id="btnProxima">Próxima</button>
      </div>
    `;
    qsa('section.card').forEach(s => s.classList.add('hidden'));
    app.appendChild(section);
    initPerguntasUI(startIndex);
  };

  function initPerguntasUI(i) {
    const btnVoltar = qs('#btnVoltarIntro');
    if (btnVoltar) btnVoltar.onclick = (e) => {
      e.preventDefault();
      if (typeof ns.renderIntro === 'function') ns.renderIntro();
    };
    const btnNext = qs('#btnProxima');
    if (btnNext) btnNext.onclick = (e) => {
      e.preventDefault();
      console.log('[JORNADA] Próxima pergunta a partir do índice', i);
    };
  }
})(window.JORNADA = window.JORNADA || {});
