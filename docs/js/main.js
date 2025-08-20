(function(){
  const { qs, showSection, setProgress, setPergunta } = window.UI;
  const QUESTIONS = window.JQUESTIONS;
  const ST = window.JSTATE;

  // DOM
  const chkTermo   = qs('#chkTermo');
  const btnIniciar = qs('#btnIniciar');
  const btnLimparTudoIntro = qs('#btnLimparTudoIntro');

  const btnLimparAtual = qs('#btnLimparAtual');
  const btnVoltar  = qs('#btnVoltar');
  const btnProxima = qs('#btnProxima');
  const input      = qs('#respostaInput');

  const btnRevisar = qs('#btnRevisar');
  const btnGerar   = qs('#btnGerarPDFHQ');
  const btnNova    = qs('#btnNovaJornada');

  let idx = Number(ST.get('idx', 0));
  let respostas = ST.get('respostas', {});

  // Intro
  chkTermo.addEventListener('change', ()=>{ btnIniciar.disabled = !chkTermo.checked; });
  btnIniciar.addEventListener('click', ()=>{ idx = 0; ST.set('idx', idx); showWizard(); });
  btnLimparTudoIntro.addEventListener('click', ()=>{ ST.clearAll(); respostas={}; idx=0; alert('Respostas limpas.'); });

  // Wizard
  btnLimparAtual.addEventListener('click', ()=>{ input.value=''; input.focus(); });
  btnVoltar.addEventListener('click', ()=>{
    if(idx>0){ idx--; ST.set('idx', idx); showWizard(); }
    else{ showSection(document.getElementById('sec-intro')); }
  });
  btnProxima.addEventListener('click', ()=>{
    salvarAtual();
    if(idx < QUESTIONS.length-1){ idx++; ST.set('idx', idx); showWizard(); }
    else{ showFinal(); }
  });

  function salvarAtual(){
    const q = QUESTIONS[idx];
    respostas[q.id] = (input.value||'').trim();
    ST.set('respostas', respostas);
  }

  function showWizard(){
    const q = QUESTIONS[idx];
    setPergunta(q); setProgress(idx, QUESTIONS.length);
    input.value = (respostas[q.id]||'');
    showSection(document.getElementById('sec-wizard'));
    setTimeout(()=>input.focus(), 50);
  }

  // Final
  function showFinal(){ showSection(document.getElementById('sec-final')); }

  btnRevisar.addEventListener('click', ()=>{ idx = 0; ST.set('idx', idx); showWizard(); });

  btnGerar.addEventListener('click', async ()=>{
    salvarAtual();
    const payload = { respostas, meta: { quando: new Date().toISOString() } };
    try{
      btnGerar.disabled = true; btnGerar.textContent = 'Gerando…';
      await window.API.gerarPDFEHQ(payload);
      // Após download concluído, voltar para a página inicial
      location.href = './';
    }catch(err){
      alert('Não foi possível gerar os arquivos. Tente novamente.');
    }finally{
      btnGerar.disabled = false; btnGerar.textContent = 'Baixar PDF + HQ';
      ST.clearAll(); // Segurança: apaga tudo após a entrega
    }
  });

  btnNova.addEventListener('click', ()=>{ ST.clearAll(); location.href = './'; });

  // Boot — decide seção inicial (evita “páginas misturadas”)
  (function init(){
    const st = ST.load();
    if(st && st.respostas && Object.keys(st.respostas).length>0 && Number.isInteger(st.idx)){
      idx = Math.max(0, Math.min(QUESTIONS.length-1, st.idx));
      respostas = st.respostas; showWizard();
    } else {
      showSection(document.getElementById('sec-intro'));
    }
  })();
})();

