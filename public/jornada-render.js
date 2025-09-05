(function () {
  const g = window;
  
  console.log("[load] jornada-render.js");

  function ensureBaseCSS() {
    if (document.getElementById("jr-base-css")) return;
    const css = `
      .card { max-width: 900px; margin: 24px auto; padding: 20px; border-radius: 14px; box-shadow: 0 8px 28px rgba(0,0,0,.12); background: #fff; }
      .pergaminho { background: #f6efe0; }
      .pergaminho-v { background-image: url('/assets/img/pergaminho-rasgado-vert.png'); background-size: cover; background-position: center; }
      .pergaminho-h { background-image: url('/assets/img/pergaminho-rasgado-horiz.png'); background-size: cover; background-position: center; }
      .btn { display: inline-block; padding: .7rem 1.2rem; border-radius: 10px; border: 0; background: #1f2937; color: #fff; font-weight: 600; cursor: pointer; }
      .btn + .btn { margin-left: .5rem; }
      .title { font-size: 1.6rem; margin: 0 0 .5rem 0; }
      .muted { opacity: .75; }
    `;
    const style = document.createElement("style");
    style.id = "jr-base-css";
    style.textContent = css;
    document.head.appendChild(style);
  }
  ensureBaseCSS();

  function setPaper(mode) {
    if (g.JORNADA_PAPER && typeof g.JORNADA_PAPER.set === 'function') {
      try { g.JORNADA_PAPER.set(mode); } catch {}
    } else {
      const canvas = document.getElementById('jornada-canvas');
      if (canvas) {
        canvas.classList.remove('pergaminho-v', 'pergaminho-h');
        canvas.classList.add(mode === 'h' ? 'pergaminho-h' : 'pergaminho-v');
      }
    }
  }

  const MasterAPI = {
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
