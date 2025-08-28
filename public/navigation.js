/* ============================================
   navigation.js — Rotas e navegação da Jornada
   Expondo: window.JORNADA_NAV
   Depende de: QUESTIONS, renderIntro, renderPerguntas,
               renderAcolhimento, renderFinal,
               activateJornada, deactivateJornada
   ============================================ */
;(function () {
  const R = {
    intro:      "intro",
    perguntas:  "perguntas",  // ex.: #perguntas:0 (bloco 0..n-1)
    acolhe:     "acolhimento",
    final:      "final",
    home:       "home",
  };

  // ----- render conforme hash -----
  function renderFromHash() {
    const raw = (location.hash || "").replace(/^#/, "");
    if (!raw) return goIntro(false);

    const [route, param] = raw.split(":");
    switch (route) {
      case R.intro:      activateJornada?.(); return renderIntro();
      case R.perguntas:  activateJornada?.(); return renderPerguntas(Number(param||0) || 0);
      case R.acolhe:     activateJornada?.(); return renderAcolhimento();
      case R.final:      activateJornada?.(); return renderFinal();
      case R.home:       deactivateJornada?.(); return goHome(true);
      default:           return goIntro(false);
    }
  }

  // ----- APIs públicas -----
  function goIntro(push = true){ if (push) location.hash = "#" + R.intro; else { location.replace("#"+R.intro); renderIntro(); } }
  function goPerguntas(blockIndex = 0){ location.hash = `#${R.perguntas}:${blockIndex}`; }
  function goAcolhimento(){ location.hash = "#" + R.acolhe; }
  function goFinal(){ location.hash = "#" + R.final; }
  function goHome(replaceOnly = false){
    // página de lista de jornadas (ajuste se o seu path for outro)
    const url = "/jornadas.html";
    if (replaceOnly) location.replace(url); else window.location.href = url;
  }

  function nextBlock(currIndex){
    const last = QUESTIONS.totalBlocks() - 1;
    if (currIndex < last) return goPerguntas(currIndex+1);
    return goAcolhimento();
  }
  function prevBlock(currIndex){
    if (currIndex > 0) return goPerguntas(currIndex-1);
    return goIntro();
  }

  // ----- Delegação de cliques por data-atributos -----
  function onClick(e){
    const a = e.target.closest("[data-nav]");
    if (!a) return;
    const nav = a.getAttribute("data-nav");
    if (!nav) return;
    e.preventDefault();

    switch (nav){
      case "home":            return goHome();
      case "intro":           return goIntro();
      case "final":           return goFinal();
      case "acolhimento":     return goAcolhimento();
      case "perguntas-next":  return nextBlock(Number(a.dataset.idx||0));
      case "perguntas-prev":  return prevBlock(Number(a.dataset.idx||0));
      case "perguntas":
        return goPerguntas(Number(a.dataset.idx||0));
    }
  }

  function init(){
    window.addEventListener("hashchange", renderFromHash);
    document.addEventListener("click", onClick);
    renderFromHash(); // primeira carga
  }

  window.JORNADA_NAV = {
    init, goHome, goIntro, goPerguntas, goAcolhimento, goFinal,
    nextBlock, prevBlock, routes: R
  };
})();
