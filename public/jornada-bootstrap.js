document.addEventListener("DOMContentLoaded", () => {
  JORNADA_RENDER.setHooks({
    onStart: () => JORNADA_CORE?.iniciarFluxo?.(),
    onFinalize: () => JORNADA_CORE?.salvarRespostas?.(),
    onDownload: () => JORNADA_CORE?.baixarArquivos?.(), // sua chamada de API
  });
  JORNADA_RENDER.mount({ startAt: "home" }); // ou "intro"
});
