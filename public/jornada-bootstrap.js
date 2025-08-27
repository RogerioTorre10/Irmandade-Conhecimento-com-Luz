/* ============================================
   /public/jornada-bootstrap.js
   Inicialização simples (sem módulos)
   Requer que JORNADA_RENDER já exista
   ============================================ */
document.addEventListener("DOMContentLoaded", () => {
  // garante que o render carregou
  if (!window.JORNADA_RENDER) {
    console.error("JORNADA_RENDER não está carregado. Verifique a ordem dos <script>.");
    return;
  }

  // ponto de entrada — pode trocar para { startAt: "intro" } se preferir
  window.JORNADA_RENDER.mount({ startAt: "home" });
});
