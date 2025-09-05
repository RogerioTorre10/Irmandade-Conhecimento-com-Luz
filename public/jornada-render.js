(function () {
  'use strict';

  const JR = (window.JORNADA_RENDER = window.JORNADA_RENDER || {});

  function renderIntro() {
    console.log('[JORNADA_RENDER] Renderizando intro');
    const section = document.getElementById('section-intro');
    if (section) {
      section.classList.remove('hidden');
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.className = 'card pergaminho pergaminho-v';
        canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-vert.png)';
      }
    }
  }

  function renderPerguntas(blocoIndex = 0) {
    console.log('[JORNADA_RENDER] Renderizando perguntas, bloco:', blocoIndex);
    const section = document.getElementById('section-perguntas');
    if (section) {
      section.classList.remove('hidden');
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.className = 'card pergaminho pergaminho-h';
        canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-horiz.png)';
      }
      const perguntasContainer = document.getElementById('perguntas-container');
      if (perguntasContainer) {
        const blocos = Array.from(perguntasContainer.querySelectorAll('.j-bloco'));
        if (blocos[blocoIndex]) {
          blocos.forEach(b => b.style.display = 'none');
          blocos[blocoIndex].style.display = 'block';
          const perguntas = Array.from(blocos[blocoIndex].querySelectorAll('.j-pergunta'));
          if (perguntas.length) {
            perguntas.forEach(p => p.classList.remove('active'));
            perguntas[0].classList.add('active'); // Exibe a primeira pergunta por padrão
          }
        }
      }
    }
  }

  function renderFinal() {
    console.log('[JORNADA_RENDER] Renderizando final');
    const section = document.getElementById('section-final');
    if (section) {
      section.classList.remove('hidden');
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.className = 'card pergaminho pergaminho-v';
        canvas.style.backgroundImage = 'url(/assets/img/pergaminho-rasgado-vert.png)';
      }
    }
  }

  JR.renderIntro = renderIntro;
  JR.renderPerguntas = renderPerguntas;
  JR.renderFinal = renderFinal;

  console.log('[JORNADA_RENDER] Módulo carregado');
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->  const MasterAPI = {
    async renderIntro() {
      console.log("[renderer] renderIntro()");
      setPaper('v');
      if (g.JC && typeof g.JC.render === "function") {
        console.log('[MasterAPI] Delegando renderIntro para JC.render');
        return g.JC.render();
      }
      console.warn('[MasterAPI] Fallback: JC.render não disponível');
      const sec = document.createElement("section");
      sec.className = "card pergaminho pergaminho-v";
      sec.innerHTML = `
        <h2 class="title">Bem-vindo(a) à Jornada</h2>
        <p class="muted">Renderer Master (fallback). Verifique se jornada-controller.js está carregado.</p>
        <div class="actions">
          <button class="btn" onclick="window.JORNADA_RENDER && window.JORNADA_RENDER.renderPerguntas(0)">Começar</button>
        </div>
      `;
      const target = document.getElementById("jornada-conteudo");
      if (target) target.appendChild(sec);
      return sec;
    },

    async renderPerguntas(fileOrIndex = 0) {
      console.log("[renderer] renderPerguntas()", fileOrIndex);
      setPaper('h');
      if (g.JC && typeof g.JC.render === "function") {
        console.log('[MasterAPI] Delegando renderPerguntas para JC.render');
        return g.JC.render();
      }
      console.warn('[MasterAPI] Fallback: JC.render não disponível');
      const sec = document.createElement("section");
      sec.className = "card pergaminho pergaminho-h";
      sec.innerHTML = `
        <h2 class="title">Perguntas</h2>
        <p class="muted">Renderer Master (fallback). Impossível carregar perguntas sem jornada-controller.js.</p>
      `;
      const target = document.getElementById("jornada-conteudo");
      if (target) target.appendChild(sec);
      return sec;
    },

    async renderFinal() {
      console.log("[renderer] renderFinal()");
      setPaper('v');
      if (g.JC && typeof g.JC.render === "function") {
        console.log('[MasterAPI] Delegando renderFinal para JC.render');
        return g.JC.render();
      }
      console.warn('[MasterAPI] Fallback: JC.render não disponível');
      const sec = document.createElement("section");
      sec.className = "card pergaminho pergaminho-v";
      sec.innerHTML = `
        <h2 class="title">Finalização</h2>
        <p class="muted">Renderer Master (fallback). Obrigado por participar.</p>
        <button id="btnFinalizar" class="btn btn-primary">Concluir Jornada</button>
      `;
      const target = document.getElementById("jornada-conteudo");
      if (target) target.appendChild(sec);
      const btn = sec.querySelector("#btnFinalizar");
      if (btn) {
        btn.addEventListener("click", () => {
          const respostas = (window.JC && window.JC._state && window.JC._state.respostas) || {};
          console.log('[FINALIZAR] clique btn, respostas=', respostas);
          window.JORNADA_DOWNLOAD(respostas).then(() => {
            alert('Jornada concluída! Arquivos gerados.');
            location.replace('/index.html');
          }).catch(() => alert('Erro ao gerar arquivos.'));
        });
      }
      return sec;
    },

    start() {
      console.log("[renderer] start()");
      const route = (location.hash || '#intro').slice(1);
      if (route === 'perguntas') setPaper('h'); else setPaper('v');
      if (g.JC && typeof g.JC.init === "function") {
        console.log('[MasterAPI] Iniciando com JC.init');
        g.JC.init();
        return;
      }
      console.warn('[MasterAPI] Fallback: JC.init não disponível');
      this.renderIntro();
    },
  };

  (function (root) {
    const base = (root.JRENDER && root.JRENDER.master) || MasterAPI;
    const PlusAPI = {
      ...base,
      async renderIntro() {
        const sec = await base.renderIntro();
        sec?.classList?.add("layout-plus");
        return sec;
      },
      async renderPerguntas(fileOrIndex = 0) {
        const sec = await base.renderPerguntas(fileOrIndex);
        sec?.classList?.add("layout-plus");
        const T = window.JORNADA_TYPE;
        const h = sec.querySelector?.('.pergunta__titulo');
        const p = sec.querySelector?.('.pergunta__apoio');
        if (T && h) T.typeIt(h, h.textContent, 24);
        if (T && p) T.typeIt(p, p.textContent, 18);
        try {
          const UI = window.JORNADA_UI || {};
          const J = window.JC && window.JC._state || {};
          if (UI.setProgressoBlocos && typeof J.blocoIndex === 'number' && typeof window.JORNADA_CFG.TOTAL_BLOCKS === 'number') {
            UI.setProgressoBlocos(J.blocoIndex, window.JORNADA_CFG.TOTAL_BLOCKS);
          }
          if (UI.setProgressoPerguntas) {
            const totalPerguntas = Math.max(1, J.perguntasDo && J.perguntasDo(J.blocoAtivo()).length || 5);
            const idxPergunta = Math.max(0, Math.min(totalPerguntas, (J.perguntaIndex ?? 0)));
            const pct = Math.round((idxPergunta / totalPerguntas) * 100);
            UI.setProgressoPerguntas(pct);
          }
        } catch (e) {
          console.warn('Progresso (renderPerguntas) falhou:', e);
        }
        return sec;
      },
      async renderFinal() {
        const sec = await base.renderFinal();
        sec?.classList?.add("layout-plus");
        return sec;
      },
    };
    root.JRENDER.plus = PlusAPI;
  })(g);

  (function (root) {
    const base = (root.JRENDER && root.JRENDER.master) || MasterAPI;
    const JuniorAPI = {
      ...base,
      async renderIntro() {
        const sec = await base.renderIntro();
        sec?.classList?.add("layout-junior");
        sec?.querySelectorAll?.("video").forEach(v => v.remove());
        return sec;
      },
      async renderPerguntas(fileOrIndex = 0) {
        const sec = await base.renderPerguntas(fileOrIndex);
        sec?.classList?.add("layout-junior");
        return sec;
      },
      async renderFinal() {
        const sec = await base.renderFinal();
        sec?.classList?.add("layout-junior");
        return sec;
      },
    };
    root.JRENDER.junior = JuniorAPI;
  })(g);

  function selectVariant() {
    const key = (document.body?.dataset?.layout || "master").toLowerCase();
    const map = {
      master: g.JRENDER.master,
      plus:   g.JRENDER.plus   || g.JRENDER.master,
      junior: g.JRENDER.junior || g.JRENDER.master,
    };
    const api = map[key] || g.JRENDER.master;
    g.JORNADA_RENDER     = api;
    g.onJornadaEssencial = typeof api.start === "function" ? api.start : () => g.JC?.init?.();
    g.renderIntro        = (...a) => api.renderIntro?.(...a);
    g.renderPerguntas    = (...a) => api.renderPerguntas?.(...a);
    g.renderFinal        = (...a) => api.renderFinal?.(...a);
    console.log(`[Renderer] ativo: ${key}`);
    console.log("[renderer] variante ativa:", (document.body?.dataset?.layout || "master"), "| JORNADA_RENDER set?", !!g.JORNADA_RENDER);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", selectVariant);
  } else {
    selectVariant();
  }
})();
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
