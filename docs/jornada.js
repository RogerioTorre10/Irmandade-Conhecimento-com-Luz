
/* =========================
   Jornada Essencial (v9 estável para GitHub Pages)
   - Intro + senha "iniciar"
   - Perguntas com salvamento em localStorage
   - Botão único: Baixar PDF + HQ (sequencial)
   - Ao finalizar: limpa dados, mensagem e volta para home
========================= */

const CONFIG = {
  API_BASE: 'https://conhecimento-com-luz-api.onrender.com',
  PASSWORD: 'iniciar',
  STORAGE_KEY: 'jornada_v9_respostas',
  VERSION: '9.1-pages'
};

const state = {
  step: 'intro', // intro | form | review | done
  answers: {},
};

// Perguntas (exemplo enxuto — substitua pela lista completa quando desejar)
const QUESTIONS = [
  { id: 'q1', label: 'Quem é você hoje? (uma frase que te represente)', type: 'text' },
  { id: 'q2', label: 'Qual foi a maior superação da sua vida?', type: 'textarea' },
  { id: 'q3', label: 'O que você quer transformar nos próximos 90 dias?', type: 'text' }
];

const $ = (s) => document.querySelector(s);
const app = $('#app');

function saveLocal() {
  localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.answers));
}
function loadLocal() {
  try {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (raw) state.answers = JSON.parse(raw) || {};
  } catch {}
}
function clearLocal() {
  localStorage.removeItem(CONFIG.STORAGE_KEY);
  state.answers = {};
}

function inputField(q) {
  const v = state.answers[q.id] || '';
  if (q.type === 'textarea') {
    return `<textarea class="input" rows="4" data-id="${q.id}">${v}</textarea>`;
  }
  return `<input class="input" type="text" data-id="${q.id}" value="${v}">`;
}

// Render
function render() {
  if (state.step === 'intro') return renderIntro();
  if (state.step === 'form') return renderForm();
  if (state.step === 'review') return renderReview();
  if (state.step === 'done') return renderDone();
}

function renderIntro() {
  app.innerHTML = `
    <section class="card">
      <h1 class="text-2xl font-bold">Jornada Conhecimento com Luz · Essencial</h1>
      <p class="small mt-2">Esta é uma jornada pessoal, simbólica e inspiradora. Ao final, você poderá baixar um PDF com a devolutiva e a HQ.</p>

      <div class="mt-6 space-y-3">
        <label class="small">Senha de acesso</label>
        <input id="pwd" class="input" type="password" placeholder="Digite a senha e clique em Iniciar">
        <p id="msg" class="small"></p>
        <div class="mt-4 flex gap-3">
          <button id="btnStart" class="btn">Iniciar</button>
          <a href="./" class="small underline">Voltar</a>
        </div>
      </div>
    </section>
  `;

  $('#btnStart').addEventListener('click', () => {
    const val = $('#pwd').value.trim().toLowerCase();
    if (val === CONFIG.PASSWORD) {
      state.step = 'form';
      render();
    } else {
      $('#msg').textContent = 'Senha inválida. Tente novamente.';
    }
  });
}

function renderForm() {
  loadLocal();
  const items = QUESTIONS.map(q => `
    <div class="space-y-2">
      <label class="block font-medium">${q.label}</label>
      ${inputField(q)}
    </div>
  `).join('\n');

  app.innerHTML = `
    <section class="card space-y-6">
      <header class="flex items-center justify-between">
        <h2 class="text-xl font-semibold">Responda com calma</h2>
        <span class="small">Versão ${CONFIG.VERSION}</span>
      </header>
      ${items}
      <div class="flex flex-wrap gap-3 pt-2">
        <button id="btnReview" class="btn">Revisar</button>
        <button id="btnClear" class="btn" style="background:#334155">Limpar respostas</button>
      </div>
    </section>
  `;

  app.querySelectorAll('[data-id]').forEach(el => {
    el.addEventListener('input', (e) => {
      const id = e.target.getAttribute('data-id');
      state.answers[id] = e.target.value;
      saveLocal();
    });
  });

  $('#btnClear').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar TODAS as respostas?')) {
      clearLocal();
      renderForm();
    }
  });

  $('#btnReview').addEventListener('click', () => {
    state.step = 'review';
    render();
  });
}

function renderReview() {
  const list = QUESTIONS.map(q => `
    <div class="space-y-1">
      <div class="small">${q.label}</div>
      <div class="p-3 rounded bg-slate-900/60 border border-white/5">${(state.answers[q.id]||'').replace(/\n/g,'<br>')}</div>
    </div>
  `).join('\n');

  app.innerHTML = `
    <section class="card space-y-6">
      <h2 class="text-xl font-semibold">Revise suas respostas</h2>
      ${list}
      <div id="status" class="small"></div>
      <div class="flex flex-wrap gap-3 pt-2">
        <button id="btnBack" class="btn" style="background:#334155">Voltar</button>
        <button id="btnSend" class="btn">Baixar PDF + HQ</button>
      </div>
    </section>
  `;

  $('#btnBack').addEventListener('click', () => {
    state.step = 'form';
    render();
  });

  $('#btnSend').addEventListener('click', async () => {
    await sendAndDownload();
  });
}

function renderDone() {
  app.innerHTML = `
    <section class="card space-y-3 text-center">
      <h2 class="text-2xl font-bold">Parabéns! Você finalizou a jornada.</h2>
      <p class="small">Você será redirecionado para a página inicial.</p>
    </section>
  `;
}

// Envio + download sequencial
async function sendAndDownload() {
  const el = $('#status');
  el.textContent = 'Gerando sua devolutiva (PDF e HQ)...';

  // 1) PDF
  try {
    const payload = { answers: state.answers, meta: { version: CONFIG.VERSION, ts: new Date().toISOString() } };
    const pdfResp = await fetch(`${CONFIG.API_BASE}/gerar-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf'
      },
      body: JSON.stringify(payload)
    });
    if (!pdfResp.ok) throw new Error('Falha ao gerar PDF');
    const pdfBlob = await pdfResp.blob();
    triggerDownload(pdfBlob, `Jornada-Conhecimento-com-Luz.pdf`);
    el.textContent = 'PDF concluído. Gerando HQ...';
  } catch (e) {
    el.textContent = 'Não foi possível gerar o PDF. Tente novamente em instantes.';
    console.error(e);
    return;
  }

  // 2) HQ
  try {
    const hqResp = await fetch(`${CONFIG.API_BASE}/gerar-hq`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/pdf'
      },
      body: JSON.stringify({ answers: state.answers })
    });
    if (!hqResp.ok) throw new Error('Falha ao gerar HQ');
    const hqBlob = await hqResp.blob();
    triggerDownload(hqBlob, `Jornada-Conhecimento-com-Luz-HQ.pdf`);
    el.textContent = 'HQ concluída. Limpando dados...';
  } catch (e) {
    el.textContent = 'PDF ok, mas houve falha ao gerar a HQ. Você pode tentar novamente mais tarde.';
    console.error(e);
  }

  clearLocal();
  state.step = 'done';
  render();
  setTimeout(() => window.location.href = './', 2200);
}

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Boot
(function init(){
  loadLocal();
  render();
})();
