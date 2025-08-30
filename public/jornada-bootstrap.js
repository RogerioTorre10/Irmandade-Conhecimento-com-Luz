/* jornada-bootstrap.js */
// Bootstrap da Jornada — escolhe render ativo e inicializa

(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(() => {
    // Detecta layout via query string ou atributo do body
    const params = new URLSearchParams(location.search);
    const layout = params.get("layout") || document.body.dataset.layout || "master";

    // Mapeia os renders disponíveis
    const JRmap = (window.JRENDER = window.JRENDER || {});
    window.JR =
      JRmap[layout] || JRmap.master || {
        renderIntro: () => console.warn("Render não disponível"),
        renderPerguntas: () => console.warn("Render não disponível"),
        renderFinal: () => console.warn("Render não disponível"),
      };

    console.log(`[BOOTSTRAP] Layout ativo: ${layout}`);

    // Integra com o hub de jornadas (se existir)
    const HUB = window.JHUB || null;
    const journeyName =
      params.get("journey") || document.body.dataset.journey || "essencial";
    const Journey = HUB?.get(journeyName);

    console.log(`[BOOTSTRAP] Jornada ativa: ${journeyName}`);

    // Liga o botão inicial
    const btn = document.getElementById("btnComecar");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        if (Journey?.renderIntro) Journey.renderIntro();
        else window.JR.renderIntro();
      });
    }

    // Deep link (permite abrir direto em #intro, #perguntas ou #final)
    switch (location.hash) {
      case "#intro":
        Journey?.renderIntro ? Journey.renderIntro() : JR.renderIntro();
        break;
      case "#perguntas":
        Journey?.renderPerguntas
          ? Journey.renderPerguntas()
          : JR.renderPerguntas();
        break;
      case "#final":
        Journey?.renderFinal ? Journey.renderFinal() : JR.renderFinal();
        break;
      default:
        // Nada → fica aguardando botão
        break;
    }

    console.log("[BOOTSTRAP] Jornada inicializada!");
  });
})();
