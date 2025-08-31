// /public/jornada-alias.js — cria onJornadaEssencial a partir do que existir
(function () {
  const g = window;

  // já existe? não mexe
  if (typeof g.onJornadaEssencial === "function") return;

  // nomes comuns em renderers por namespace
  if (g.JornadaMaster && typeof g.JornadaMaster.start === "function") {
    g.onJornadaEssencial = () => g.JornadaMaster.start();
    return;
  }
  if (g.Jornada && typeof g.Jornada.start === "function") {
    g.onJornadaEssencial = () => g.Jornada.start();
    return;
  }

  // fallbacks diretos
  if (typeof g.renderIntro === "function") {
    g.onJornadaEssencial = g.renderIntro;
    return;
  }
  if (typeof g.renderPerguntas === "function") {
    g.onJornadaEssencial = g.renderPerguntas;
    return;
  }

  console.warn("[ALIAS] Nenhum handler encontrado (intro/perguntas/Jornada*.start).");
})();
