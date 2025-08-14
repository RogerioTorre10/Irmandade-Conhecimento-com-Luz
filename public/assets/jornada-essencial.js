/* jornada.js – 13-08-2025
 * Fluxo completo com:
 * - Anti-cache
 * - Login por senha -> token (24h)
 * - Carregar perguntas autorizadas
 * - Remover "Enviar agora" do bloco final
 * - Contador local/global
 * - Enviar respostas -> devolutiva
 * - PDF local (respostas + devolutiva)
 */

const CONFIG = {
  BUILD: '2025-08-13-5',

  BACKEND_URL: 'https://conhecimento-com-luz-api.onrender.com',

  // Login
  PASSWORD_INPUT: '#senha-acesso',      // <input id="senha-acesso">
  PASSWORD_TOGGLE: '#toggle-senha',     // (opcional) <button id="toggle-senha">👁</button>
  START_BUTTON: '#btn-iniciar',         // <button id="btn-iniciar">Iniciar</button>
  STATUS_BOX: '#status-login',          // <div id="status-login"></div> (opcional)

  // Form / Devolutiva
  FORM_ROOT_SELECTOR: '#form-root',     // <div id="form-root"></div>
  DEVOLUTIVA_SELECTOR: '#devolutiva',   // <div id="devolutiva"></div>
  SEND_BUTTON_SELECTOR: '#btn-enviar-oficial',
  DOWNLOAD_BUTTON_SELECTOR: '#btn-download-local',

  // Bloco final
  FINAL_SECTION_SELECTOR: '#final-da-jornada',
  OLD_SEND_BUTTON_SELECTOR: '#btn-enviar-agora',
  REVIEW_BUTTON_SELECTOR: '#btn-revisar',

  // Contadores
  LOCAL_COUNTER_SELECTOR: '#visit-counter',
  GLOBAL_COUNTER_SELECTOR: '#visit-counter-global',
};

/* 0) Util */
const store = {
  set(k, v){ sessionStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); },
  get(k){ const v = sessionStorage.getItem(k); try { return JSON.parse(v); } catch { return v; } },
  del(k){ sessionStorage.removeItem(k); }
};
function isoToMs(iso){ return Date.parse(iso); }

/* 1) Anti-cache */
(function buildGuard() {
  try {
    const KEY = 'icl:build';
    if (localStorage.getItem(KEY) !== CONFIG.BUILD) {
      localStorage.setItem(KEY, CONFIG.BUILD);
      const url = new URL(window.location.href);
      url.searchParams.set('v', CONFIG.BUILD);
      window.location.replace(url.toString());
    }
  } catch (_) {}
})();

/* 2) Limpeza do bloco final + olho mágico seguro */
document.addEventListener('DOMContentLoaded', () => {
  try {
    document.querySelectorAll(CONFIG.OLD_SEND_BUTTON_SELECTOR).forEach(el => el.remove());
    const finalSection = document.querySelector(CONFIG.FINAL_SECTION_SELECTOR);
    if (finalSection) {
      finalSection.querySelectorAll('button, a').forEach(el => {
        const txt = (el.textContent || '').trim().toLowerCase();
        const isRevisar = el.matches(CONFIG.REVIEW_BUTTON_SELECTOR);
        const pareceEnviar = txt.includes('enviar agora') || /\benviar\b/.test(txt) || el.id === 'btn-enviar-agora';
        if (pareceEnviar && !isRevisar) el.remove();
      });
    }
  } catch (e) { console.warn('Cleanup warning:', e); }

  // Olho mágico NÃO quebra o app se faltar qualquer elemento
  try {
    const input = document.querySelector(CONFIG.PASSWORD_INPUT);
    const toggle = document.querySelector(CONFIG.PASSWORD_TOGGLE);
    if (input && toggle) {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        input.type = (input.type === 'password' ? 'text' : 'password');
      });
    }
  } catch (e) { console.warn('Eye toggle warning:', e); }
});

/* 3) Contadores */
(function localVisitCounter() {
  try {
    const els = document.querySelectorAll(CONFIG.LOCAL_COUNTER_SELECTOR);
    if (!els.length) return;
    const KEY = 'icl:visits';
    const n = (parseInt(localStorage.getItem(KEY) || '0', 10) + 1);
    localStorage.setItem(KEY, String(n));
    els.forEach(el => (el.textContent = n.toLocaleString('pt-BR')));
  } catch (e) {
    console.warn('Local counter warning:', e);
  }
})();
(async function globalVisitCounter() {
  const els = document.querySelectorAll(CONFIG.GLOBAL_COUNTER_SELECTOR);
  if (!els.length) return;
  try {
    const res = await fetch(`${CONFIG.BACKEND_URL}/metrics/visit`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ at: Date.now() }),
    });
    const data = await res.json();
    const total = (data && data.ok) ? Number(data.total || 0) : null;
    els.forEach(el => (el.textContent = (total === null ? '—' : total.toLocaleString('pt-BR'))));
    if (total !== null) els.forEach(el => el.setAttribute('data-backend', data.backend || 'unknown'));
  } catch (e) {
    console.warn('Global counter error:', e);
    els.forEach(el => (el.textContent = '—'));
  }
})();

/* 4) Login / Token */
async function doLogin() {
  const input = document.querySelector(CONFIG.PASSWORD_INPUT);
  const btn = document.querySelector(CONFIG.START_BUTTON);
  const status = document.querySelector(CONFIG.STATUS_BOX);
  if (!input || !btn) return;

  const pwd = (input.value || '').trim();
  if (!pwd) { status && (status.textContent = 'Digite a senha.'); return; }

  try {
    btn.disabled = true; btn.textContent = 'Validando…';
    const res = await fetch(`${CONFIG.BACKEND_URL}/auth/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Senha inválida');
    }
    const data = await res.json(); // {ok, token, deadline_iso, ...}
    store.set('icl:token', data.token);
    store.set('icl:deadline', data.deadline_iso);
    status && (status.textContent = `Acesso liberado até ${new Date(isoToMs(data.deadline_iso)).toLocaleString('pt-BR')}`);
    await bootQuestions(); // carrega perguntas após login
  } catch (e) {
    status && (status.textContent = (e.message || 'Falha ao validar senha'));
  } finally {
    btn.disabled = false; btn.textContent = 'Iniciar';
  }
}
document.addEventListener('click', (ev) => {
  const t = ev.target;
  if (t && t.closest(CONFIG.START_BUTTON)) {
    ev.preventDefault();
    doLogin();
  }
});

/* 5) Fetch helpers com Authorization */
function authHeaders() {
  const token = store.get('icl:token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}
async function authedGet(url) {
  const res = await fetch(url, { headers: { ...authHeaders() } });
  if (res.status === 401 || res.status === 403) throw new Error('Sessão inválida/expirada');
  if (!res.ok) throw new Error('Falha na requisição');
  return res.json();
}
async function authedPost(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(body || {}),
  });
  if (res.status === 401 || res.status === 403) throw new Error('Sessão inválida/expirada');
  if (!res.ok) throw new Error('Falha na requisição');
  return res.json();
}

/* 6) Perguntas dinâmicas */
async function fetchQuestions() {
  return authedGet(`${CONFIG.BACKEND_URL}/jornada/questions`);
}
function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (k === 'class') el.className = v;
    else if (k === 'for') el.htmlFor = v;
    else el.setAttribute(k, v);
  });
  children.flat().forEach(c => {
    if (c == null) return;
    if (typeof c === 'string') el.appendChild(document.createTextNode(c));
    else el.appendChild(c);
  });
  return el;
}
function renderQuestions(root, payload) {
  root.innerHTML = '';
  const form = h('form', { id: 'form-jornada', class: 'space-y-6' });
  let currentSection = null;
  let sectionEl = null;

  payload.questions.forEach(q => {
    if (q.section && q.section !== currentSection) {
      currentSection = q.section;
      sectionEl = h('section', { class: 'bg-white rounded-2xl shadow p-6' },
        h('h2', { class: 'text-xl font-semibold mb-4' }, currentSection),
      );
      form.appendChild(sectionEl);
    }
    const container = sectionEl || form;
    const fieldWrap = h('div', { class: 'mb-4' });
    fieldWrap.appendChild(h('label', { class: 'block text-sm text-gray-700', for: q.id }, q.label));
    if (q.help) fieldWrap.appendChild(h('div', { class: 'text-xs text-gray-500 mt-1' }, q.help));

    let inputEl;
    const base = { id: q.id, name: q.id, class: 'mt-1 w-full rounded-xl border-gray-300' };
    switch (q.kind) {
      case 'text':     inputEl = h('input', { ...base, type: 'text', placeholder: q.placeholder || '' }); break;
      case 'textarea': inputEl = h('textarea', { ...base, rows: '3', placeholder: q.placeholder || '' }); break;
      case 'select':
        inputEl = h('select', base,
          h('option', { value: '' }, 'Selecione…'),
          ...(q.options || []).map(o => h('option', { value: o.value }, o.label)),
        ); break;
      case 'radio':
        inputEl = h('div', { class: 'mt-1 flex flex-wrap gap-3' },
          ...(q.options || []).map(o =>
            h('label', { class: 'inline-flex items-center gap-2' },
              h('input', { type: 'radio', name: q.id, value: o.value }), o.label
            ))); break;
      case 'checkbox':
        inputEl = h('div', { class: 'mt-1 flex flex-wrap gap-3' },
          ...(q.options || []).map(o =>
            h('label', { class: 'inline-flex items-center gap-2' },
              h('input', { type: 'checkbox', name: q.id, value: o.value }), o.label
            ))); break;
      default:         inputEl = h('input', { ...base, type: 'text', placeholder: q.placeholder || '' });
    }
    fieldWrap.appendChild(inputEl);
    container.appendChild(fieldWrap);
  });

  root.appendChild(form);
}

/* 7) Envio + devolutiva */
function collectAnswers(formRoot = document) {
  const answers = {};
  formRoot.querySelectorAll('input, textarea, select').forEach((el) => {
    const name = el.name || el.id; if (!name) return;
    if (el.type === 'checkbox') { answers[name] = answers[name] || []; if (el.checked) answers[name].push(el.value || true); }
    else if (el.type === 'radio') { if (el.checked) answers[name] = el.value; else if (!(name in answers)) answers[name] = ''; }
    else { answers[name] = el.value; }
  });
  return answers;
}
async function submitAnswers() {
  const root = document.querySelector(CONFIG.FORM_ROOT_SELECTOR);
  if (!root) throw new Error('FORM_ROOT não encontrado');
  const answers = collectAnswers(root);
  const meta = { tzOffsetMin: new Date().getTimezoneOffset(), userAgent: navigator.userAgent };
  const data = await authedPost(`${CONFIG.BACKEND_URL}/jornada/submit`, { answers, meta });

  const box = document.querySelector(CONFIG.DEVOLUTIVA_SELECTOR);
  if (box) {
    box.innerHTML = '';
    box.appendChild(
      h('div', { class: 'bg-white rounded-2xl shadow p-6 prose max-w-none' },
        h('h3', { class: 'text-xl font-semibold mb-2' }, 'Devolutiva do Lumen'),
        h('pre', { class: 'whitespace-pre-wrap leading-relaxed' }, data.devolutiva || '—')
      )
    );
    box.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* 8) PDF local (respostas + devolutiva) */
async function ensureJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
  });
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  throw new Error('jsPDF não disponível');
}
function chunkText(text, maxLen = 95) {
  const lines = []; let i = 0;
  while (i < text.length) { lines.push(text.slice(i, i + maxLen)); i += maxLen; }
  return lines;
}
function serializeAll(root = document) {
  const answers = collectAnswers(root);
  const devolutiva = (document.querySelector(`${CONFIG.DEVOLUTIVA_SELECTOR} pre`)?.textContent || '').trim();
  return { answers, devolutiva };
}
async function downloadPDFLocal(filename = null) {
  const jsPDF = await ensureJsPDF();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40, marginY = 50; let y = marginY;

  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('Jornada Conhecimento com Luz — Respostas e Devolutiva', marginX, y); y += 24;

  const { answers, devolutiva } = serializeAll(document);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(11);

  let idx = 1;
  Object.entries(answers).forEach(([k, v]) => {
    const label = `${idx++}. ${k}`;
    const value = Array.isArray(v) ? v.join(', ') : String(v || '');
    for (const ln of chunkText(label, 95)) { if (y > 780) { doc.addPage(); y = marginY; } doc.text(ln, marginX, y); y += 16; }
    for (const ln of chunkText(value, 95)) { if (y > 780) { doc.addPage(); y = marginY; } doc.text(`→ ${ln}`, marginX, y); y += 14; }
    y += 10;
  });

  if (devolutiva) {
    if (y > 760) { doc.addPage(); y = marginY; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('Devolutiva do Lumen', marginX, y); y += 20;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    for (const ln of chunkText(devolutiva, 95)) { if (y > 780) { doc.addPage(); y = marginY; } doc.text(ln, marginX, y); y += 14; }
  }

  const when = new Date(); const offset = -when.getTimezoneOffset() / 60;
  const footer = `Gerado localmente • ${when.toLocaleString('pt-BR')} (UTC${offset >= 0 ? '+' + offset : offset})`;
  if (y > 780) { doc.addPage(); y = marginY; }
  doc.setFontSize(10); doc.text(footer, marginX, y + 10);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = filename || `Jornada-Conhecimento-com-Luz_${ts}.pdf`;
  doc.save(name);
}

/* 9) Botões principais */
document.addEventListener('click', async (ev) => {
  const t = ev.target; if (!t) return;

  // Enviar respostas
  if (t.closest(CONFIG.SEND_BUTTON_SELECTOR)) {
    ev.preventDefault();
    const btn = t.closest(CONFIG.SEND_BUTTON_SELECTOR);
    const original = btn.textContent;
    try { btn.textContent = 'Enviando…'; await submitAnswers(); }
    catch (e) { console.error(e); alert('Falha ao enviar respostas. Faça login novamente.'); }
    finally { btn.textContent = original; }
    return;
  }

  // Baixar PDF local
  if (t.closest(CONFIG.DOWNLOAD_BUTTON_SELECTOR)) {
    ev.preventDefault();
    const btn = t.closest(CONFIG.DOWNLOAD_BUTTON_SELECTOR);
    const original = btn.textContent;
    try { btn.textContent = 'Gerando PDF…'; await downloadPDFLocal(); }
    catch (e) { console.error(e); btn.textContent = 'Falha ao gerar'; setTimeout(() => (btn.textContent = original), 1500); window.print(); return; }
    btn.textContent = original;
  }
});

/* 10) Boot: se token válido, carrega perguntas automaticamente */
async function bootQuestions() {
  const deadline = store.get('icl:deadline');
  if (!deadline || Date.now() > isoToMs(deadline)) {
    store.del('icl:token'); store.del('icl:deadline');
    return; // exige login
  }
  const root = document.querySelector(CONFIG.FORM_ROOT_SELECTOR);
  if (!root) return;
  const payload = await fetchQuestions();
  renderQuestions(root, payload);
}
(async function boot() {
  try { await bootQuestions(); } catch (e) { /* usuário ainda não logou */ }
})();
