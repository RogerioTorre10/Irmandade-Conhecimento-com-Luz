/* =========================================================
   Jornada v9.2 (pages) — passo-a-passo + revisão + download
   ========================================================= */

const CONFIG = {
  // ---> ajuste se o nome do serviço mudar
  API_BASE: 'https://lumen-backend-api.onrender.com'
};

// Helpers DOM
const $ = (sel) => document.querySelector(sel);

// Estado simples
const state = {
  step: 'form',         // form | review | done
  idx: 0,               // índice da pergunta atual
  answers: {},
  version: '9.2-pages'
};

// Modelo de perguntas
const QUESTIONS = [
  { id: 'Quem é você hoje? (uma frase que te represente)', key: 'q1', type: 'text' },
  { id: 'Qual foi a maior superação da sua vida?',       key: 'q2', type: 'textarea' },
  { id: 'O que você quer transformar nos próximos 90 dias?', key: 'q3', type: 'text' }
];

// Persistência local
const STORAGE_KEY = 'jornada_v92_respostas';
function saveLocal() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state.answers)); }
function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.answers = raw ? JSON.parse(raw) : {};
  } catch {
    state.answers = {};
  }
}
function clearLocal() {
  localStorage.removeItem(STORAGE_KEY);
  state.answers = {};
}

// Render raiz
const app = $('#app');
function render() {
  if (state.step === 'form')   return renderFormStep();
  if (state.step === 'review') return renderReview();
  if (state.step === 'done')   return renderDone();
}

// Form: pergunta atual
function renderFormStep() {
  loadLocal();
  const total = QUESTIONS.length;
  const q = QUESTIONS[state.idx];

  const value = state.answers[q.key] || '';
  const isText = q.type !== 'textarea';

  app.innerHTML = `
    <section class="space-y">
      <div class="pergaminho">
        <div class="progress-dots">
          ${Array.from({length: total}).map((_,i) =>
            `<span class="dot ${i===state.idx?'active':''}"></span>`).join('')}
        </div>

        <h2 class="titulo-perg">${q.id}</h2>

        <label class="form-label" for="inp">Sua resposta</label>
        ${ isText
            ? `<input id="inp" class="input" type="text" value="${escapeHtml(value)}" placeholder="Digite aqui...">`
            : `<textarea id="inp" class="input textarea" rows="5" placeholder="Escreva com calma...">${escapeHtml(value)}</textarea>`
        }

        <div class="actions">
          <button id="btnPrev" class="btn" style="background:#334155">Voltar</button>
          <button id="btnClear" class="btn" style="background:#334155">Limpar</button>
          <button id="btnNext" class="btn">${state.idx < total-1 ? 'Próxima' : 'Revisar'}</button>
        </div>
      </div>
      <p id="status" class="muted small"></p>
    </section>
  `;

  // listeners
  $('#btnPrev').addEventListener('click', () => {
    if (state.idx > 0) { saveCurrent(); state.idx--; renderFormStep(); }
  });

  $('#btnClear').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar TODAS as respostas?')) {
      clearLocal();
      state.idx = 0;
      renderFormStep();
    }
  });

  $('#btnNext').addEventListener('click', () => {
    saveCurrent();
    if (state.idx < total-1) {
      state.idx++;
      renderFormStep();
    } else {
      state.step = 'review';
      render();
    }
  });

  function saveCurrent() {
    const v = $('#inp').value.trim();
    state.answers[q.key] = v;
    saveLocal();
  }
}

// Review
async function baixarTudo(){
  const statusEl = document.querySelector('#status');
  const btn = document.querySelector('#btnDownload');
  try{
    if(btn){ btn.disabled = true; btn.textContent = 'Gerando...'; }
    if(statusEl){ statusEl.textContent = ''; }

    const payload = { answers: state.answers, meta: { version: state.version } };

    // PDF
    const pdfResp = await fetch(`${CONFIG.API_BASE}/gerar-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
      body: JSON.stringify(payload)
    });
    if(!pdfResp.ok) throw new Error('Falha ao gerar PDF');
    await baixarComoArquivo(await pdfResp.blob(), 'jornada.pdf');

    // HQ (no backend atual retorna PDF placeholder)
    const hqResp = await fetch(`${CONFIG.API_BASE}/gerar-hq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
      body: JSON.stringify(payload)
    });
    if(!hqResp.ok) throw new Error('Falha ao gerar HQ');
    await baixarComoArquivo(await hqResp.blob(), 'jornada-hq.pdf');

    if(statusEl){ statusEl.textContent = 'Arquivos gerados com sucesso. 🙏'; }
  }catch(err){
    console.error(err);
    if(statusEl){ statusEl.textContent = 'Não foi possível gerar os arquivos. Tente novamente.'; }
  }finally{
    if(btn){ btn.disabled = false; btn.textContent = 'Baixar PDF + HQ'; }
  }
}

function renderReview() {
  loadLocal();
  app.innerHTML = `
    <section class="pergaminho review-card">
      <h2 class="titulo-perg">Revise suas respostas</h2>

      ${QUESTIONS.map(q => `
        <div class="field">
          <label class="form-label">${q.id}</label>
          <input class="input" type="text" value="${escapeHtml(state.answers[q.key] || '')}" readonly />
        </div>
      `).join('')}

      <p id="status" class="muted small"></p>

      <div class="actions">
        <button id="btnBack" class="btn" style="background:#334155">Voltar</button>
        <button id="btnDownload" class="btn">Baixar PDF + HQ</button>
        <button id="btnFinish" class="btn" style="background:#6b21a8">Finalizar</button>
      </div>
    </section>
  `;

  $('#btnBack').addEventListener('click', () => {
    state.step = 'form';
    render();
  });

  const baixarTudo = async () => {
    try {
      $('#btnDownload').disabled = true;
      $('#btnDownload').textContent = 'Gerando...';

      const payload = { answers: state.answers, meta: { version: state.version } };

      // PDF
      const pdfResp = await fetch(`${CONFIG.API_BASE}/gerar-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
        body: JSON.stringify(payload)
      });
      if (!pdfResp.ok) throw new Error('Falha ao gerar PDF');
      await baixarComoArquivo(await pdfResp.blob(), 'jornada.pdf');

      // HQ (placeholder PDF por enquanto)
      const hqResp = await fetch(`${CONFIG.API_BASE}/gerar-hq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
        body: JSON.stringify(payload)
      });
      if (!hqResp.ok) throw new Error('Falha ao gerar HQ');
      await baixarComoArquivo(await hqResp.blob(), 'jornada-hq.pdf');

      $('#status').textContent = 'Arquivos gerados com sucesso. Obrigado!';
    } catch (e) {
      console.error(e);
      $('#status').textContent = 'Não foi possível gerar os arquivos. Tente novamente.';
    } finally {
      $('#btnDownload').disabled = false;
      $('#btnDownload').textContent = 'Baixar PDF + HQ';
    }
  };

  $('#btnDownload').addEventListener('click', baixarTudo);

  // Finalizar: baixa e volta à home
  $('#btnFinish').addEventListener('click', async () => {
    await baixarTudo();
    window.location.href = './';
  });
}

// Final
function renderDone() {
  app.innerHTML = `
    <section class="card text-center">
      <h2>Gratidão ✨</h2>
      <p>Sua jornada foi concluída.</p>
      <a class="btn" href="./">Voltar ao início</a>
    </section>
  `;
}

// Utils
function escapeHtml(s='') {
  return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
}
async function baixarComoArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// Start
render();
