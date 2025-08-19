/* ============================================
   Jornada Conhecimento com Luz — v9.2-pages
   - Intro com senha ("iniciar")
   - Perguntas passo-a-passo (com barra de passos)
   - Revisão
   - Download sequencial: PDF -> HQ
   - Limpeza + retorno à home
   ============================================ */

const CONFIG = {
  API_BASE: 'https://conhecimento-com-luz-api.onrender.com', // backend Render
  PASSWORD: 'iniciar',
  STORAGE_KEY: 'jornada_v92_respostas',
  VERSION: '9.2-pages'
};

// Estado
const state = {
  step: 'intro',            // intro | form | review | done
  answers: {},
  idx: 0                    // índice da pergunta atual
};

// Helpers
const $ = (s) => document.querySelector(s);
const app = $('#app');

// Persistência
function saveLocal(){ try{ localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.answers)); }catch{} }
function loadLocal(){ try{ const r = localStorage.getItem(CONFIG.STORAGE_KEY); if(r) state.answers = JSON.parse(r)||{}; }catch{} }
function clearLocal(){ localStorage.removeItem(CONFIG.STORAGE_KEY); state.answers = {}; }

// Perguntas
const QUESTIONS = [
  { id:'q1',  label:'Quem é você hoje? (uma frase que te represente)', type:'text' },
  { id:'q2',  label:'Qual foi a maior superação da sua vida?',         type:'textarea' },
  { id:'q3',  label:'O que você quer transformar nos próximos 90 dias?', type:'text' }
];

// Campo dinâmico
function inputField(q){
  const v = state.answers[q.id] || '';
  if(q.type === 'textarea'){
    return `<textarea class="input" rows="4" data-id="${q.id}">${v}</textarea>`;
  }
  return `<input class="input" type="text" data-id="${q.id}" value="${v}">`;
}

// Barra de passos
function stepbar(){
  let dots = '';
  for(let i=0;i<QUESTIONS.length;i++){
    dots += `<span class="stepdot ${i===state.idx?'active':''}"></span>`;
  }
  return `<div class="stepbar">${dots}</div>`;
}

// Render
function render(){
  if(state.step==='intro')  return renderIntro();
  if(state.step==='form')   return renderFormStep();
  if(state.step==='review') return renderReview();
  if(state.step==='done')   return renderDone();
}

// Intro (senha)
function renderIntro(){
  app.innerHTML = `
    <section class="card space-y-4">
      <header class="text-center">
        <h2 class="text-xl font-semibold titulo-pergaminho">Acesso à Jornada</h2>
        <p class="texto-pergaminho">Digite a senha de acesso para iniciar.</p>
      </header>

      <div class="space-y-2">
        <label class="small texto-pergaminho">Senha</label>
        <input id="pwd" class="input" type="password" placeholder="iniciar">
        <p id="msg" class="small" style="color:#8b0000;"></p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button id="btnStart" class="btn">Iniciar</button>
        <a href="./" class="btn" style="background:#334155">Voltar</a>
      </div>
    </section>
  `;

  const start = ()=>{
    const val = ($('#pwd').value||'').trim().toLowerCase();
    if(val===CONFIG.PASSWORD){ state.step='form'; state.idx=0; render(); }
    else { $('#msg').textContent='Senha inválida. Tente novamente.'; }
  };
  $('#btnStart').addEventListener('click', start);
  $('#pwd').addEventListener('keydown', e=>{ if(e.key==='Enter') start(); });
}

// Form passo-a-passo
function renderFormStep(){
  loadLocal();
  const q = QUESTIONS[state.idx];
  const total = QUESTIONS.length;
  const titulo = `Pergunta ${state.idx+1}/${total}`;

  app.innerHTML = `
    <section class="card space-y-4">
      <header class="flex items-center justify-between">
        <h2 class="text-xl font-semibold titulo-pergaminho">${titulo}</h2>
        <span class="small">Versão ${CONFIG.VERSION}</span>
      </header>

      ${stepbar()}

      <div class="space-y-2">
        <label class="block font-medium texto-pergaminho">${q.label}</label>
        ${inputField(q)}
      </div>

      <div class="flex flex-wrap gap-3 pt-2">
  <button id="btnPrev" class="btn" style="background:#334155">Voltar</button>
  <button id="btnClear" class="btn" style="background:#334155">Limpar</button>
  <button id="btnNext" class="btn">${state.idx < total-1 ? 'Próxima' : 'Revisar'}</button>
  <button id="btnFinish" class="btn" style="background:#6b21a8">Finalizar</button>
</div>
    </section>
  `;

  // bind input
  const el = app.querySelector('[data-id]');
  el.addEventListener('input', (e)=>{
    state.answers[q.id] = e.target.value;
    saveLocal();
  });

  // prev/next
  const prev = $('#btnPrev'); const next = $('#btnNext');
  if(state.idx===0) prev.setAttribute('disabled','disabled');
  prev.addEventListener('click', ()=>{
    if(state.idx>0){ state.idx--; renderFormStep(); }
  });
  next.addEventListener('click', ()=>{
    if(state.idx < total-1){ state.idx++; renderFormStep(); }
    else { state.step='review'; render(); }
  });

  // limpar
  $('#btnClear').addEventListener('click', ()=>{
    if(confirm('Tem certeza que deseja apagar TODAS as respostas?')){
      clearLocal(); state.idx=0; renderFormStep();
    }
  });
   
   // finalizar
    $('#btnFinish').addEventListener('click', () => {
  state.step = 'review';
  render();
});

}

// Revisão
function renderReview(){
  const list = QUESTIONS.map(q => `
    <div class="space-y-1">
      <div class="small texto-pergaminho"><strong>${q.label}</strong></div>
      <div class="p-3 rounded" style="background:rgba(255,255,255,.85); border:1px solid #d8c2a1; color:#2b2620;">
        ${(state.answers[q.id] || '').replace(/\n/g,'<br>')}
      </div>
    </div>
  `).join('\n');

  app.innerHTML = `
    <section class="card space-y-6">
      <h2 class="text-xl font-semibold titulo-pergaminho">Revise suas respostas</h2>
      ${list}
      <div id="status" class="small" style="color:#3b2f2f;"></div>
      <div class="flex flex-wrap gap-3 pt-2">
        <button id="btnBack" class="btn" style="background:#334155">Voltar</button>
        <button id="btnSend" class="btn">Baixar PDF + HQ</button>
      </div>
    </section>
  `;

  $('#btnBack').addEventListener('click', ()=>{ state.step='form'; renderFormStep(); });
  $('#btnSend').addEventListener('click', sendAndDownload);
}

// Final
function renderDone(){
  app.innerHTML = `
    <section class="card space-y-3 text-center">
      <h2 class="text-2xl font-bold titulo-pergaminho">Parabéns! Você finalizou a jornada.</h2>
      <p class="texto-pergaminho">Você será redirecionado para a página inicial.</p>
    </section>
  `;
  setTimeout(()=> window.location.href = './', 2200);
}

// Download sequencial
async function sendAndDownload(){
  const el = $('#status');
  el.textContent = 'Gerando sua devolutiva (PDF e HQ)...';

  const payload = {
    answers: state.answers,
    meta: { version: CONFIG.VERSION, ts: new Date().toISOString() }
  };

  // 1) PDF
  try{
    const pdf = await fetch(`${CONFIG.API_BASE}/gerar-pdf`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Accept':'application/pdf' },
      body: JSON.stringify(payload)
    });
    if(!pdf.ok) throw new Error('Falha PDF: '+pdf.status);
    triggerDownload(await pdf.blob(), 'Jornada-Conhecimento-com-Luz.pdf');
    el.textContent = 'PDF concluído. Gerando HQ...';
  }catch(e){
    el.textContent = 'Não foi possível gerar o PDF. Tente novamente em instantes.';
    console.error(e); return;
  }

  // 2) HQ
  try{
    const hq = await fetch(`${CONFIG.API_BASE}/gerar-hq`, {
      method:'POST',
      headers:{ 'Content-Type':'application/json', 'Accept':'application/pdf' },
      body: JSON.stringify({ answers: state.answers })
    });
    if(!hq.ok) throw new Error('Falha HQ: '+hq.status);
    triggerDownload(await hq.blob(), 'Jornada-Conhecimento-com-Luz-HQ.pdf');
    el.textContent = 'HQ concluída. Limpando dados...';
  }catch(e){
    el.textContent = 'PDF ok, mas houve falha ao gerar a HQ. Você pode tentar novamente mais tarde.';
    console.error(e);
  }

  clearLocal();
  state.step='done';
  render();
}

// Util
function triggerDownload(blob, filename){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}

// Boot
(function init(){ loadLocal(); render(); })();
