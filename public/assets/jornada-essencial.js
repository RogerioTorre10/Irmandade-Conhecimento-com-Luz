/* jornada.js – v9 (wizard paginado + countdown + envio no final)
   - Tela de login sempre (FORCE_LOGIN)
   - Perguntas paginadas (1/32) com Próxima/Anterior
   - Envia mesmo incompleto (novalidate)
   - Contador regressivo 24h (usa deadline_iso salvo ao logar)
   - Downloads com Authorization e tratamento de 404
*/
const CONFIG = {
  BUILD: '2025-08-14-9',
  BACKEND_URL: 'https://lumen-backend-api.onrender.com',

  // Fluxo
  FORCE_LOGIN: true,

  // Seletores (se existir ID no HTML, usamos; senão criamos)
  PASSWORD_INPUT: '#senha-acesso',
  START_BUTTON: '#btn-iniciar',
  FORM_ROOT_SELECTOR: '#form-root',
  DEVOLUTIVA_SELECTOR: '#devolutiva',
  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial', // (opcional; no wizard criamos o nosso)
  PROGRESS_SELECTOR: '#icl-progress',
  COUNTDOWN_SELECTOR: '#icl-countdown',

  // Downloads (mostrados após a devolutiva)
  DOWNLOAD_BUTTON_FORM: '#btn-download-form',
  DOWNLOAD_BUTTON_HQ: '#btn-download-hq',

  // Textos fallback
  START_TEXT: 'iniciar',
  SEND_TEXT: 'enviar respostas',
};

/* 0) Anti-cache */
(() => {
  try {
    const KEY = 'icl:build';
    if (localStorage.getItem(KEY) !== CONFIG.BUILD) {
      localStorage.setItem(KEY, CONFIG.BUILD);
      const u = new URL(location.href); u.searchParams.set('v', CONFIG.BUILD);
      location.replace(u.toString());
    }
  } catch (_) {}
})();

/* Utils de estado */
const store = {
  set(k, v){ sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); },
  get(k){ const v = sessionStorage.getItem(k); try { return JSON.parse(v); } catch { return v; } },
  del(k){ sessionStorage.removeItem(k); },
  has(k){ return sessionStorage.getItem(k) != null; }
};
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs||{})) {
    if (k==='class') el.className=v; else if (k==='for') el.htmlFor=v; else el.setAttribute(k,v);
  }
  children.flat().forEach(c => el.appendChild(typeof c==='string' ? document.createTextNode(c) : c));
  return el;
}
function byText(root, tag, textLike){
  const needle = (textLike || '').toLowerCase();
  return [...(root||document).querySelectorAll(tag)]
    .find(el => (el.textContent||'').trim().toLowerCase().includes(needle));
}
function pickPasswordInput(){
  return document.querySelector(CONFIG.PASSWORD_INPUT) || document.querySelector('input[type="password"]');
}
function pickStartButton(){
  return document.querySelector(CONFIG.START_BUTTON) || byText(document, 'button', CONFIG.START_TEXT);
}
function pickFormRoot(){
  return document.querySelector(CONFIG.FORM_ROOT_SELECTOR) || (() => {
    const panel = byText(document, 'button', CONFIG.START_TEXT)?.closest('div') || document.body;
    const div = document.createElement('div'); div.id = 'form-root'; div.className = 'max-w-3xl mx-auto px-4 py-6';
    panel.parentNode.insertBefore(div, panel);
    return div;
  })();
}
function pickDevolutivaBox(){
  return document.querySelector(CONFIG.DEVOLUTIVA_SELECTOR) || (() => {
    const div = document.createElement('div'); div.id = 'devolutiva'; div.className = 'max-w-3xl mx-auto px-4 py-4';
    document.body.appendChild(div); return div;
  })();
}
function pickProgress(){
  return document.querySelector(CONFIG.PROGRESS_SELECTOR) || (() => {
    const bar = h('div', { id: 'icl-progress', class: 'max-w-3xl mx-auto px-4 py-2 text-sm text-gray-300' }, '');
    const root = pickFormRoot();
    root.parentNode.insertBefore(bar, root);
    return bar;
  })();
}
function pickCountdown(){
  return document.querySelector(CONFIG.COUNTDOWN_SELECTOR) || (() => {
    const row = h('div', { id: 'icl-countdown', class: 'max-w-3xl mx-auto px-4 pb-2 text-sm text-yellow-300' }, '');
    const root = pickFormRoot();
    root.parentNode.insertBefore(row, root);
    return row;
  })();
}
function authHeaders(){ const t = store.get('icl:token'); return t ? { Authorization:`Bearer ${t}` } : {}; }

/* Estado do wizard */
let QUESTIONS = [];        // lista bruta do backend
let IDX = 0;               // índice atual 0..N-1
let TOTAL = 0;             // total de perguntas
let ANSWERS = {};          // respostas parciais

/* ---- Login & Token ---- */
function addPasswordToggle(input) {
  const container = input.parentNode || input.closest('div') || input;
  container.style.position = 'relative';
  if (container.querySelector('[data-eye]')) return;
  const toggleBtn = h('button', {
    type: 'button',
    'data-eye': '1',
    class: 'absolute right-2 top-1/2 -translate-y-1/2 p-2 focus:outline-none text-gray-400 hover:text-gray-600',
    'aria-label': 'mostrar/ocultar senha',
  }, '👁️');
  toggleBtn.addEventListener('click', () => {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
  });
  container.appendChild(toggleBtn);
}
async function getPublicToken(){
  try {
    const r = await fetch(`${CONFIG.BACKEND_URL}/public/token`, { method: 'POST' });
    if (!r.ok) throw new Error('public token indisponível');
    const d = await r.json();
    if (d && d.token) {
      store.set('icl:token', d.token);
      store.set('icl:deadline', d.deadline_iso || '');
      return d.token;
    }
  } catch (_) {}
  return null;
}
async function ensureToken(){
  if (store.get('icl:token')) return true;
  const t = await getPublicToken();
  return !!t;
}

/* ---- Downloads ---- */
function downloadBlob(filename, blob){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}
async function downloadWithAuth(fileName){
  try {
    let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/download/${fileName}`, { headers: { ...authHeaders() } });
    if (r.status === 404) { alert('Arquivo ainda não está disponível para download.'); return; }
    if (r.status === 401 || r.status === 403) {
      const ok = await ensureToken();
      if (!ok) throw new Error('Sessão inválida e token público indisponível.');
      r = await fetch(`${CONFIG.BACKEND_URL}/jornada/download/${fileName}`, { headers: { ...authHeaders() } });
      if (r.status === 404) { alert('Arquivo ainda não está disponível para download.'); return; }
    }
    if (!r.ok) throw new Error(`Falha no download (${r.status})`);
    const blob = await r.blob();
    downloadBlob(fileName, blob);
  } catch (e) {
    alert(e.message || 'Não foi possível baixar o arquivo.');
  }
}
function renderDownloadButtons(root) {
  const btnPanel = h('div', { class: 'mt-6 flex flex-col sm:flex-row gap-4' },
    h('button', {
      id: CONFIG.DOWNLOAD_BUTTON_FORM.slice(1),
      type: 'button',
      class: 'w-full sm:w-1/2 px-6 py-3 border border-gray-300 rounded-xl text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors',
    }, 'Baixar Formulário da Jornada'),
    h('button', {
      id: CONFIG.DOWNLOAD_BUTTON_HQ.slice(1),
      type: 'button',
      class: 'w-full sm:w-1/2 px-6 py-3 border border-gray-300 rounded-xl text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors',
    }, 'Baixar HQ da Irmandade')
  );
  btnPanel.addEventListener('click', (ev) => {
    const t = ev.target;
    if (!t) return;
    if (t.id === CONFIG.DOWNLOAD_BUTTON_FORM.slice(1)) {
      ev.preventDefault(); downloadWithAuth('formulario.pdf');
    } else if (t.id === CONFIG.DOWNLOAD_BUTTON_HQ.slice(1)) {
      ev.preventDefault(); downloadWithAuth('hq.pdf');
    }
  });
  root.appendChild(btnPanel);
}

/* ---- Countdown 24h ---- */
let countdownTimer = null;
function startCountdown(){
  const el = pickCountdown();
  const iso = store.get('icl:deadline');
  if (!iso) { el.textContent = ''; return; }
  const end = new Date(iso).getTime();
  if (isNaN(end)) { el.textContent=''; return; }

  function tick(){
    const diff = end - Date.now();
    if (diff <= 0) {
      el.textContent = 'Sessão expirada. Clique em Iniciar novamente.';
      if (countdownTimer) clearInterval(countdownTimer);
      return;
    }
    const s = Math.floor(diff/1000);
    const hh = String(Math.floor(s/3600)).padStart(2,'0');
    const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    el.textContent = `Tempo restante: ${hh}:${mm}:${ss}`;
  }
  tick();
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(tick, 1000);
}

/* ---- Perguntas (API) ---- */
async function fetchQuestions() {
  let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
  if (r.status === 401 || r.status === 403) {
    if (!CONFIG.FORCE_LOGIN) {
      const ok = await ensureToken();
      if (!ok) throw new Error('Sessão inválida/expirada');
      r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
    } else {
      throw new Error('Sessão inválida/expirada');
    }
  }
  if (!r.ok) throw new Error(`Falha ao obter perguntas (${r.status})`);
  return r.json();
}

/* ---- Wizard ---- */
function answeredCount(){
  let count = 0;
  QUESTIONS.forEach(q => {
    const v = ANSWERS[q.id];
    if (q.kind === 'checkbox') { if (Array.isArray(v) && v.length) count++; }
    else if (q.kind === 'radio') { if (v) count++; }
    else { if (v && String(v).trim() !== '') count++; }
  });
  return count;
}
function updateProgressUI(){
  const bar = pickProgress();
  bar.textContent = `Pergunta ${IDX+1}/${TOTAL} • Respondidas ${answeredCount()}/${TOTAL}`;
}

/* salva o valor do input atual em ANSWERS */
function bindAndLoadValue(container, q){
  const apply = () => {
    if (q.kind === 'checkbox') {
      const vals = [...container.querySelectorAll('input[type="checkbox"][name="'+q.id+'"]:checked')].map(el=>el.value||true);
      ANSWERS[q.id] = vals;
    } else if (q.kind === 'radio') {
      const r = container.querySelector('input[type="radio"][name="'+q.id+'"]:checked');
      ANSWERS[q.id] = r ? r.value : '';
    } else {
      const el = container.querySelector('#'+q.id);
      ANSWERS[q.id] = el ? el.value : '';
    }
    updateProgressUI();
  };

  container.addEventListener('input', (ev)=>{
    const t = ev.target; if (!t) return;
    if (t.name === q.id || t.id === q.id) apply();
  }, true);

  // carregar valor prévio
  const v = ANSWERS[q.id];
  if (v == null) return;

  if (q.kind === 'checkbox') {
    const set = new Set(v || []);
    container.querySelectorAll('input[type="checkbox"][name="'+q.id+'"]').forEach(el=>{
      el.checked = set.has(el.value || true);
    });
  } else if (q.kind === 'radio') {
    const r = container.querySelector('input[type="radio"][name="'+q.id+'"][value="'+v+'"]');
    if (r) r.checked = true;
  } else {
    const el = container.querySelector('#'+q.id);
    if (el) el.value = String(v);
  }
}

function renderOneQuestion(root){
  const q = QUESTIONS[IDX];
  root.innerHTML = '';

  const section = h('section',{class:'bg-white rounded-2xl shadow p-6 space-y-4'});
  section.appendChild(h('h2',{class:'text-xl font-semibold'}, q.section || ''));
  section.appendChild(h('div',{class:'text-base font-medium'}, q.label));
  if (q.help) section.appendChild(h('div',{class:'text-xs text-gray-500'}, q.help));

  const base={id:q.id,name:q.id,class:'mt-2 w-full rounded-xl border-gray-300'};
  let input;
  if(q.kind==='textarea') input=h('textarea',{...base,rows:'3',placeholder:q.placeholder||''});
  else if(q.kind==='select') input=h('select',base, h('option',{value:''},'Selecione…'), ...(q.options||[]).map(o=>h('option',{value:o.value},o.label)));
  else if(q.kind==='radio') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2'}, h('input',{type:'radio',name:q.id,value:o.value}), o.label)));
  else if(q.kind==='checkbox') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2'}, h('input',{type:'checkbox',name:q.id,value:o.value}), o.label)));
  else input=h('input',{...base,type:'text',placeholder:q.placeholder||''});
  section.appendChild(input);

  const nav = h('div',{class:'mt-6 flex items-center justify-between gap-3'});
  const prev = h('button',{type:'button',class:'px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-50'}, 'Anterior');
  const nextText = (IDX === TOTAL-1) ? 'Ir para Enviar' : 'Próxima';
  const next = h('button',{type:'button',class:'px-5 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700'}, nextText);
  nav.appendChild(prev); nav.appendChild(next);

  section.appendChild(nav);
  root.appendChild(section);

  // Bind e carregar valor salvo
  bindAndLoadValue(section, q);

  prev.addEventListener('click', ()=>{
    if (IDX>0) { IDX--; renderOneQuestion(root); updateProgressUI(); window.scrollTo({top:0,behavior:'smooth'}); }
  });
  next.addEventListener('click', ()=>{
    if (IDX<TOTAL-1) { IDX++; renderOneQuestion(root); updateProgressUI(); window.scrollTo({top:0,behavior:'smooth'}); }
    else { renderFinalStep(root); updateProgressUI(); window.scrollTo({top:0,behavior:'smooth'}); }
  });

  updateProgressUI();
}

function renderFinalStep(root){
  root.innerHTML = '';
  const box = h('section',{class:'bg-white rounded-2xl shadow p-6 space-y-4'},
    h('h2',{class:'text-xl font-semibold'}, 'Finalizar'),
    h('p',{}, 'Você chegou ao fim. Se quiser, pode voltar e revisar as respostas.'),
    h('div',{class:'text-sm text-gray-600'}, `Respondidas ${answeredCount()}/${TOTAL}`)
  );
  const actions = h('div',{class:'mt-4 flex items-center gap-3 flex-wrap'});
  const revisar = h('button',{type:'button',class:'px-5 py-2 rounded-xl border border-gray-300 hover:bg-gray-50'}, 'Voltar');
  const enviar  = h('button',{id:'icl-send',type:'button',class:'px-5 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700'}, 'Enviar respostas');
  actions.appendChild(revisar); actions.appendChild(enviar);
  box.appendChild(actions);
  root.appendChild(box);

  revisar.addEventListener('click', ()=>{ IDX = Math.max(0, TOTAL-1); renderOneQuestion(root); updateProgressUI(); });

  enviar.addEventListener('click', async ()=>{
    const btn = enviar; const original = btn.textContent; btn.textContent = 'Enviando…'; btn.disabled = true;
    try { await submitAnswers(); }
    finally { btn.textContent = original; btn.disabled = false; }
  });
}

/* ---- Boot das perguntas ---- */
async function bootQuestions(){
  const root = pickFormRoot();
  try {
    const payload = await fetchQuestions();
    QUESTIONS = payload.questions || [];
    TOTAL = QUESTIONS.length;
    IDX = 0;

    // prepara estrutura de respostas com defaults vazios
    ANSWERS = ANSWERS || {};
    QUESTIONS.forEach(q=>{
      if (!(q.id in ANSWERS)) {
        ANSWERS[q.id] = (q.kind==='checkbox') ? [] : (q.kind==='radio' ? '' : '');
      }
    });

    renderOneQuestion(root);
    updateProgressUI();
  } catch(e) {
    console.error('[Lumen] Erro ao carregar perguntas:', e);
    alert('Não foi possível carregar as perguntas. Clique em Iniciar novamente.');
  }
}

/* ---- Coleta e envio ---- */
function collectAnswers(){ return { ...ANSWERS }; }

async function submitAnswers(){
  const payload={answers:collectAnswers(), meta:{tzOffsetMin:new Date().getTimezoneOffset(), ua:navigator.userAgent}};
  let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/submit`, {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify(payload)});
  if (r.status===401||r.status===403) {
    const ok = await ensureToken();
    if (!ok) { alert('Sessão expirada. Clique em Iniciar novamente.'); return; }
    r = await fetch(`${CONFIG.BACKEND_URL}/jornada/submit`, {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify(payload)});
  }
  if (!r.ok) { alert('Falha ao enviar.'); return; }
  const d= await r.json();
  const box = pickDevolutivaBox();
  box.innerHTML='';
  box.appendChild(h('div',{class:'bg-white rounded-2xl shadow p-6 prose max-w-none'},
    h('h3',{class:'text-xl font-semibold mb-2'},'Devolutiva do Lumen'),
    h('pre',{class:'whitespace-pre-wrap leading-relaxed'}, d.devolutiva || '—')
  ));
  renderDownloadButtons(box);
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

/* ---- Login ---- */
async function doLogin() {
  const input = pickPasswordInput();
  const btn = pickStartButton();
  if (!btn) { alert('Não achei o botão Iniciar.'); return; }

  if (input) addPasswordToggle(input);
  const pwd = (input && input.value || '').trim();
  const original = btn.textContent; btn.disabled = true; btn.textContent = 'Validando…';

  try {
    if (pwd) {
      const res = await fetch(`${CONFIG.BACKEND_URL}/validar-senha`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ senha: pwd })
      });
      if (res.ok) {
        const data = await res.json();
        store.set('icl:token', data.token); store.set('icl:deadline', data.deadline_iso);
        startCountdown();
        await bootQuestions();
        return;
      }
    }
    // fallback para modo aberto
    const t = await getPublicToken();
    if (!t) throw new Error('Falha ao obter acesso. Tente novamente.');
    startCountdown();
    await bootQuestions();
  } catch (e) {
    console.error('[Lumen] Auth erro:', e);
    alert(e.message || 'Falha ao validar acesso');
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}

/* ---- Eventos ---- */
document.addEventListener('click', (ev)=>{
  const t = ev.target; if (!t) return;
  const startBtn = pickStartButton();
  if (startBtn && (t===startBtn || t.closest('#btn-iniciar'))) {
    ev.preventDefault(); doLogin(); return;
  }
});

/* Importante: sem boot automático para não pular a tela de senha */
