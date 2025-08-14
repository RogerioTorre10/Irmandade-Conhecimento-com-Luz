/* jornada.js – v9.6 (PDF on-the-fly via /jornada/pdf + wizard + dark + contador) */
const CONFIG = {
  BUILD: '2025-08-14-9.6',
  BACKEND_URL: 'https://lumen-backend-api.onrender.com',
  FORCE_LOGIN: true,

  PASSWORD_INPUT: '#senha-acesso',
  START_BUTTON: '#btn-iniciar',
  FORM_ROOT_SELECTOR: '#form-root',
  DEVOLUTIVA_SELECTOR: '#devolutiva',

  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial',
  CLEAR_BUTTON_SELECTOR: '#btn-limpar-oficial',
  START_TEXT: 'iniciar',
  SEND_TEXT: 'enviar respostas',
  CLEAR_TEXTS: ['apagar resposta', 'limpar resposta', 'limpar respostas'],

  PROGRESS_SELECTOR: '#icl-progress',
  COUNTDOWN_SELECTOR: '#icl-countdown',

  DOWNLOAD_BUTTON_FORM: '#btn-download-form',
  DOWNLOAD_BUTTON_HQ: '#btn-download-hq',
};

/* Anti-cache */
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

/* Helpers */
const store = {
  set(k, v){ sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); },
  get(k){ const v = sessionStorage.getItem(k); try { return JSON.parse(v); } catch { return v; } },
  del(k){ sessionStorage.removeItem(k); },
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
function pickPasswordInput(){ return document.querySelector(CONFIG.PASSWORD_INPUT) || document.querySelector('input[type="password"]'); }
function pickStartButton(){ return document.querySelector(CONFIG.START_BUTTON) || byText(document, 'button', CONFIG.START_TEXT); }
function pickSendButton(){ return document.querySelector(CONFIG.SEND_BUTTON_SELECTOR) || byText(document, 'button', CONFIG.SEND_TEXT); }
function pickClearButton(){
  const byId = document.querySelector(CONFIG.CLEAR_BUTTON_SELECTOR);
  if (byId) return byId;
  for (const t of CONFIG.CLEAR_TEXTS) { const btn = byText(document, 'button', t); if (btn) return btn; }
  return null;
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
    const bar = h('div', { id: 'icl-progress', class: 'max-w-3xl mx-auto py-2 text-base font-semibold' }, '');
    const root = pickFormRoot();
    root.parentNode.insertBefore(bar, root);
    return bar;
  })();
}
function pickCountdown(){
  return document.querySelector(CONFIG.COUNTDOWN_SELECTOR) || (() => {
    const row = h('div', { id: 'icl-countdown', class: 'max-w-3xl mx-auto px-4 pb-2 text-sm' }, '');
    const root = pickFormRoot();
    root.parentNode.insertBefore(row, root);
    return row;
  })();
}
function authHeaders(){ const t = store.get('icl:token'); return t ? { Authorization:`Bearer ${t}` } : {}; }

/* Estado */
let QUESTIONS = [];
let IDX = 0;
let TOTAL = 0;
let ANSWERS = {};
let countdownTimer = null;

/* Estilos */
(function injectDarkStyle(){
  const css = `
  #form-root input[type="text"],
  #form-root textarea,
  #form-root select {
    background-color: rgba(255,255,255,0.05);
    color: #e5e7eb;
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 0.75rem;
    padding: 0.5rem 0.75rem;
  }
  #form-root input::placeholder,
  #form-root textarea::placeholder { color: #9ca3af; }

  #icl-progress {
    position: sticky; top: 0; z-index: 30;
    background: rgba(17,24,39,0.8);
    backdrop-filter: saturate(1.2) blur(4px);
    color: #fde68a;
    padding: 8px 16px; margin: 0 auto; max-width: 48rem;
    border-bottom: 1px solid rgba(253,230,138,0.25);
    border-radius: 0 0 .75rem .75rem;
  }
  #icl-countdown { color: #fcd34d; }

  .btn-yellow { background:#fbbf24; color:#111827; }
  .btn-yellow:hover { background:#f59e0b; }
  .btn-gray { background:#374151; color:#e5e7eb; border:1px solid #4b5563; }
  .btn-gray:hover { background:#4b5563; }
  .btn-outline { border:1px solid #9ca3af; color:#e5e7eb; }
  .btn-outline:hover { background:#111827; }
  .card { background: rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08); border-radius:1rem; }
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);
})();

/* Login / Token */
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
async function getPublicToken(){
  try {
    const r = await fetch(`${CONFIG.BACKEND_URL}/public/token`, { method: 'POST' });
    if (!r.ok) throw new Error('public token indisponível');
    const d = await r.json();
    if (d && d.token) { store.set('icl:token', d.token); store.set('icl:deadline', d.deadline_iso || ''); return d.token; }
  } catch(_) {}
  return null;
}
async function ensureToken(){ if (store.get('icl:token')) return true; return !!(await getPublicToken()); }

/* Downloads */
function downloadBlob(filename, blob){
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
async function downloadPDFGenerated(){
  // usa as respostas atuais em memória
  const payload = { answers: { ...ANSWERS }, meta: { tzOffsetMin: new Date().getTimezoneOffset(), ua: navigator.userAgent } };
  try {
    let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/pdf`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', ...authHeaders() },
      body: JSON.stringify(payload)
    });
    if (r.status === 401 || r.status === 403) {
      const ok = await ensureToken();
      if (!ok) throw new Error('Sessão inválida. Clique em Iniciar.');
      r = await fetch(`${CONFIG.BACKEND_URL}/jornada/pdf`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', ...authHeaders() },
        body: JSON.stringify(payload)
      });
    }
    if (!r.ok) throw new Error('Falha ao gerar o PDF.');
    const blob = await r.blob();
    downloadBlob(`jornada_${Date.now()}.pdf`, blob);
  } catch (e) { alert(e.message || 'Não foi possível gerar o PDF.'); }
}
async function downloadHQ(){
  try {
    let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/download/hq.pdf`, { headers: { ...authHeaders() } });
    if (r.status === 401 || r.status === 403) {
      const ok = await ensureToken(); if (!ok) throw new Error('Sessão inválida.');
      r = await fetch(`${CONFIG.BACKEND_URL}/jornada/download/hq.pdf`, { headers: { ...authHeaders() } });
    }
    if (!r.ok) { window.open(`${CONFIG.BACKEND_URL}/downloads/hq.pdf`, '_blank'); return; }
    const blob = await r.blob();
    downloadBlob('hq.pdf', blob);
  } catch { window.open(`${CONFIG.BACKEND_URL}/downloads/hq.pdf`, '_blank'); }
}
function renderDownloadButtons(root) {
  const btnPanel = h('div', { class: 'mt-6 flex flex-col sm:flex-row gap-4' },
    h('button', { id: CONFIG.DOWNLOAD_BUTTON_FORM.slice(1), type: 'button', class: 'w-full sm:w-1/2 px-6 py-3 rounded-xl btn-outline' }, 'Baixar Formulário da Jornada'),
    h('button', { id: CONFIG.DOWNLOAD_BUTTON_HQ.slice(1), type: 'button', class: 'w-full sm:w-1/2 px-6 py-3 rounded-xl btn-outline' }, 'Baixar HQ da Irmandade')
  );
  btnPanel.addEventListener('click', (ev) => {
    const t = ev.target; if (!t) return;
    if (t.id === CONFIG.DOWNLOAD_BUTTON_FORM.slice(1)) { ev.preventDefault(); downloadPDFGenerated(); }
    else if (t.id === CONFIG.DOWNLOAD_BUTTON_HQ.slice(1)) { ev.preventDefault(); downloadHQ(); }
  });
  root.appendChild(btnPanel);
}

/* Countdown */
function startCountdown(){
  const el = pickCountdown();
  const iso = store.get('icl:deadline');
  if (!iso) { el.textContent = ''; return; }
  const end = new Date(iso).getTime(); if (isNaN(end)) { el.textContent=''; return; }
  function tick(){
    const diff = end - Date.now();
    if (diff <= 0) { el.textContent = 'Sessão expirada. Clique em Iniciar novamente.'; if (countdownTimer) clearInterval(countdownTimer); return; }
    const s = Math.floor(diff/1000);
    const hh = String(Math.floor(s/3600)).padStart(2,'0');
    const mm = String(Math.floor((s%3600)/60)).padStart(2,'0');
    const ss = String(s%60).padStart(2,'0');
    el.textContent = `Tempo restante: ${hh}:${mm}:${ss}`;
  }
  tick(); if (countdownTimer) clearInterval(countdownTimer); countdownTimer = setInterval(tick, 1000);
}

/* API perguntas */
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

/* Wizard */
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
let QUESTIONS_CACHE = null; // opcional

function renderOneQuestion(root){
  const q = QUESTIONS[IDX];
  root.innerHTML = '';

  const section = h('section',{class:'card p-6 space-y-4'});
  section.appendChild(h('div',{ 'data-inline-progress':'1', class:'text-sm text-yellow-300' },
    `Pergunta ${IDX+1}/${TOTAL} • Respondidas ${answeredCount()}/${TOTAL}`));
  section.appendChild(h('h2',{class:'text-xl font-semibold text-gray-100'}, q.section || ''));
  section.appendChild(h('div',{class:'text-base font-medium text-gray-100'}, q.label));

  const base={id:q.id,name:q.id,class:'mt-2 w-full'};
  let input;
  if(q.kind==='textarea') input=h('textarea',{...base,rows:'3',placeholder:q.placeholder||'Escreva livremente…'});
  else if(q.kind==='select') input=h('select',base, h('option',{value:''},'Selecione…'), ...(q.options||[]).map(o=>h('option',{value:o.value},o.label)));
  else if(q.kind==='radio') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2 text-gray-100'}, h('input',{type:'radio',name:q.id,value:o.value}), o.label)));
  else if(q.kind==='checkbox') input=h('div',{class:'mt-1 flex flex-wrap gap-3'}, ...(q.options||[]).map(o=>h('label',{class:'inline-flex items-center gap-2 text-gray-100'}, h('input',{type:'checkbox',name:q.id,value:o.value}), o.label)));
  else input=h('input',{...base,type:'text',placeholder:q.placeholder||''});
  section.appendChild(input);

  const nav = h('div',{class:'mt-6 flex items-center justify-between gap-3 flex-wrap'});
  const prev = h('button',{type:'button',class:'px-5 py-2 rounded-xl btn-gray'}, 'Anterior');
  const nextText = (IDX === TOTAL-1) ? 'Ir para Enviar' : 'Próxima';
  const next = h('button',{type:'button',class:'px-5 py-2 rounded-xl btn-yellow'}, nextText);
  nav.appendChild(prev); nav.appendChild(next);
  section.appendChild(nav);
  root.appendChild(section);

  bindAndLoadValue(section, q);

  prev.addEventListener('click', ()=>{ if (IDX>0) { IDX--; renderOneQuestion(root); updateProgressUI(); window.scrollTo({top:0,behavior:'smooth'}); } });
  next.addEventListener('click', ()=>{ if (IDX<TOTAL-1) { IDX++; renderOneQuestion(root); updateProgressUI(); window.scrollTo({top:0,behavior:'smooth'}); } else { renderFinalStep(root); updateProgressUI(); window.scrollTo({top:0,behavior:'smooth'}); } });

  updateProgressUI();
}

function renderFinalStep(root){
  root.innerHTML = '';
  const box = h('section',{class:'card p-6 space-y-4'},
    h('h2',{class:'text-xl font-semibold text-gray-100'}, 'Finalizar'),
    h('p',{class:'text-gray-200'}, 'Você chegou ao fim. Se quiser, pode voltar e revisar as respostas.'),
    h('div',{class:'text-sm text-gray-300'}, `Respondidas ${answeredCount()}/${TOTAL}`)
  );
  const actions = h('div',{class:'mt-4 flex items-center gap-3 flex-wrap'});
  const revisar = h('button',{type:'button',class:'px-5 py-2 rounded-xl btn-gray'}, 'Voltar');
  const enviar  = h('button',{id:'icl-send',type:'button',class:'px-5 py-2 rounded-xl btn-yellow'}, 'Enviar respostas');
  actions.appendChild(revisar); actions.appendChild(enviar);
  box.appendChild(actions);
  root.appendChild(box);

  const footerSend = pickSendButton(); if (footerSend) footerSend.style.display = '';

  revisar.addEventListener('click', ()=>{ IDX = Math.max(0, TOTAL-1); renderOneQuestion(root); updateProgressUI(); });
  enviar.addEventListener('click', async ()=>{
    const btn = enviar; const original = btn.textContent; btn.textContent = 'Enviando…'; btn.disabled = true;
    try { await submitAnswers(); } finally { btn.textContent = original; btn.disabled = false; }
  });
}

/* Boot perguntas */
async function bootQuestions(){
  const root = pickFormRoot();
  try {
    const payload = await fetchQuestions();
    QUESTIONS = payload.questions || [];
    TOTAL = QUESTIONS.length; IDX = 0;
    ANSWERS = ANSWERS || {};
    QUESTIONS.forEach(q=>{ if (!(q.id in ANSWERS)) ANSWERS[q.id] = (q.kind==='checkbox') ? [] : ''; });

    const footerSend = pickSendButton(); if (footerSend) footerSend.style.display = 'none';

    renderOneQuestion(root);
    pickProgress();
    updateProgressUI();
  } catch(e) {
    console.error('[Lumen] Erro ao carregar perguntas:', e);
    alert('Não foi possível carregar as perguntas. Clique em Iniciar novamente.');
  }
}

/* Submit + devolutiva */
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
  box.appendChild(h('div',{class:'card p-6 prose max-w-none prose-invert'},
    h('h3',{class:'text-xl font-semibold mb-2'},'Devolutiva do Lumen'),
    h('pre',{class:'whitespace-pre-wrap leading-relaxed'}, d.devolutiva || '—')
  ));
  renderDownloadButtons(box);
  box.scrollIntoView({behavior:'smooth',block:'start'});
}

/* Limpar/APAGAR apenas a resposta ATUAL */
function clearCurrentAnswer(){
  const q = QUESTIONS[IDX]; if (!q) return;
  ANSWERS[q.id] = (q.kind==='checkbox') ? [] : '';
  const root = pickFormRoot();
  const section = root.querySelector('section'); if (!section) return;
  if (q.kind==='checkbox') {
    section.querySelectorAll(`input[type="checkbox"][name="${q.id}"]`).forEach(el=> el.checked = false);
  } else if (q.kind==='radio') {
    section.querySelectorAll(`input[type="radio"][name="${q.id}"]`).forEach(el=> el.checked = false);
  } else {
    const el = section.querySelector('#'+q.id); if (el) el.value = '';
  }
  updateProgressUI();
}

/* Login */
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
        startCountdown(); await bootQuestions(); return;
      }
    }
    const t = await getPublicToken();
    if (!t) throw new Error('Falha ao obter acesso. Tente novamente.');
    startCountdown(); await bootQuestions();
  } catch (e) {
    console.error('[Lumen] Auth erro:', e);
    alert(e.message || 'Falha ao validar acesso');
  } finally { btn.disabled = false; btn.textContent = original; }
}

/* Eventos globais */
document.addEventListener('click', (ev)=>{
  const t = ev.target; if (!t) return;

  const startBtn = pickStartButton();
  if (startBtn && (t===startBtn || t.closest('#btn-iniciar'))) { ev.preventDefault(); doLogin(); return; }

  const clearBtn = pickClearButton();
  const isClearClick =
    (clearBtn && (t===clearBtn || (CONFIG.CLEAR_BUTTON_SELECTOR && t.closest?.(CONFIG.CLEAR_BUTTON_SELECTOR)))) ||
    (t.tagName==='BUTTON' && CONFIG.CLEAR_TEXTS.some(txt=>t.textContent?.toLowerCase().includes(txt)));
  if (isClearClick) { ev.preventDefault(); clearCurrentAnswer(); return; }
});

/* sem boot automático pra não pular a tela de senha */
