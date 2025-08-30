/* jornada-bootstrap.js — robusto com logs */
(function () {
  function ready(fn){
    document.readyState === "loading"
      ? document.addEventListener("DOMContentLoaded", fn)
      : fn();
  }

  ready(() => {
    const params = new URLSearchParams(location.search);
    const layout  = params.get("layout")  || document.body.dataset.layout  || "master";
    const journey = params.get("journey") || document.body.dataset.journey || "essencial";
    const autostart = params.get("autostart") === "1";

    // Renders
    const JRmap = window.JRENDER || {};
    window.JR = JRmap[layout] || JRmap.master;
    console.log("[BOOT] layout=", layout, "JR?", !!window.JR);

    // Jornada via hub (opcional)
    const HUB = window.JHUB;
    const Journey = HUB?.get ? HUB.get(journey) : null;
    console.log("[BOOT] journey=", journey, "Journey?", !!Journey);

    // Listener do botão
    const btn = document.getElementById("btnComecar");
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        console.log("[BOOT] btnComecar -> iniciar");
        (Journey?.renderIntro || JR?.renderIntro || (()=>console.warn("Sem renderIntro")))();
      });
    } else {
      console.warn("[BOOT] btnComecar não encontrado");
    }

    // Deep-link/hash
    const goHash = () => {
      if (!JR && !Journey) return;
      switch (location.hash) {
        case "#intro":
          (Journey?.renderIntro || JR?.renderIntro)?.(); break;
        case "#perguntas":
          (Journey?.renderPerguntas || JR?.renderPerguntas)?.(); break;
        case "#final":
          (Journey?.renderFinal || JR?.renderFinal)?.(); break;
        default:
          if (autostart) (Journey?.renderIntro || JR?.renderIntro)?.();
      }
    };
    window.addEventListener("hashchange", goHash);
    goHash();

    console.log("[BOOT] pronto");
  });
})();
