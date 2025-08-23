/* =========================================================
 * Jornada Conhecimento com Luz – UNIFICADA v9.3
 * - Lógica em um único arquivo p/ evitar conflitos.
 * - Corrige revisão (textarea da q2).
 * - Migra storage antigo se existir.
 * - API_BASE ajustável em um lugar.
 * =======================================================*/

const CONFIG = {
  // >>> Ajuste aqui se necessário:
  API_BASE: 'https://lumen-backend-api.onrender.com',
  STORAGE_KEY: 'jornada_v9_respostas',
  VERSION: '9.3',
};

const $ = (s) => document.querySelector(s);
const app = $('#app');
if (!app) {
  console.error('[Jornada] #app não encontrado no HTML.');
}

/* ---------------- Perguntas (exemplo Essencial) ---------------- */
const QUESTIONS = [
  { id: 'q1', label: 'Quem é você hoje? (uma frase que te represente)', type: 'text' },
  { id: 'q2', label: 'Qual foi a maior superação da sua vida?', type: 'textarea' },
  { id: 'q3', label: 'O que você quer transformar nos próximos 90 dias?', type: 'text' },
];

/* ---------------- Estado ---------------- */
let state = {
  step: 'intro',
  idx: 0,
  answers: {},
  version: CONFIG.VERSION,
};

/* ---------------- Persistência ---------------- */
function saveLocal() {
  try { localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(state.answers)); } catch {}
}

function loadLocal() {
  try {
    // migração simples: se existir chave antiga, usa e migra
    const oldKeys = ['jornada_respostas', 'jornada_v9_respostas', 'jornadaEssencial'];
    let raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) {
      for (const k of oldKeys) {
        const legacy = localStorage.getItem(k);
        if (legacy) { raw = legacy; break; }
      }
      if (raw) localStorage.setItem(CONFIG.STORAGE_KEY, raw);
    }
    state.answers = raw ? JSON.parse(raw) : {};
  } catch { state.answers = {}; }
}

function clearLocal() {
  try { localStorage.removeItem(CONFIG.STORAGE_KEY); } catch {}
  state.answers = {};
}

/* ---------------- Utils ---------------- */
function inputFor(q) {
  const v = state.answers[q.id] || '';
  if (q.type === 'textarea') {
    return `<textarea id="${q.id}" rows="5" placeholder="Escreva com calma...">${escapeHtml(v)}</textarea>`;
  }
  return `<input id="${q.id}" type="text" placeholder="Digite aqui..." value="${escapeAttr(v)}">`;
}

function escapeHtml(s='') {
  return s.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}
function escapeAttr(s='') { return escapeHtml(s); }

function baixarComoArquivo(blob, nome) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

/* ---------------- Download API ---------------- */
async function sendAndDownload() {
  const statusEl = $('#status');
  const btn = $('#btnDownload');
  try {
    if (btn) { btn.disabled = true; btn.textContent = 'Gerando...'; }
    if (statusEl) { statusEl.textContent = ''; }

    const payload = { answers: state.answers, meta: { version: state.version } };

    const baixa = async (path, nome) => {
      const r = await fetch(`${CONFIG.API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/pdf' },
        body: JSON.stringify(payload)
      });
      if (!r.ok) {
        const t = await r.text().catch(()=> '');
        throw new Error(`Falha em ${path} [${r.status}] ${t?.slice(0,200)}`);
      }
      const blob = await r.blob();
      if (blob.type !== 'application/pdf') {
        throw new Error(`Tipo inesperado de retorno em ${path}: ${blob.type}`);
      }
      baixarComoArquivo(blob, nome);
    };

    await baixa('/gerar-pdf', 'jornada.pdf');
    if (statusEl) statusEl.textContent = 'PDF gerado. Gerando HQ...';
    await baixa('/gerar-hq', 'jornada-hq.pdf');

    if (statusEl) statusEl.textContent = 'Arquivos gerados com sucesso. 🙏';
  } catch (err) {
    console.error(err);
    if (statusEl) statusEl.textContent = 'Não foi possível gerar os arquivos. Tente novamente.';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Baixar PDF + HQ'; }
  }
}

/* ---------------- Telas ---------------- */
function renderIntro() {
  app.innerHTML = `
    <section class="pergaminho space-y">
      <div class="text-center">
        <h2 class="titulo-perg">Jornada Conhecimento com Luz • Essencial</h2>
        <p class="muted">Esta é uma jornada pessoal, simbólica e inspiradora. Ao final, você poderá baixar o PDF e a HQ.</p>
      </div>
      <div class="chama-wrap"><div class="chama"></div></div>
      <div class="actions" style="justify-content:center">
        <button id="btnStart" class="btn btn-primary">Iniciar</button>
      </div>
    </section>
  `;
  $('#btnStart').addEventListener('click', () => {
    state.step = 'form';
    state.idx = 0;
    render();
  });
}

function renderFormStep() {
  const total = QUESTIONS.length;
  const q = QUESTIONS[state.idx];
  app.innerHTML = `
    <section class="pergaminho space-y">
      <div class="progress-count">Pergunta ${state.idx + 1}/${total}</div>
      <div class="progress"><span style="width:${((state.idx + 1)/total)*100}%"></span></div>
      <h2 class="pergunta-label">${q.label}</h2>
      ${inputFor(q)}
      <div class="actions" style="justify-content:space-between">
        <div>
          ${state.idx>0 ? `<button id="btnPrev" class="btn">Voltar</button>` : ``}
          <button id="btnClear" class="btn">Limpar</button>
        </div>
        <div>
          ${state.idx < total-1
            ? `<button id="btnNext" class="btn btn-primary">Próxima</button>`
            : `<button id="btnReview" class="btn btn-primary">Revisar</button>`}
        </div>
      </div>
      <div class="chama-wrap"><div class="chama"></div></div>
    </section>
  `;

  const input = document.getElementById(q.id);
  input.addEventListener('input', (e)=>{ state.answers[q.id] = e.target.value; saveLocal(); });

  $('#btnClear').addEventListener('click', () => {
    if (confirm('Tem certeza que deseja apagar TODAS as respostas?')) {
      clearLocal(); state.idx = 0; renderFormStep();
    }
  });

  if ($('#btnPrev')) $('#btnPrev').addEventListener('click', ()=>{ state.idx--; renderFormStep(); });
  if ($('#btnNext')) $('#btnNext').addEventListener('click', ()=>{
    if (!state.answers[q.id]) state.answers[q.id]='';
    state.idx++; renderFormStep();
  });
  if ($('#btnReview')) $('#btnReview').addEventListener('click', ()=>{
    if (!state.answers[q.id]) state.answers[q.id]='';
    state.step = 'review'; render();
  });
}

function renderReview() {
  loadLocal();
  const f = (k) => escapeAttr(state.answers[k] || '');
  // q2 (textarea) tratado como textarea na revisão
  app.innerHTML = `
    <section class="pergaminho review-card">
      <h2 class="titulo-perg">Revise suas respostas</h2>

      <label class="form-label" for="r1">Quem é você hoje? (uma frase que te represente)</label>
      <input id="r1" type="text" value="${f('q1')}" />

      <label class="form-label" for="r2">Qual foi a maior superação da sua vida?</label>
      <textarea id="r2" rows="4" placeholder="Escreva com calma...">${escapeHtml(state.answers['q2']||'')}</textarea>

      <label class="form-label" for="r3">O que você quer transformar nos próximos 90 dias?</label>
      <input id="r3" type="text" value="${f('q3')}" />

      <p id="status" class="muted small"></p>
      <div class="actions" style="justify-content:flex-start">
        <button id="btnBack" class="btn">Voltar</button>
        <button id="btnFinish" class="btn btn-primary">Finalizar</button>
      </div>
    </section>
  `;

  $('#r1').addEventListener('input', e=>{ state.answers['q1']=e.target.value; saveLocal(); });
  $('#r2').addEventListener('input', e=>{ state.answers['q2']=e.target.value; saveLocal(); });
  $('#r3').addEventListener('input', e=>{ state.answers['q3']=e.target.value; saveLocal(); });

  $('#btnBack').addEventListener('click', ()=>{ state.step='form'; render(); });
  $('#btnFinish').addEventListener('click', ()=>{ state.step='done'; render(); });
}

function renderDone() {
  app.innerHTML = `
    <section class="card text-center">
      <h2>Jornada concluída ✨</h2>
      <p>Se quiser, você pode baixar agora seus arquivos ou voltar ao início.</p>
      <p id="status" class="muted small"></p>
      <div class="actions" style="justify-content:center; gap:.75rem">
        <button id="btnDownload" class="btn btn-primary">Baixar PDF + HQ</button>
        <a class="btn" href="./">Voltar ao início</a>
      </div>
    </section>
  `;
  $('#btnDownload').addEventListener('click', sendAndDownload);
}

/* ---------------- Router simples ---------------- */
function render() {
  if (state.step === 'intro') return renderIntro();
  if (state.step === 'form') return renderFormStep();
  if (state.step === 'review') return renderReview();
  return renderDone();
}

/* ---------------- Boot ---------------- */
loadLocal();
render();
