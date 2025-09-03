/* =============================================================================
   TÍTULO: RENDER UNIFICADO
   SUBTÍTULO: Master + Plus + Junior no mesmo arquivo
   LOCALIZAÇÃO DOS MÓDULOS NESTE ARQUIVO
     === RENDER MASTER ===
       - Subtítulo: Base CSS mínimo
       - Subtítulo: MasterAPI (renderIntro/renderPerguntas/renderFinal/start)
       - Subtítulo: Export do módulo master
     === RENDER PLUS ===
       - Subtítulo: PlusAPI (herda do Master e adiciona .layout-plus)
     === RENDER JUNIOR ===
       - Subtítulo: JuniorAPI (herda do Master, remove vídeos pesados)
     === SELETOR DE VARIANTE ===
       - Subtítulo: Escolha pelo body[data-layout] e exposição da API pública
============================================================================= */

(function () {
  const g = window;

  /* ===========================================================================
     === RENDER MASTER =========================================================
     SUBTÍTULO: Base CSS mínimo (opcional) + API master
  =========================================================================== */

  // Subtítulo: Base CSS mínimo (mantém apenas se você quiser um fallback visual)
  function ensureBaseCSS() {
    if (document.getElementById("jr-base-css")) return;
    const css = `
      .card{max-width:900px;margin:24px auto;padding:20px;border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.12);background:#fff}
      .pergaminho{background:#f6efe0;}
      .pergaminho-v{background-image:url('/assets/img/pergaminho-vert.png');background-size:cover;background-position:center;}
      .pergaminho-h{background-image:url('/assets/img/pergaminho-horiz.png');background-size:cover;background-position:center;}
      .btn{display:inline-block;padding:.7rem 1.2rem;border-radius:10px;border:0;background:#1f2937;color:#fff;font-weight:600;cursor:pointer}
      .btn + .btn{margin-left:.5rem}
      .title{font-size:1.6rem;margin:0 0 .5rem 0}
      .muted{opacity:.75}
    `;
    const style = document.createElement("style");
    style.id = "jr-base-css";
    style.textContent = css;
    document.head.appendChild(style);
  }
  ensureBaseCSS();

  // Subtítulo: MasterAPI — delega para JornadaCtrl quando disponível
  const MasterAPI = {
    async renderIntro() {
      if (g.JornadaCtrl && typeof g.JornadaCtrl.renderIntro === "function") {
        return g.JornadaCtrl.renderIntro();
      }
      // Fallback mínimo
      const sec = document.createElement("section");
      sec.className = "card pergaminho";
      sec.innerHTML = `
        <h2 class="title">Bem-vindo(a) à Jornada</h2>
        <p class="muted">Renderer Master (fallback). Verifique se JornadaCtrl está carregado.</p>
        <div class="actions">
          <button class="btn" onclick="window.JORNADA_RENDER && window.JORNADA_RENDER.renderPerguntas(0)">Começar</button>
        </div>
      `;
      document.getElementById("jornada-conteudo")?.appendChild(sec);
      return sec;
    },

    async renderPerguntas(fileOrIndex = 0) {
      if (g.JornadaCtrl && typeof g.JornadaCtrl.renderPerguntas === "function") {
        return g.JornadaCtrl.renderPerguntas(fileOrIndex);
      }
      // Fallback mínimo
      const sec = document.createElement("section");
      sec.className = "card pergaminho";
      sec.innerHTML = `
        <h2 class="title">Perguntas</h2>
        <p class="muted">Renderer Master (fallback). Impossível carregar perguntas sem JornadaCtrl.</p>
      `;
      document.getElementById("jornada-conteudo")?.appendChild(sec);
      return sec;
    },

   async renderFinal() {
  if (g.JornadaCtrl && typeof g.JornadaCtrl.renderFinal === "function") {
    return g.JornadaCtrl.renderFinal();
  }

  // fallback mínimo com botão
  const sec = document.createElement("section");
  sec.className = "card pergaminho";
  sec.innerHTML = `
    <h2 class="title">Finalização</h2>
    <p class="muted">Renderer Master (fallback). Obrigado por participar.</p>
    <button id="btnFinalizar" class="btn btn-primary">Concluir Jornada</button>
  `;
  document.getElementById("jornada-conteudo").appendChild(sec);

  // listener do botão
  const btn = sec.querySelector("#btnFinalizar");
  if (btn) {
    btn.addEventListener("click", () => {
      const respostas = (window.JORNADA_STATE && window.JORNADA_STATE.respostas) || {};
      console.log('[FINALIZAR] clique btn, respostas=', respostas);
      JORNADA_FINALIZAR(respostas);
    });
  } 
  return sec;
   },

    start() {
      // Se existir um controlador oficial, deixa ele conduzir o fluxo
      if (g.JornadaCtrl && typeof g.JornadaCtrl.start === "function") {
        g.JornadaCtrl.start();
        return;
      }
      // Fallback: abre a intro
      if (typeof g.renderIntro === "function") {
        g.renderIntro();
        return;
      }
      alert("Nenhum renderer disponível.");
    },
  };

  // Subtítulo: Export do módulo master
  g.JRENDER = g.JRENDER || {};
  g.JRENDER.master = MasterAPI;

  /* ===========================================================================
     === RENDER PLUS ===========================================================
     SUBTÍTULO: Variante Plus (herda do Master e aplica classe de layout)
  =========================================================================== */
  (function (root) {
    const base = (root.JRENDER && root.JRENDER.master) || MasterAPI;

    const PlusAPI = {
      ...base,
      async renderIntro() {
        const sec = await base.renderIntro();
        sec?.classList?.add("layout-plus");
        return sec;
      },
     async renderPerguntas(file = "jornadas_barraonctador.html") {
  const sec = await base.renderPerguntas(file);
  sec.classList.add("layout-junior");

  // --- APLICA DATILOGRAFIA NAS PERGUNTAS ---
  const T = window.JORNADA_TYPE;
  const h = sec.querySelector('.pergunta__titulo');
  const p = sec.querySelector('.pergunta__apoio');

  if (T && h) T.typeIt(h, h.textContent, 24);
  if (T && p) T.typeIt(p, p.textContent, 18);
  // =================== PROGRESSO (BLOCOS + PERGUNTAS) ===================
try {
  const UI = window.JORNADA_UI || {};
  const J  = window.JORNADA_STATE || {};

  // 1) Badge do topo (por bloco) — usa J.blocoAtual/J.totalBlocos se existir
  if (UI.setProgressoBlocos && typeof J.blocoAtual === 'number' && typeof J.totalBlocos === 'number') {
    UI.setProgressoBlocos(J.blocoAtual, J.totalBlocos);
  }

  // 2) Barra interna (perguntas dentro do bloco)
  if (UI.setProgressoPerguntas) {
    // tenta pegar do estado; se não houver, estima pela DOM desse 'sec'
    const totalPerguntas =
      Math.max(
        1,
        J.perguntasNoBloco ||
        sec.querySelectorAll('[data-role="pergunta"], .pergunta').length ||
        5
      );

    const idxPergunta =
      Math.max(
        0,
        Math.min(
          totalPerguntas,
          (J.idxPerguntaNoBloco ?? 0)
        )
      );

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

  /* ===========================================================================
     === RENDER JUNIOR =========================================================
     SUBTÍTULO: Variante Junior (leve — remove vídeos pesados)
  =========================================================================== */
  (function (root) {
    const base = (root.JRENDER && root.JRENDER.master) || MasterAPI;

    const JuniorAPI = {
      ...base,
      async renderIntro() {
        const sec = await base.renderIntro();
        sec?.classList?.add("layout-junior");
        // Simplificação: remove vídeos pesados na intro
        sec?.querySelectorAll?.("video").forEach(v => v.remove());
        return sec;
      },
      async renderPerguntas(file = "jornadas_barracontador.html") {
        const sec = await base.renderPerguntas(file);
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

  /* ===========================================================================
     === SELETOR DE VARIANTE ===================================================
     SUBTÍTULO: Escolha via body[data-layout] e exposição da API pública
  =========================================================================== */
  function selectVariant() {
    const key = (document.body?.dataset?.layout || "master").toLowerCase();
    const map = {
      master: g.JRENDER.master,
      plus:   g.JRENDER.plus   || g.JRENDER.master,
      junior: g.JRENDER.junior || g.JRENDER.master,
    };
    const api = map[key] || g.JRENDER.master;

    // API pública esperada pelo restante do código
    g.JORNADA_RENDER   = api;
    g.onJornadaEssencial = typeof api.start === "function" ? api.start : () => g.JornadaCtrl?.start?.();
    g.renderIntro      = (...a) => api.renderIntro?.(...a);
    g.renderPerguntas  = (...a) => api.renderPerguntas?.(...a);
    g.renderFinal      = (...a) => api.renderFinal?.(...a);

    console.log(`[Renderer] ativo: ${key}`);
  }

  // Seleciona assim que possível
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", selectVariant);
  } else {
    selectVariant();
  }
})();
