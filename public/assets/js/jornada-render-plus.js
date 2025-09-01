/* jornada-render-plus.js */
// Render alternativo (Plus), herda do Master
(function (root) {
  const base = (root.JRENDER && root.JRENDER.master) || {};

  const PlusAPI = {
    ...base,
    async renderIntro() {
      const sec = await base.renderIntro();
      sec.classList.add("layout-plus");
      return sec;
    },
    async renderPerguntas(file = "jornadas_olhomagico.html") {
      const sec = await base.renderPerguntas(file);
      sec.classList.add("layout-plus");
      return sec;
    },
    async renderFinal() {
      const sec = await base.renderFinal();
      sec.classList.add("layout-plus");
      return sec;
    },
  };

  root.JRENDER = root.JRENDER || {};
  root.JRENDER.plus = PlusAPI;
})(window);
