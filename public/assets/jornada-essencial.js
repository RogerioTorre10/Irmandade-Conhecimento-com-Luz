/* jornada.js – v9 (estável) — wizard + contador + devolutiva + downloads + "Apagar resposta" seguro */
const CONFIG = {
  BUILD: '2025-08-14-9',
  BACKEND_URL: 'https://lumen-backend-api.onrender.com',

  // Seletores/IDs opcionais do teu HTML (se não existir, o script acha por texto)
  PASSWORD_INPUT: '#senha-acesso',
  START_BUTTON: '#btn-iniciar',
  FORM_ROOT_SELECTOR: '#form-root',
  DEVOLUTIVA_SELECTOR: '#devolutiva',
  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial',

  // Texto fallback
  START_TEXT: 'iniciar',
  SEND_TEXT: 'enviar respostas',

  // Downloads (estáticos, servidos pelo backend com auth)
  DOWNLOAD_BUTTON_FORM: '#btn-download-form',
  DOWNLOAD_BUTTON_HQ: '#btn-download-hq',
};

/* 0) Anti-cache (garante que carrega esta versão) */
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

/* Estado */
let QUESTIONS = [];
let TOTAL = 0;
let IDX = 0;
let ANSWERS = {};

/* Estilinho dark pros campos (só reforço visual) */
(function injectStyle(){
  const css = `
  #form-root input[type="text"], #form-root textarea, #form-root select{
    background: rgba(255,255,255,.06);
    color: #e5e7eb;
    border: 1px solid rgba(255,255,255,.15);
    border-radius: 12px;
    padding: .6rem .8rem;
  }
  #form-root textarea::placeholder, #form-root input::placeholder { color:#9ca3af; }
  .card{ background: rgba(17,24,39,.35); border:1px solid rgba(255,255,255,.08); border-radius: 16px; }
  .btn-yellow{ background:#fbbf24; color:#111827; border-radius:12px; padding:.55rem 1.1rem; }
  .btn-yellow:hover{ background:#f59e0b; }
  .btn-gray{ background:#374151; color:#e5e7eb; border:1px solid #4b5563; border-radius:12px; padding:.55rem 1.1rem; }
  .btn-gray:hover{ background:#4b5563; }
  .progress{ color:#fde68a; }
  `;
  const s=document.createElement('style'); s.textContent=css; document.head.appendChild(s);
})();

/* Login */
function addPasswordToggle(input) {
  const container = input.parentNode || input.closest('div') || input;
  container.style.position = 'relative';
  if (container.querySelector('[data-eye]')) return;
  const toggleBtn = h('button', {
    type: 'button', 'data-eye': '1',
    class: 'absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400',
    'aria-label': 'mostrar/ocultar senha',
  }, '👁️');
  toggleBtn.addEventListener('click', () => {
    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);
  });
  container.appendChild(toggleBtn);
}

async function doLogin() {
  const input = pickPasswordInput();
  const btn = pickStartButton();
  if (!btn) { alert('Não achei o botão Iniciar.'); return; }
  if (input) addPasswordToggle(input);
  const pwd = (input && input.value || '').trim();

  const original = btn.textContent; btn.disabled = true; btn.textContent = 'Validando…';
  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/validar-senha`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ senha: pwd || 'iniciar' })
    });
    if (!res.ok) {
      const e = await res.json().catch(()=>({})); throw new Error(e.detail || `Falha no auth (${res.status})`);
    }
    const data = await res.json();
    store.set('icl:token', data.token); store.set('icl:deadline', data.deadline_iso);
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
  const startBtn = pickStartButton();
  if (startBtn && (t===startBtn || t.closest('#btn-iniciar'))) { ev.preventDefault(); doLogin(); }
});

/* API */
async function fetchQuestions() {
  const r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
  if (r.status === 401 || r.status === 403) throw new Error('Sessão inválida/expirada');
  if (!r.ok) throw new Error(`Falha ao obter perguntas (${r.status})`);
  return r.json();
}

/* Progresso */
function answeredCount(){
  let c=0;
  QUESTIONS.forEach(q=>{
    const v = ANSWERS[q.id];
    if (q.kind==='checkbox'){ if (Array.isArray(v) && v.length) c++; }
    else if (q.kind==='radio'){ if (v) c++; }
    else { if (v && String(v).trim()!=='') c++; }
  });
  return c;
}
function renderProgressBar(root){
  const top = document.getElementById('icl-progress') || (() => {
    const d = h('div',{id:'icl-progress',class:'progress max-w-3xl mx-auto py-2 text-base font-semibold'}); 
    root.parentNode.insertBefore(d, root); return d;
  })();
  top.textContent = `Pergunta ${IDX+1}/${TOTAL} • Respondidas ${answeredCount()}/${TOTAL}`;
}
function updateProgressUI(root){ renderProgressBar(root); }

/* Render 1 pergunta (wizard) */
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
    updateProgressUI(pickFormRoot());
    const inline = container.querySelector('[data-inline-progress]');
    if (inline) inline.textContent = `Pergunta ${IDX+1}/${TOTAL} • Respondidas ${answeredCount()}/${TOTAL}`;
  };
  container.addEventListener('input', (ev)=>{ const t = ev.target; if (!t) return; if (t.name===q.id || t.id===q.id) apply(); }, true);
  const v = ANSWERS[q.id]; if (v == null) return;
  if (q.kind === 'checkbox') {
    const set = new Set(v || []);
    container.querySelectorAll('input[type="checkbox"][name="'+q.id+'"]').forEach(el=>{ el.checked = set.has(el.value || true); });
  } else if (q.kind === 'radio') {
    const r = container.querySelector('input[type="radio"][name="'+q.id+'"][value="'+v+'"]'); if (r) r.checked = true;
  } else {
    const el = container.querySelector('#'+q.id); if (el) el.value = String(v);
  }
}

function renderOneQuestion(root){
  const q = QUESTIONS[IDX];
  root.innerHTML='';

  const section = h('section',{class:'card p-6 space-y-4'});

  // contador inline
  section.appendChild(h('div',{ 'data-inline-progress':'1', class:'text-sm text-yellow-300' },
    `Pergunta ${IDX+1}/${TOTAL} • Respondidas ${answeredCount()}/${TOTAL}`));

  if (q.section) section.appendChild(h('h2',{class:'text-xl font-semibold text-gray-100'}, q.section));
  section.appendChild(h('div',{class:'text-base font-medium text-gray-100'}, q.label));

  const base={id:q.id,name:q.id,class:'mt-2 w-full'};
  let input;
  if(q.kind==='textarea') input=h('textarea',{...base,rows:'3',placeholder:q.placeholder||'Escreva livremente…'});
  else if(q.kind==='select') input=h('select',base, h('option',{value:''},'Selecione…'), ...(q.options||[]).map(o=>h('option',{value:o.value},o.label)));
  else if(q.kind==='radio') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2 text-gray-100'}, h('input',{type:'radio',name:q.id,value:o.value}), o.label)));
  else if(q.kind==='checkbox') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2 text-gray-100'}, h('input',{type:'checkbox',name:q.id,value:o.value}), o.label)));
  else input=h('input',{...base,type:'text',placeholder:q.placeholder||''});
  section.appendChild(input);

  // navegação + APAGAR resposta (botão local, sem listeners globais)
  const nav = h('div',{class:'mt-6 flex items-center justify-between gap-3 flex-wrap'});
  const prev = h('button',{type:'button',class:'btn-gray'}, 'Anterior');
  const clear = h('button',{type:'button',class:'btn-gray'}, 'Apagar resposta');
  const nextText = (IDX === TOTAL-1) ? 'Ir para Enviar' : 'Próxima';
  const next = h('button',{type:'button',class:'btn-yellow'}, nextText);
  nav.appendChild(prev); nav.appendChild(clear); nav.appendChild(next);
  section.appendChild(nav);

  root.appendChild(section);

  // bind
  bindAndLoadValue(section, q);

  // listeners navegação
  prev.addEventListener('click', ()=>{ if (IDX>0) { IDX--; renderOneQuestion(root); updateProgressUI(root); window.scrollTo({top:0,behavior:'smooth'}); } });
  next.addEventListener('click', ()=>{ 
    if (IDX<TOTAL-1) { IDX++; renderOneQuestion(root); updateProgressUI(root); window.scrollTo({top:0,behavior:'smooth'}); } 
    else { renderFinalStep(root); updateProgressUI(root); window.scrollTo({top:0,behavior:'smooth'}); }
  });

  // >>> APAGAR RESPOSTA — limpa somente este passo, sem tocar nos outros
  clear.addEventListener('click', (e)=>{
    e.preventDefault();
    // zera em ANSWERS
    ANSWERS[q.id] = (q.kind === 'checkbox') ? [] : '';

    // zera no DOM + dispara input/change p/ manter contador correto
    if (q.kind === 'checkbox') {
      section.querySelectorAll(`input[type="checkbox"][name="${q.id}"]`).forEach(cb => {
        cb.checked = false;
        cb.dispatchEvent(new Event('input', {bubbles:true}));
      });
    } else if (q.kind === 'radio') {
      section.querySelectorAll(`input[type="radio"][name="${q.id}"]`).forEach(r => {
        r.checked = false;
        r.dispatchEvent(new Event('input', {bubbles:true}));
      });
    } else if (q.kind === 'select') {
      const el = section.querySelector('#'+q.id);
      if (el) { el.value=''; el.dispatchEvent(new Event('change',{bubbles:true})); el.dispatchEvent(new Event('input',{bubbles:true})); }
    } else {
      const el = section.querySelector('#'+q.id);
      if (el) { el.value=''; el.dispatchEvent(new Event('input',{bubbles:true})); }
    }

    updateProgressUI(root);
  });

  updateProgressUI(root);
}

function renderFinalStep(root){
  root.innerHTML = '';
  const box = h('section',{class:'card p-6 space-y-4'},
    h('h2',{class:'text-xl font-semibold text-gray-100'}, 'Finalizar'),
    h('p',{class:'text-gray-200'}, 'Você chegou ao fim. Se quiser, pode voltar e revisar as respostas.'),
    h('div',{class:'text-sm text-gray-300'}, `Respondidas ${answeredCount()}/${TOTAL}`)
  );
  const actions = h('div',{class:'mt-4 flex items-center gap-3 flex-wrap'});
  const revisar = h('button',{type:'button',class:'btn-gray'}, 'Voltar');
  const enviar  = h('button',{id:'icl-send',type:'button',class:'btn-yellow'}, 'Enviar respostas');
  actions.appendChild(revisar); actions.appendChild(enviar);
  box.appendChild(actions);
  root.appendChild(box);

  const footerSend = pickSendButton(); if (footerSend) footerSend.style.display = '';

  revisar.addEventListener('click', ()=>{ IDX = Math.max(0, TOTAL-1); renderOneQuestion(root); updateProgressUI(root); });
  enviar.addEventListener('click', async ()=>{
    const btn = enviar; const original = btn.textContent; btn.textContent = 'Enviando…'; btn.disabled = true;
    try { await submitAnswers(); } finally { btn.textContent = original; btn.disabled = false; }
  });
}

/* Boot */
async function bootQuestions(){
  const root = pickFormRoot();
  try {
    const payload = await fetchQuestions();
    QUESTIONS = payload.questions || [];
    TOTAL = QUESTIONS.length; IDX = 0;
    ANSWERS = {};
    QUESTIONS.forEach(q=>{ ANSWERS[q.id] = (q.kind==='checkbox') ? [] : ''; });

    // oculta o envio do rodapé enquanto está no wizard
    const footerSend = pickSendButton(); if (footerSend) footerSend.style.display = 'none';

    renderOneQuestion(root);
    updateProgressUI(root);
  } catch(e) {
    console.error('[Lumen] Erro ao carregar perguntas:', e);
    alert('Não foi possível carregar as perguntas. Clique em Iniciar novamente.');
  }
}

/* Coleta + envio + devolutiva + downloads */
function collectAnswers(){ return { ...ANSWERS }; }

async function submitAnswers(){
  const payload={answers:collectAnswers(), meta:{tzOffsetMin:new Date().getTimezoneOffset(), ua:navigator.userAgent}};
  const r= await fetch(`${CONFIG.BACKEND_URL}/jornada/submit`, {method:'POST', headers:{'Content-Type':'application/json', ...authHeaders()}, body:JSON.stringify(payload)});
  if (r.status===401||r.status===403) { alert('Sessão expirada. Faça login novamente.'); return; }
  if (!r.ok) { alert('Falha ao enviar.'); return; }
  const d= await r.json();
  const box = pickDevolutivaBox();
  box.innerHTML='';
  box.appendChild(h('div',{class:'card p-6 prose max-w-none prose-invert'},
    h('h3',{class:'text-xl font-semibold mb-2'},'Devolutiva do Lumen'),
    h('pre',{class:'whitespace-pre-wrap leading-relaxed'}, d.devolutiva || '—')
  ));

  // Botões de download (estáticos, servidos pelo backend)
  const btnPanel = h('div', { class: 'mt-6 flex flex-col sm:flex-row gap-4' },
    h('a', {
      id: CONFIG.DOWNLOAD_BUTTON_FORM.slice(1),
      class: 'w-full sm:w-1/2 px-6 py-3 border border-gray-300 rounded-xl text-center text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors',
      href: `${CONFIG.BACKEND_URL}/jornada/download/formulario.pdf`,
      download: ''
    }, 'Baixar Formulário da Jornada'),
    h('a', {
      id: CONFIG.DOWNLOAD_BUTTON_HQ.slice(1),
      class: 'w-full sm:w-1/2 px-6 py-3 border border-gray-300 rounded-xl text-center text-sm font-medium text-gray-200 hover:bg-gray-800 transition-colors',
      href: `${CONFIG.BACKEND_URL}/jornada/download/hq.pdf`,
      download: ''
    }, 'Baixar HQ da Irmandade')
  );
  box.appendChild(btnPanel);

  box.scrollIntoView({behavior:'smooth',block:'start'});
}

/* Boot automático se já houver token */
(async ()=>{ try { await bootQuestions(); } catch(_){} })();
