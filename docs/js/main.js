document.addEventListener('DOMContentLoaded', () => {
  const { qs, showSection, setProgress, setPergunta } = window.UI || {};
  if(!qs || !window.JQUESTIONS || !window.JSTATE){
    alert('Falha ao carregar scripts da jornada. Verifique docs/js/*');
    return;
  }

  const QUESTIONS = window.JQUESTIONS;
  const ST = window.JSTATE;

  // DOM
  const chkTermo   = qs('#chkTermo');
  const btnIniciar = qs('#btnIniciar');

  const btnLimparAtual = qs('#btnLimparAtual');
  const btnVoltar  = qs('#btnVoltar');
  const btnProxima = qs('#btnProxima');
  const input      = qs('#respostaInput');

  const btnRevisar = qs('#btnRevisar');
  const btnGerar   = qs('#btnGerarPDFHQ');
  const btnNova    = qs('#btnNovaJornada');

  let idx = Number(ST.get('idx', 0));
  let respostas = ST.get('respostas', {});

  // Helpers
  function updateNavState(){
    // trava o Voltar na primeira pergunta
    if (btnVoltar) {
      btnVoltar.disabled = (idx <= 0);
    }
    // trava Próxima se vazio
    if (btnProxima) {
      const empty = !(input.value || '').trim();
      btnProxima.disabled = empty;
    }
  }

  // INTRO
  if (chkTermo && btnIniciar) {
    const toggleStart = () => { btnIniciar.disabled = !chkTermo.checked; };
    toggleStart();
    chkTermo.addEventListener('change', toggleStart);

    btnIniciar.addEventListener('click', () => {
      if (btnIniciar.disabled) return;
      idx = 0; ST.set('idx', idx);
      showWizard();
    });
  }

  // WIZARD
  if (btnLimparAtual) btnLimparAtual.addEventListener('click', ()=>{ input.value=''; input.focus(); updateNavState(); });

  if (btnVoltar) btnVoltar.addEventListener('click', ()=>{
    if(idx>0){ idx--; ST.set('idx', idx); showWizard(); }
    // se idx==0, fica parado (travado)
  });

  if (btnProxima) btnProxima.addEventListener('click', ()=>{
    const val = (input.value||'').trim();
    if (!val) { input.focus(); return; } // não avança vazio
    salvarAtual();
    if(idx < QUESTIONS.length-1){ idx++; ST.set('idx', idx); showWizard(); }
    else{ showFinal(); }
  });

  input && input.addEventListener('input', updateNavState);

  function salvarAtual(){
    const q = QUESTIONS[idx]; if(!q) return;
    respostas[q.id] = (input.value||'').trim();
    ST.set('respostas', respostas);
  }

  function showWizard(){
    const q = QUESTIONS[idx]; if(!q) return;
    setPergunta(q); setProgress(idx, QUESTIONS.length);
    input.value = (respostas[q.id]||'');
    showSection(document.getElementById('sec-wizard'));
    setTimeout(()=>{ input.focus(); updateNavState(); }, 50);
  }

  function showFinal(){
    showSection(document.getElementById('sec-final'));
  }

  if (btnRevisar) btnRevisar.addEventListener('click', ()=>{ idx = 0; ST.set('idx', idx); showWizard(); });

  if (btnGerar) btnGerar.addEventListener('click', async ()=>{
    const val = (input.value||'').trim();
    if (document.getElementById('sec-wizard') && !document.getElementById('sec-wizard').classList.contains('hidden')) {
      if (!val) { input.focus(); return; }
      salvarAtual();
    }
    const payload = { respostas, meta: { quando: new Date().toISOString() } };
    try{
      btnGerar.disabled = true; btnGerar.textContent = 'Gerando…';
      await window.API.gerarPDFEHQ(payload);
      location.href = './';
    }catch(err){
      alert('Não foi possível gerar os arquivos. Tente novamente.');
    }finally{
      btnGerar.disabled = false; btnGerar.textContent = 'Baixar PDF + HQ';
      ST.clearAll();
    }
  });

  if (btnNova) btnNova.addEventListener('click', ()=>{ ST.clearAll(); location.href = './'; });

  // Boot
  (function init(){
    const st = ST.load();
    if(st && st.respostas && Object.keys(st.respostas).length>0 && Number.isInteger(st.idx)){
      idx = Math.max(0, Math.min(QUESTIONS.length-1, st.idx));
      respostas = st.respostas; showWizard();
    } else {
      showSection(document.getElementById('sec-intro'));
    }
  })();
});
