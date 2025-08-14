/* jornada.js – v8.2
   - Tela de login sempre (FORCE_LOGIN)
   - Progresso (respondidas/total)
   - Validação das obrigatórias no botão Enviar (mostra faltantes)
   - Downloads com Authorization e tratamento de 404
*/
const CONFIG = {
  BUILD: '2025-08-14-2',
  BACKEND_URL: 'https://lumen-backend-api.onrender.com',

  // Controle de fluxo
  FORCE_LOGIN: true, // força clicar "Iniciar" antes de carregar perguntas

  // IDs (se existirem no HTML)
  PASSWORD_INPUT: '#senha-acesso',
  START_BUTTON: '#btn-iniciar',
  FORM_ROOT_SELECTOR: '#form-root',
  DEVOLUTIVA_SELECTOR: '#devolutiva',
  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial',
  PROGRESS_SELECTOR: '#icl-progress',

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
function pickProgress(){
  return document.querySelector(CONFIG.PROGRESS_SELECTOR) || (() => {
    const bar = h('div', { id: 'icl-progress', class: 'max-w-3xl mx-auto px-4 py-2 text-sm text-gray-300' }, '');
    const root = pickFormRoot();
    root.parentNode.insertBefore(bar, root);
    return bar;
  })();
}
function authHeaders(){ const t = store.get('icl:token'); return t ? { Authorization:`Bearer ${t}` } : {}; }

/* Estado em memória */
let QUESTIONS_META = []; // [{id, required, kind}, ...]
let TOTAL = 0;

/* --- Funções extras --- */

// Olho mágico
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

/* Progresso e validação */
function answeredCount(){
  const root = pickFormRoot();
  let count = 0;
  QUESTIONS_META.forEach(q => {
    const els = root.querySelectorAll(`[name="${q.id}"],#${q.id}`);
    let val = '';
    if (q.kind === 'checkbox') {
      const any = [...els].some(el => el.checked);
      if (any) count++;
    } else if (q.kind === 'radio') {
      const r = root.querySelector(`input[type="radio"][name="${q.id}"]:checked`);
      if (r) count++;
    } else {
      const el = els[0];
      if (el && (el.value || '').trim() !== '') count++;
    }
  });
  return count;
}

function missingRequired(){
  const root = pickFormRoot();
  const missing = [];
  QUESTIONS_META.forEach(q => {
    if (!q.required) return;
    const els = root.querySelectorAll(`[name="${q.id}"],#${q.id}`);
    let ok = false;
    if (q.kind === 'checkbox') {
      ok = [...els].some(el => el.checked);
    } else if (q.kind === 'radio') {
      ok = !!root.querySelector(`input[type="radio"][name="${q.id}"]:checked`);
    } else {
      const el = els[0];
      ok = !!(el && (el.value || '').trim());
    }
    if (!ok) missing.push(q.id);
  });
  return missing;
}

function updateProgressUI(){
  const bar = pickProgress();
  const done = answeredCount();
  bar.textContent = `Respondidas ${done}/${TOTAL}`;
  const btn = pickSendButton();
  if (!btn) return;
  const pend = missingRequired().length;
  if (pend > 0) {
    btn.disabled = false; // permite enviar mesmo assim? se quiser bloquear: true
    btn.textContent = `Enviar respostas (faltam ${pend})`;
  } else {
    btn.disabled = false;
    btn.textContent = 'Enviar respostas';
  }
}

/* Render */
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

/* API */
async function fetchQuestions() {
  // Não chama ensureToken aqui se FORCE_LOGIN=true — o login cuidará do token
  let r = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`, { headers: { ...authHeaders() } });
  if (r.status === 401 || r.status === 403) {
    // se quiser fallback automático mesmo sem login, desative FORCE_LOGIN
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

function renderQuestions(root, payload){
  QUESTIONS_META = payload.questions.map(q => ({ id: q.id, required: !!q.required, kind: q.kind }));
  TOTAL = payload.questions.length
