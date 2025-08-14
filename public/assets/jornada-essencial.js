/* jornada.js – v8 (resiliente a IDs) */
const CONFIG = {
  BUILD: '2025-08-14-1', // Versão atualizada
  BACKEND_URL: 'https://lumen-backend-api.onrender.com',

  // IDs (usados se existirem)
  PASSWORD_INPUT: '#senha-acesso',
  START_BUTTON: '#btn-iniciar',
  FORM_ROOT_SELECTOR: '#form-root',
  DEVOLUTIVA_SELECTOR: '#devolutiva',
  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial',
  
  // Adicionado: IDs para os downloads
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
  const container = input.parentNode;
  container.style.position = 'relative';

  const toggleBtn = h('button', {
    type: 'button',
    class: 'absolute right-2 top-1/2 -translate-y-1/2 p-2 focus:outline-none text-gray-400 hover:text-gray-600',
  }, '👁️'); // Ícone de olho mágico

  toggleBtn.addEventListener('click', () => {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
  });

  container.appendChild(toggleBtn);
}

// Renderiza os botões de download
function renderDownloadButtons(root) {
  const btnPanel = h('div', { class: 'mt-6 flex flex-col sm:flex-row gap-4' },
    h('a', {
      id: CONFIG.DOWNLOAD_BUTTON_FORM.slice(1), // Remove o #
      class: 'w-full sm:w-1/2 px-6 py-3 border border-gray-300 rounded-xl text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors',
      href: `${CONFIG.BACKEND_URL}/jornada/download/formulario.pdf`,
      download: ''
    }, 'Baixar Formulário da Jornada'),
    h('a', {
      id: CONFIG.DOWNLOAD_BUTTON_HQ.slice(1),
      class: 'w-full sm:w-1/2 px-6 py-3 border border-gray-300 rounded-xl text-center text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors',
      href: `${CONFIG.BACKEND_URL}/jornada/download/hq.pdf`,
      download: ''
    }, 'Baixar HQ da Irmandade')
  );

  root.appendChild(btnPanel);
}

/* FIM DAS NOVAS FUNÇÕES */

/* Login */
async function doLogin() {
  const input = pickPasswordInput();
  const btn = pickStartButton();
  if (!input || !btn) {
    console.error('[Lumen] Elementos de login não encontrados (senha/botão). Confira o HTML.');
    alert('Não achei o campo de senha ou o botão Iniciar.');
    return;
  }
  const pwd = (input.value||'').trim();
  if (!pwd) { alert('Digite a senha.'); return; }
  
  // Chamada à nova função do olho mágico
  // Se o botão não foi adicionado ainda, adiciona
  if (!input.parentNode.querySelector('button')) {
    addPasswordToggle(input);
  }

  const original = btn.textContent; btn.disabled = true; btn.textContent = 'Validando…';
  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/auth/validate`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: pwd })
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({})); throw new Error(e.detail || `Falha no auth (${res.status})`);
    }
    const data = await res.json();
    store.set('icl:token', data.token); store.set('icl:deadline', data.deadline_iso);
    console.info('[Lumen] Login OK. Deadline:', data.deadline_iso);
    await bootQuestions();
  } catch (e) {
    console.error('[Lumen] Auth erro:', e);
    alert(e.message || 'Falha ao validar senha');
  } finally {
    btn.disabled = false; btn.textContent = original;
  }
}
document.addEventListener('click', ev => {
  const t = ev.target; if (!t) return;
  if (t === pickStartButton() || t.closest('#btn-iniciar')) { ev.preventDefault(); doLogin(); }
});

/* Perguntas */
async function fetchQuestions() {
  const r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
  if (r.status === 401 || r.status === 403) throw new Error('Sessão inválida/expirada');
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
  const r= await fetch(`${CONFIG.BACKEND_URL}/jornada/submit`, {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify(payload)});
  if (r.status===401||r.status===403) { alert('Sessão expirada. Faça login novamente.'); return; }
  if (!r.ok) { alert('Falha ao enviar.'); return; }
  const d= await r.json();
  const box = pickDevolutivaBox();
  box.innerHTML='';
  box.appendChild(h('div',{class:'bg-white rounded-2xl shadow p-6 prose max-w-none'},
    h('h3',{class:'text-xl font-semibold mb-2'},'Devolutiva do Lumen'),
    h('pre',{class:'whitespace-pre-wrap leading-relaxed'}, d.devolutiva || '—')
  ));
  // Novo trecho: adiciona os botões de download após a devolutiva
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

/* Boot automático se já houver token */
(async ()=>{ try { await bootQuestions(); } catch(_){} })();
