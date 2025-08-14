/* jornada.js
 * 13-08-2025 — Build anti-cache + remover "Enviar agora" + contador local/global
 * + carregar 32 perguntas do backend + enviar respostas + devolutiva + PDF local
 */

const CONFIG = {
  BUILD: '2025-08-13-4', // << atualize ao publicar

  // Backend
  BACKEND_URL: 'https://conhecimento-com-luz-api.onrender.com',

  // Áreas do HTML
  FORM_ROOT_SELECTOR: '#form-root',        // <div id="form-root"></div>
  DEVOLUTIVA_SELECTOR: '#devolutiva',      // <div id="devolutiva"></div>

  // Botões fixos
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

/* 2) Limpeza do bloco final / botão antigo */
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
  } catch (e) {
    console.warn('Cleanup final section warning:', e);
  }
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
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

/* 4) Perguntas dinâmicas */
async function fetchQuestions() {
  const res = await fetch(`${CONFIG.BACKEND_URL}/jornada/questions`);
  if (!res.ok) throw new Error('Falha ao obter perguntas do backend');
  return res.json();
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
    const labelEl = h('label', { class: 'block text-sm text-gray-700', for: q.id }, q.label);
    fieldWrap.appendChild(labelEl);
    if (q.help) fieldWrap.appendChild(h('div', { class: 'text-xs text-gray-500 mt-1' }, q.help));

    let inputEl;
    const baseAttrs = { id: q.id, name: q.id, class: 'mt-1 w-full rounded-xl border-gray-300' };
    switch (q.kind) {
      case 'text':
        inputEl = h('input', { ...baseAttrs, type: 'text', placeholder: q.placeholder || '' });
        break;
      case 'textarea':
        inputEl = h('textarea', { ...baseAttrs, rows: '3', placeholder: q.placeholder || '' });
        break;
      case 'select':
        inputEl = h('select', baseAttrs,
          h('option', { value: '' }, 'Selecione…'),
          ...(q.options || []).map(o => h('option', { value: o.value }, o.label)),
        );
        break;
      case 'radio':
        inputEl = h('div', { class: 'mt-1 flex flex-wrap gap-3' },
          ...(q.options || []).map(o =>
            h('label', { class: 'inline-flex items-center gap-2' },
              h('input', { type: 'radio', name: q.id, value: o.value }),
              o.label
            )
          )
        );
        break;
      case 'checkbox':
        inputEl = h('div', { class: 'mt-1 flex flex-wrap gap-3' },
          ...(q.options || []).map(o =>
            h('label', { class: 'inline-flex items-center gap-2' },
              h('input', { type: 'checkbox', name: q.id, value: o.value }),
              o.label
            )
          )
        );
        break;
      default:
        inputEl = h('input', { ...baseAttrs, type: 'text', placeholder: q.placeholder || '' });
    }
    fieldWrap.appendChild(inputEl);
    container.appendChild(fieldWrap);
  });

  root.appendChild(form);
}

/* 5) Envio + devolutiva */
function collectAnswers(formRoot = document) {
  const answers = {};
  const inputs = formRoot.querySelectorAll('input, textarea, select');
  inputs.forEach((el) => {
    const name = el.name || el.id;
    if (!name) return;
    if (el.type === 'checkbox') {
      answers[name] = answers[name] || [];
      if (el.checked) answers[name].push(el.value || true);
    } else if (el.type === 'radio') {
      if (el.checked) answers[name] = el.value;
      else if (!(name in answers)) answers[name] = '';
    } else {
      answers[name] = el.value;
    }
  });
  return answers;
}

async function submitAnswers() {
  const root = document.querySelector(CONFIG.FORM_ROOT_SELECTOR);
  if (!root) throw new Error('FORM_ROOT não encontrado');
  const answers = collectAnswers(root);
  const meta = { tzOffsetMin: new Date().getTimezoneOffset(), userAgent: navigator.userAgent };

  const res = await fetch(`${CONFIG.BACKEND_URL}/jornada/submit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answers, meta }),
  });
  if (!res.ok) throw new Error('Falha ao enviar respostas');
  const data = await res.json();

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

/* 6) PDF local com respostas + devolutiva */
async function ensureJsPDF() {
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  await new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
  if (window.jspdf && window.jspdf.jsPDF) return window.jspdf.jsPDF;
  throw new Error('jsPDF não disponível');
}

function chunkText(text, maxLen = 95) {
  const lines = [];
  let i = 0;
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

  const marginX = 40;
  const marginY = 50;
  let cursorY = marginY;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('Jornada Conhecimento com Luz — Respostas e Devolutiva', marginX, cursorY);
  cursorY += 24;

  const { answers, devolutiva } = serializeAll(document);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  let idx = 1;
  Object.entries(answers).forEach(([k, v]) => {
    const label = `${idx++}. ${k}`;
    const value = Array.isArray(v) ? v.join(', ') : String(v || '');
    const labelLines = chunkText(label, 95);
    const valueLines = chunkText(value, 95);

    labelLines.forEach((ln) => {
      if (cursorY > 780) { doc.addPage(); cursorY = marginY; }
      doc.text(ln, marginX, cursorY); cursorY += 16;
    });
    valueLines.forEach((ln) => {
      if (cursorY > 780) { doc.addPage(); cursorY = marginY; }
      doc.text(`→ ${ln}`, marginX, cursorY); cursorY += 14;
    });
    cursorY += 10;
  });

  if (devolutiva) {
    if (cursorY > 760) { doc.addPage(); cursorY = marginY; }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
    doc.text('Devolutiva do Lumen', marginX, cursorY); cursorY += 20;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(11);
    const devLines = chunkText(devolutiva, 95);
    devLines.forEach((ln) => {
      if (cursorY > 780) { doc.addPage(); cursorY = marginY; }
      doc.text(ln, marginX, cursorY); cursorY += 14;
    });
  }

  const when = new Date();
  const offset = -when.getTimezoneOffset() / 60;
  const footer = `Gerado localmente • ${when.toLocaleString('pt-BR')} (UTC${offset >= 0 ? '+' + offset : offset})`;
  if (cursorY > 780) { doc.addPage(); cursorY = marginY; }
  doc.setFontSize(10); doc.text(footer, marginX, cursorY + 10);

  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const name = filename || `Jornada-Conhecimento-com-Luz_${ts}.pdf`;
  doc.save(name);
}

/* 7) Wire dos botões */
document.addEventListener('click', async (ev) => {
  const t = ev.target;
  if (!t) return;

  const sendBtn = t.closest(CONFIG.SEND_BUTTON_SELECTOR);
  if (sendBtn) {
    ev.preventDefault();
    const original = sendBtn.textContent;
    try { sendBtn.textContent = 'Enviando…'; await submitAnswers(); }
    catch (e) { console.error(e); alert('Falha ao enviar respostas. Tente novamente.'); }
    finally { sendBtn.textContent = original; }
    return;
  }

  const pdfBtn = t.closest(CONFIG.DOWNLOAD_BUTTON_SELECTOR);
  if (pdfBtn) {
    ev.preventDefault();
    const original = pdfBtn.textContent;
    try { pdfBtn.textContent = 'Gerando PDF…'; await downloadPDFLocal(); }
    catch (e) { console.error(e); pdfBtn.textContent = 'Falha ao gerar'; setTimeout(() => (pdfBtn.textContent = original), 1500); window.print(); return; }
    pdfBtn.textContent = original;
  }
});

/* 8) Boot */
(async function boot() {
  try {
    const root = document.querySelector(CONFIG.FORM_ROOT_SELECTOR);
    if (!root) return;
    const payload = await fetchQuestions();
    renderQuestions(root, payload);
  } catch (e) {
    console.error('Falha ao carregar perguntas:', e);
  }
})();
