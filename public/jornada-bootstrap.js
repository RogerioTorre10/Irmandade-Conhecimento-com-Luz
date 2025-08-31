// /assets/js/jornada-bootstrap.js  — robusto (v1.1)
(function () {
  const CFG = (window.JORNADA_CFG || window.APP_CONFIG || {});
  const ESSENCIAL = (typeof CFG.ESSENCIAL === "boolean") ? CFG.ESSENCIAL : true; // default: true
  const LAYOUT = "master";

  console.log("[BOOT] layout =", LAYOUT);
  console.log("JR? true");
  console.log("[BOOT] journey=", ESSENCIAL ? "true" : "false");

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function pegarBotaoIniciar() {
    // tenta por id/data-attr; cai no primeiro botão como fallback
    return (
      document.querySelector("#btnComecar") ||
      document.querySelector('[data-action="iniciar"]') ||
      document.querySelector("#iniciar") ||
      document.querySelector("button")
    );
  }

  function iniciar() {
    console.log("iniciar");
    try {
      // Preferência 1: função orquestradora da jornada
      if (typeof window.onJornadaEssencial === "function") {
        window.onJornadaEssencial();
        return;
      }
      // Preferência 2: intro direta
      if (typeof window.renderIntro === "function") {
        window.renderIntro();
        return;
      }
      // Preferência 3: perguntas direto
      if (typeof window.renderPerguntas === "function") {
        window.renderPerguntas();
        return;
      }
      alert("Handler da Jornada não encontrado. Verifique se o renderer ativo foi carregado.");
    } catch (e) {
      console.error("[BOOT] erro ao iniciar:", e);
      alert("Erro ao iniciar a Jornada. Veja o console.");
    }
  }

  ready(() => {
    console.log("[BOOT] pronto");
    const btn = pegarBotaoIniciar();
    if (btn) {
      console.log("[BOOT] btnComecar -> iniciar");
      btn.addEventListener("click", iniciar, { once: true });
    } else {
      console.warn("[BOOT] botão 'Iniciar Jornada' não encontrado – iniciando automaticamente.");
      if (ESSENCIAL) iniciar();
    }
  });
})();
