document.addEventListener('DOMContentLoaded', () => {
  const { qs, showSection, setProgress, setPergunta } = window.UI || {};
  if(!qs || !window.JQUESTIONS || !window.JSTATE){
    alert('Falha ao carregar scripts da jornada. Verifique docs/js/*');
    return;
  }

  // ======== AUTH ========
  // Sempre exigir senha por sessão: usa sessionStorage (não persiste após fechar a aba)
  const AUTH_KEY  = 'jornada_auth_session';
  const AUTH_PASS = (window.JORNADA_CFG?.PASSWORD || 'iniciar').toLowerCase();

  // Remove flags antigas que faziam pular a senha entre visitas
  try { localStorage.removeItem('jornada_auth'); } catch(_) {}

  const secAuth    = document.getElementById('sec-auth');
  const secIntro   = document.getElementById('sec-intro');
  const inputSenha = qs('#senhaInput');
  const btnEntrar  = qs('#btnEntrar');
  const authError  = qs('#authError');

  function isAuthed(){ return sessionStorage.getItem(AUTH_KEY) === 'ok'; }
  function setAuthed(){ sessionStorage.setItem(AUTH_KEY, 'ok'); }
  function clearAuth(){ sessionStorage.removeItem(AUTH_KEY); }

  function hideAuth(){
    if (!secAuth) return;
    secAuth.classList.add('hidden');
    secAuth.setAttribute('aria-hidden','true');
    secAuth.style.display = 'none';
  }

  function showOnly(sectionEl){
    // Esconde todas as sections e limpa display inline
    document.querySelectorAll('main > section').forEach(s=>{
      s.classList.add('hidden');
      s.setAttribute('aria-hidden','true');
      s.style.display = 'none';
    });
    // Mostra só a desejada
    sectionEl.classList.remove('hidden');
    sectionEl.removeAttribute('aria-hidden');
    sectionEl.style.display = '';
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  function bindAuth(){
    if(!btnEntrar || !inputSenha) return;
    btnEntrar.addEventListener('click', () => {
      const val = (inputSenha.value || '').trim().toLowerCase();
      if(val === AUTH_PASS){
        setAuthed();
        authError && authError.classList.add('hidden');
        hideAuth();
        showOnly(secIntro);
      }else{
        authError && authError.classList.remove('hidden');
        inputSenha.focus();
      }
    });
    inputSenha.addEventListener('keypress', (e) => {
      if(e.key === 'Enter') btnEntrar.click();
    });
    // Olho mágico (mostrar/ocultar senha)
const btnToggleSenha = document.getElementById('btnToggleSenha');
if (btnToggleSenha && inputSenha) {
  let visible = false;
  const eye = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>`;
  const eyeOff = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M3 3l18 18M10.6 10.6a3 3 0 1 0 4.24 4.24M9.88 4.26A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a17.8 17.8 0 0 1-3.22 4.03M6.11 6.11A17.63 17.63 0 0 0 1 12s4 8 11 8a10.9 10.9 0 0 0 5.89-1.61"/>
    </svg>`;

  function renderEye(){
    btnToggleSenha.innerHTML = visible ? eyeOff : eye;
    btnToggleSenha.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
    btnToggleSenha.setAttribute('title',      visible ? 'Ocultar senha' : 'Mostrar senha');
    inputSenha.type = visible ? 'text' : 'password';
  }
  renderEye();

  btnToggleSenha.addEventListener('click', ()=>{
    visible = !visible; renderEye(); inputSenha.focus();
  });
  // evita roubar foco ao segurar o mouse
  btnToggleSenha.addEventListener('mousedown', e => e.preventDefault());
}

  }
  bindAuth();

  // ======== ESTADO / PERGUNTAS ========
  const QUESTIONS = window.JQUESTIONS;
  const ST = window.JSTATE;

  // DOM — Intro
  const chkTermo   = qs('#chkTermo');
  const btnIniciar = qs('#btnIniciar');

  // DOM — Wizard
  const btnLimparAtual = qs('#btnLimparAtual');
  const btnVoltar  = qs('#btnVoltar');
  const btnProxima = qs('#btnProxima');
  const input      = qs('#respostaInput');

  // DOM — Final
  const btnRevisar = qs('#btnRevisar');
  const btnGerar   = qs('#btnGerarPDFHQ');
 
  let idx = Number(ST.get('idx', 0));
  let respostas = ST.get('respostas', {});

  function updateNavState(){
    if (btnVoltar)  btnVoltar.disabled  = (idx <= 0);
    if (btnProxima) btnProxima.disabled = !((input.value || '').trim());
  }

  // INTRO
  if (chkTermo && btnIniciar) {
    const toggleStart = () => { btnIniciar.disabled = !chkTermo.checked; };
    toggleStart();
    chkTermo.addEventListener('change', toggleStart);

    btnIniciar.addEventListener('click', () => {
      if (btnIniciar.disabled) return;
      idx = 0; ST.set('idx', idx);
      hideAuth();
      showWizard();
    });
  }

  // WIZARD
  if (btnLimparAtual) btnLimparAtual.addEventListener('click', ()=>{ input.value=''; input.focus(); updateNavState(); });

  if (btnVoltar) btnVoltar.addEventListener('click', ()=>{
    if(idx>0){ idx--; ST.set('idx', idx); hideAuth(); showWizard(); }
  });

  if (btnProxima) btnProxima.addEventListener('click', ()=>{
    const val = (input.value||'').trim();
    if (!val) { input.focus(); return; }
    salvarAtual();
    if(idx < QUESTIONS.length-1){ idx++; ST.set('idx', idx); hideAuth(); showWizard(); }
    else{ hideAuth(); showFinal(); }
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
    hideAuth();
    showOnly(document.getElementById('sec-wizard'));
    setTimeout(()=>{ input.focus(); updateNavState(); }, 50);
  }

  function showFinal(){
    hideAuth();
    showOnly(document.getElementById('sec-final'));
  }

  if (btnRevisar) btnRevisar.addEventListener('click', ()=>{ idx = 0; ST.set('idx', idx); hideAuth(); showWizard(); });

  if (btnGerar) btnGerar.addEventListener('click', async ()=>{
    const val = (input.value||'').trim();
    const wiz = document.getElementById('sec-wizard');
    if (wiz && !wiz.classList.contains('hidden')) {
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
      clearAuth(); // encerra a sessão de teste ao concluir
    }
  });

  if (btnNova) btnNova.addEventListener('click', ()=>{
    ST.clearAll();
    clearAuth();                       // voltar à home exige senha de novo
    hideAuth();
    showOnly(secIntro);                // se ficar na mesma página
  });

  // ======== Boot ========
  (function init(){
    // Se quiser forçar logout via URL, acesse ?logout=1
    if (new URLSearchParams(location.search).get('logout') === '1') clearAuth();

    if(!isAuthed()){
      showOnly(secAuth);
      return;
    }
    hideAuth();
    const st = ST.load();
    if(st && st.respostas && Object.keys(st.respostas).length>0 && Number.isInteger(st.idx)){
      idx = Math.max(0, Math.min(QUESTIONS.length-1, st.idx));
      respostas = st.respostas;
      showWizard();
    } else {
      showOnly(secIntro);
    }
  })();
});
