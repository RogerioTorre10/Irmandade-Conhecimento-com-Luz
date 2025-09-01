/* jornada-render-junior.js */
// Render simplificado (Junior), herda do Master
(function (root) {
  const base = (root.JRENDER && root.JRENDER.master) || {};

  const JuniorAPI = {
    ...base,
    async renderIntro() {
      const sec = await base.renderIntro();
      sec.classList.add("layout-junior");
      // Pode remover elementos pesados se quiser:
      const videos = sec.querySelectorAll("video");
      videos.forEach(v => v.remove());
      return sec;
    },
    async renderPerguntas(file = "jornadas_barracontador.html") {
      const sec = await base.renderPerguntas(file);
      sec.classList.add("layout-junior");
      return sec;
    },
    async renderFinal() {
      const sec = await base.renderFinal();
      sec.classList.add("layout-junior");
      return sec;
    },
  };

  root.JRENDER = root.JRENDER || {};
  root.JRENDER.junior = JuniorAPI;
})(window);
