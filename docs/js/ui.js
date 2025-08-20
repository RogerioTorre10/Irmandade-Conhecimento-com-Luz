(function(){
  const qs = (s)=>document.querySelector(s);

  const secIntro  = qs('#sec-intro');
  const secWizard = qs('#sec-wizard');
  const secFinal  = qs('#sec-final');

  function showSection(el){
    [secIntro, secWizard, secFinal].forEach(x => x.classList.add('hidden'));
    el.classList.remove('hidden');
    window.scrollTo({ top:0, behavior:'smooth' });
  }

  function setProgress(idx, total){
    const bar = qs('#progressBar');
    const pct = Math.max(0, Math.min(100, Math.round(((idx+1)/total)*100)));
    bar.style.width = pct + '%';
    qs('#etapaNum').textContent = idx+1;
    qs('#etapaTot').textContent = total;
  }

  function setPergunta(p){
    qs('#perguntaTitulo').textContent = p.titulo;
  }

  window.UI = { qs, showSection, setProgress, setPergunta };
})();

