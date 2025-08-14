/* jornada.js – v8.1 (resiliente + fallback token público + download com Authorization) */
const CONFIG = {
  BUILD: '2025-08-14-1', // Versão atualizada
  BACKEND_URL: 'https://lumen-backend-api.onrender.com',

  // IDs (usados se existirem)
  PASSWORD_INPUT: '#senha-acesso',
  START_BUTTON: '#btn-iniciar',
  FORM_ROOT_SELECTOR: '#form-root',
  DEVOLUTIVA_SELECTOR: '#devolutiva',
  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial',

  // IDs para os downloads
  DOWNLOAD_BUTTON_FORM: '#btn-download-form',
  DOWNLOAD_BUTTON_HQ: '#btn-download-hq',

  // Fallbacks por texto
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

/* Utils */
const store = {
  set(k, v){ sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); },
  get(k){ const v = sessionStorage.getItem(k); try { return JSON.parse(v); } catch { return v; } },
  del(k){ sessionStorage.removeItem(k); }
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
function pickSendButton(){
  return document.querySelector(CONFIG.SEND_BUTTON_SELECTOR) || byText(document, 'button', CONFIG.SEND_TEXT);
}
function pickFormRoot(){
  return document.querySelector(CONFIG.FORM_ROOT_SELECTOR) || (() => {
    // se não existir #form-root, cria um container antes do painel de botões
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
function authHeaders(){ const t = store.get('icl:token'); return t ? { Authorization:`Bearer ${t}` } : {}; }

/* --- NOVAS FUNÇÕES --- */

// Adiciona o botão de "olho mágico" ao campo de senha
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

// Token público (modo aberto)
async function getPublicToken(){
  try {
    const r = await fetch(`${CONFIG.BACKEND_URL}/public/token`, { method: 'POST' });
    if (!r.ok) throw new Error('public token indisponível');
    const d = await r.json();
    if (d && d.token) {
      store.set('icl:token', d.token);
      store.set('icl:deadline', d.deadline_iso || '');
      console.info('[Lumen] Token público obtido.');
      return d.token;
    }
  } catch (e) {
    console.warn('[Lumen] Falha ao obter token público:', e);
  }
  return null;
}

async function ensureToken(){
  if (store.get('icl:token')) return true;
  const t = await getPublicToken();
  return !!t;
}

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
    if (r.status === 401 || r.status === 403) {
      const ok = await ensureToken();
      if (!ok) throw new Error('Sessão inválida e token público indisponível.');
      r = await fetch(`${CONFIG.BACKEND_URL}/jornada/download/${fileName}`, { headers: { ...authHeaders() } });
    }
    if (!r.ok) throw new Error(`Falha no download (${r.status})`);
    const blob = await r.blob();
    downloadBlob(fileName, blob);
  } catch (e) {
    alert(e.message || 'Não foi possível baixar o arquivo.');
  }
}

// Renderiza os botões de download (agora como <button> com fetch + header)
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

/* Login */
async function doLogin() {
  const input = pickPasswordInput();
  const btn = pickStartButton();
  if (!btn) {
    console.error('[Lumen] Botão Iniciar não encontrado.');
    alert('Não achei o botão Iniciar.');
    return;
  }

  if (input) addPasswordToggle(input);
  const pwd = (input && input.value || '').trim();
  const original = btn.textContent; btn.disabled = true; btn.textContent = 'Validando…';

  try {
    // 1) Se tiver senha, tenta /validar-senha
    if (pwd) {
      const res = await fetch(`${CONFIG.BACKEND_URL}/validar-senha`, {
        method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ senha: pwd })
      });
      if (res.ok) {
        const data = await res.json();
        store.set('icl:token', data.token); store.set('icl:deadline', data.deadline_iso);
        console.info('[Lumen] Login OK. Deadline:', data.deadline_iso);
        await bootQuestions();
        return;
      }
      console.warn('[Lumen] validar-senha falhou; tentando token público…');
    }

    // 2) Sem senha (ou falhou), tenta /public/token
    const t = await getPublicToken();
    if (!t) throw new Error('Falha ao obter acesso. Tente novamente.');
    await bootQuestions();
  } catch (e) {
    console.error('[Lumen] Auth erro:', e);
    alert(e.message || 'Falha ao validar acesso');
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}
document.addEventListener('click', ev => {
  const t = ev.target; if (!t) return;
  const startBtn = pickStartButton();
  if (startBtn && (t === startBtn || t.closest('#btn-iniciar'))) { ev.preventDefault(); doLogin(); }
});

/* Perguntas */
async function fetchQuestions() {
  let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
  if (r.status === 401 || r.status === 403) {
    const ok = await ensureToken();
    if (!ok) throw new Error('Sessão inválida/expirada');
    r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
  }
  if (!r.ok) throw new Error(`Falha ao obter perguntas (${r.status})`);
  return r.json();
}

function renderQuestions(root, payload){
  root.innerHTML=''; const form = h('form',{id:'form-jornada',class:'space-y-6'});
  let cur=null, sec=null;
  payload.questions.forEach(q=>{
    if(q.section!==cur){ cur=q.section;
      sec=h('section',{class:'bg-white rounded-2xl shadow p-6'},
        h('h2',{class:'text-xl font-semibold mb-4'}, q.section||''));
      form.appendChild(sec);
    }
    const wrap=h('div',{class:'mb-4'});
    wrap.appendChild(h('label',{class:'block text-sm text-gray-700',for:q.id}, q.label));
    if(q.help) wrap.appendChild(h('div',{class:'text-xs text-gray-500 mt-1'}, q.help));
    const base={id:q.id,name:q.id,class:'mt-1 w-full rounded-xl border-gray-300'};
    let input;
    if(q.kind==='textarea') input=h('textarea',{...base,rows:'3',placeholder:q.placeholder||''});
    else if(q.kind==='select') input=h('select',base, h('option',{value:''},'Selecione…'), ...(q.options||[]).map(o=>h('option',{value:o.value},o.label)));
    else if(q.kind==='radio') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2'}, h('input',{type:'radio',name:q.id,value:o.value}), o.label)));
    else if(q.kind==='checkbox') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2'}, h('input',{type:'checkbox',name:q.id,value:o.value}), o.label)));
    else input=h('input',{...base,type:'text',placeholder:q.placeholder||''});
    wrap.appendChild(input); (sec||form).appendChild(wrap);
  });
  root.appendChild(form);
}

async function bootQuestions(){
  const root = pickFormRoot();
  try {
    const payload = await fetchQuestions();
    renderQuestions(root, payload);
    console.info('[Lumen] Perguntas renderizadas:', payload.questions.length);
  } catch(e) {
    console.error('[Lumen] Erro ao carregar perguntas:', e);
    alert('Não foi possível carregar as perguntas. Tente iniciar novamente.');
  }
}

/* Submit + devolutiva */
function collectAnswers(root=document){
  const a={}; root.querySelectorAll('input,textarea,select').forEach(el=>{
    const n=el.name||el.id; if(!n) return;
    if(el.type==='checkbox'){ a[n]=a[n]||[]; if(el.checked) a[n].push(el.value||true); }
    else if(el.type==='radio'){ if(el.checked) a[n]=el.value; else if(!(n in a)) a[n]=''; }
    else { a[n]=el.value; }
  }); return a;
}

async function submitAnswers(){
  const root = pickFormRoot();
  const payload={answers:collectAnswers(root), meta:{tzOffsetMin:new Date().getTimezoneOffset(), ua:navigator.userAgent}};
  let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/submit`, {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify(payload)});
  if (r.status===401||r.status===403) {
    const ok = await ensureToken();
    if (!ok) { alert('Sessão expirada. Faça login novamente.'); return; }
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
  // Botões de download autenticados
  renderDownloadButtons(box);
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

/* Wire do botão Enviar (por ID ou por texto) */
document.addEventListener('click', async ev=>{
  const t = ev.target; if (!t) return;
  const sendBtn = pickSendButton();
  if (sendBtn && (t===sendBtn || t.closest('#btn-enviar-oficial'))) {
    ev.preventDefault();
    const original = sendBtn.textContent; sendBtn.textContent = 'Enviando…';
    try { await submitAnswers(); } finally { sendBtn.textContent = original; }
  }
});

/* Boot automático se já houver token (ou modo aberto com retry) */
(async ()=>{ try { await bootQuestions(); } catch(_){} })();
