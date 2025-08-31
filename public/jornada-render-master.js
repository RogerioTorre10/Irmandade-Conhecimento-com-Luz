/* jornada-render-master.js */
// Render principal (mãe), base para os outros
(function (root) {
  const JU = {
    qs: (s, r = document) => r.querySelector(s),
    qsa: (s, r = document) => Array.from(r.querySelectorAll(s)),
  };

  async function loadHtmlIntoApp(file, sectionId, extraClass = "") {
    const app = JU.qs("#app") || JU.qs("main") || document.body;
    const res = await fetch(`/html/${file}`, { cache: "no-store" });
    const html = await res.text();
    JU.qsa("section.card", app).forEach((s) => s.classList.add("hidden"));
    const sec = document.createElement("section");
    sec.id = sectionId;
    sec.className = `card ${extraClass}`.trim();
    sec.innerHTML = html;
    app.appendChild(sec);
    return sec;
  }

  function showSection(id) {
    JU.qsa("section.card").forEach((sec) => {
      if (sec.id === id) sec.classList.remove("hidden");
      else sec.classList.add("hidden");
    });
  }

  const MasterAPI = {
    async renderIntro() {
      return loadHtmlIntoApp("jornada-intro.html", "intro", "pergaminho pergaminho-v");
    },
    async renderPerguntas(file = "jornadas.html") {
      return loadHtmlIntoApp(file, "perguntas", "pergaminho pergaminho-h");
    },
    async renderFinal() {
      return loadHtmlIntoApp("jornada-final.html", "final", "pergaminho pergaminho-v");
    },
    showSection,
  };

  root.JRENDER = root.JRENDER || {};
  root.JRENDER.master = MasterAPI;
})(window);

// Alias para o bootstrap encontrar
window.onJornadaEssencial = function () {
  if (typeof renderIntro === "function") {
    renderIntro();
  } else if (typeof renderPerguntas === "function") {
    renderPerguntas();
  } else {
    console.error("Nenhum renderer disponível.");
  }
};

