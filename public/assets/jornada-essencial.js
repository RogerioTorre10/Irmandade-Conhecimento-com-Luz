/* =========================
   Jornada Essencial – Front
   ========================= */

/* A) padding para o rodapé fixo */
(function padBottomForFooter() {
  const painel = document.getElementById('painel-controles');
  function ajusta() {
    const h = painel?.getBoundingClientRect().height || 80;
    document.body.style.paddingBottom = (h + 16) + 'px';
  }
  window.addEventListener('load', ajusta);
  window.addEventListener('resize', ajusta);
  setTimeout(ajusta, 0);
})();

/* B) Configuração */
const API_BASE = 'https://lumen-backend-api.onrender.com';
const JOURNEY_POST_PATH = '/formulario';
const API_AUTH_PATHS = ['/auth/validar']; // backend fornece
const KEY_PREFIX = 'jornada_essencial_';
const PERGUNTAS_CACHE_KEY = 'perguntas_cache_v1';

/* C) Estado & elementos */
let PERGUNTAS = [];
let SESSION_SENHA = "";

const areaJornada = document.getElementById('area-jornada');
const lista = document.getElementById('lista-perguntas');
const feedbackEl = document.getElementById('feedback');
const btnIniciar = document.getElementById('btnIniciar');
const btnLimpar  = document.getElementById('btnLimpar');
const btnEnviar  = document.getElementById('btnEnviar');
const senhaEl    = document.getElementById('senha');

feedbackEl?.setAttribute('aria-live', 'polite');
function mostrarFeedback(msg, tipo='erro') {
  if (!feedbackEl) return;
  feedbackEl.className = `rounded-xl p-4 mb-4 text-sm ${
    tipo === 'sucesso' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
  }`;
  feedbackEl.textContent = msg;
  feedbackEl.classList.remove('hidden');
  setTimeout(() => feedbackEl.classList.add('hidden'), 6000);
}

/* D) Storage helpers */
const campos = () => Array.from(document.querySelectorAll('#lista-perguntas textarea[name^="q"]'));
function salvarAuto() { campos().forEach((t,i) => localStorage.setItem(KEY_PREFIX + (i+1), t.value)); }
function getSalvas()  { return PERGUNTAS.map((_,i) => localStorage.getItem(KEY_PREFIX + (i+1)) || ''); }
function setSalva(i, v){ localStorage.setItem(KEY_PREFIX + (i+1), v); }
function limparSalvas(){
  PERGUNTAS.forEach((_,i)=>localStorage.removeItem(KEY_PREFIX+(i+1)));
  localStorage.removeItem(KEY_PREFIX + 'started_at');
}

/* E) Perguntas via backend (com senha) */
async function carregarPerguntas(senha) {
  try {
    const qp = senha ? `?senha=${encodeURIComponent(senha)}` : "";
    const r = await fetch(`${API_BASE}/perguntas${qp}`, { cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    const map = data?.perguntas || {};
    PERGUNTAS = Object.keys(map).sort((a,b)=>Number(a)-Number(b)).map(k => map[k]);
    localStorage.setItem(PERGUNTAS_CACHE_KEY, JSON.stringify(PERGUNTAS));
  } catch (err) {
    console.error('Erro ao carregar perguntas:', err);
    const cache = localStorage.getItem(PERGUNTAS_CACHE_KEY);
    if (cache) PERGUNTAS = JSON.parse(cache);
  }
}

/* F) Senha */
async function validarSenhaAntesDeIniciar(senha) {
  if (!senha) return false;
  for (const p of API_AUTH_PATHS) {
    try {
      const res = await fetch(`${API_BASE}${p}?senha=${encodeURIComponent(senha)}`);
      if (res.status === 200) return true;
      if (res.status === 401) return false;
    } catch {}
  }
  return false;
}

/* G) Render passo-a-passo (sem "todas") */
let atual = 0;

function renderTopoControle(qIndex) {
  const barra = document.createElement('div');
  barra.className = 'mb-3 flex items-center justify-between text-sm';

  const progresso = document.createElement('div');
  progresso.className = 'font-semibold text-yellow-300';
  progresso.textContent = `Pergunta ${qIndex+1} de ${PERGUNTAS.length}`;
  barra.appendChild(progresso);

  return barra;
}

function renderPerguntaUnica(i){
  lista.innerHTML = '';
  lista.appendChild(renderTopoControle(i));

  const wrap = document.createElement('div');
  wrap.className = 'mb-6 rounded-2xl bg-white/5 p-4 border border-white/10';

  const label = document.createElement('label');
  label.className = 'block font-semibold mb-2 break-words';
  label.htmlFor = `q${i+1}`;
  label.textContent = `${i+1}. ${PERGUNTAS[i]}`;

  const ta = document.createElement('textarea');
  ta.name = `q${i+1}`;
  ta.id = `q${i+1}`;
  ta.rows = 4;
  ta.className = 'w-full min-h-[110px] rounded-xl bg-gray-900/60 border border-white/10 p-3';
  ta.placeholder = 'Escreva com sinceridade...';
  ta.value = localStorage.getItem(KEY_PREFIX + (i+1)) || '';
  ta.addEventListener('input', () => setSalva(i, ta.value));

  const nav = document.createElement('div');
  nav.className = 'mt-4 flex gap-3';

  const btnVoltar = document.createElement('button');
  btnVoltar.className = 'px-4 py-2 rounded-xl border border-white/15 hover:bg-white/5 disabled:opacity-50';
  btnVoltar.textContent = 'Voltar';
  btnVoltar.setAttribute('aria-label', 'Voltar para a pergunta anterior');
  btnVoltar.disabled = (i === 0);
  btnVoltar.addEventListener('click', () => {
    atual = Math.max(0, i-1);
    renderPerguntas();
    setTimeout(()=>document.getElementById(`q${atual+1}`)?.focus(), 0);
  });

  const btnAvancar = document.createElement('button');
  btnAvancar.className = 'px-4 py-2 rounded-xl bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 disabled:opacity-50';
  btnAvancar.textContent = (i === PERGUNTAS.length-1) ? 'Concluir' : 'Avançar';
  btnAvancar.setAttribute('aria-label', i === PERGUNTAS.length - 1 ? 'Concluir jornada' : 'Avançar para a próxima pergunta');
  btnAvancar.disabled = !(ta.value.trim().length);
  ta.addEventListener('input', () => { btnAvancar.disabled = !(ta.value.trim().length); });
  btnAvancar.addEventListener('click', () => {
    if (i === PERGUNTAS.length-1) {
      mostrarFeedback('Você concluiu todas as perguntas. Revise e clique em Enviar respostas.', 'sucesso');
      btnEnviar?.focus();
    } else {
      atual = Math.min(PERGUNTAS.length-1, i+1);
      renderPerguntas();
      setTimeout(()=>document.getElementById(`q${atual+1}`)?.focus(), 0);
    }
  });

  wrap.appendChild(label);
  wrap.appendChild(ta);
  nav.appendChild(btnVoltar);
  nav.appendChild(btnAvancar);
  wrap.appendChild(nav);
  lista.appendChild(wrap);

  setTimeout(()=>ta.focus(), 0);
}

function renderPerguntas(){
  if (!PERGUNTAS.length) {
    lista.innerHTML = '<div class="text-sm opacity-70">Carregando perguntas…</div>';
    return;
  }
  renderPerguntaUnica(atual);
}

/* H) Fluxo inicial: só acorda o backend; espera senha para carregar perguntas */
window.addEventListener('load', async () => {
  fetch(API_BASE + '/ping').catch(()=>{});
});

/* Iniciar (senha obrigatória) */
btnIniciar?.addEventListener('click', async () => {
  const senha = (senhaEl?.value || "").trim();
  if (!senha) { mostrarFeedback('Por favor, digite a senha de acesso.'); senhaEl?.focus(); return; }

  const ok = await validarSenhaAntesDeIniciar(senha);
  if (!ok) { mostrarFeedback('Senha inválida. Verifique e tente novamente.'); senhaEl?.focus(); return; }

  SESSION_SENHA = senha;

  await carregarPerguntas(SESSION_SENHA);
  if (!PERGUNTAS.length) { mostrarFeedback('Não foi possível carregar as perguntas.', 'erro'); return; }

  if (!localStorage.getItem(KEY_PREFIX + 'started_at')) {
    localStorage.setItem(KEY_PREFIX + 'started_at', new Date().toISOString());
  }
  const vals = getSalvas();
  atual = Math.max(0, (function(v){ for (let i=0;i<v.length;i++) if (!(v[i]||'').trim()) return i; return v.length-1; })(vals));

  areaJornada?.classList.remove('hidden');
  btnEnviar.disabled = false;
  btnLimpar.disabled = false;
  renderPerguntas();
  mostrarFeedback('Jornada iniciada. Boa escrita! ✨', 'sucesso');
});

/* Autosave global */
document.addEventListener('input', (e) => {
  if (e.target && e.target.matches('#lista-perguntas textarea[name^="q"]')) {
    salvarAuto();
  }
});

/* Limpar tudo */
btnLimpar?.addEventListener('click', () => {
  const temAlgo = getSalvas().some(v => (v||'').trim().length);
  if (!temAlgo) { mostrarFeedback('Não há respostas para limpar.', 'erro'); return; }

  const msg = [
    '⚠️ ATENÇÃO: Este botão apaga TODAS as respostas desta jornada neste dispositivo.',
    '',
    'Tem certeza de que deseja apagar TUDO agora?'
  ].join('\n');

  if (!confirm(msg)) return;

  limparSalvas();
  const vals = getSalvas();
  atual = Math.max(0, (function(v){ for (let i=0;i<v.length;i++) if (!(v[i]||'').trim()) return i; return v.length-1; })(vals));
  renderPerguntas();

  mostrarFeedback('Todas as respostas foram apagadas deste dispositivo.', 'sucesso');
});

/* Montagem do payload */
function montarPayload() {
  const respostas = {};
  PERGUNTAS.forEach((_, i) => {
    respostas[String(i+1)] = (localStorage.getItem(KEY_PREFIX + (i+1)) || '').trim();
  });
  const meta = {
    origem: 'site-irmandade',
    versao_form: 'essencial-v1',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    started_at: localStorage.getItem(KEY_PREFIX + 'started_at') || new Date().toISOString(),
    enviado_em: new Date().toISOString(),
    senha: SESSION_SENHA || ''
  };
  const contato = {};
  return { respostas, meta, contato };
}

/* Enviar (32 obrigatórias) */
async function enviarJornada() {
  const url = API_BASE + JOURNEY_POST_PATH;
  const body = montarPayload();

  for (let tent = 0; tent < 3; tent++) {
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        mode: 'cors',
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const ct = resp.headers.get('Content-Type') || '';
        const err = ct.includes('application/json') ? await resp.json().catch(()=>null) : await resp.text().catch(()=>null);
        const msg = (err && (err.detail || err.mensagem || err.message)) || `Falha ${resp.status}`;
        throw new Error(msg);
      }
      const data = await resp.json();

      if (data.links?.pdf) window.open(`${API_BASE}${data.links.pdf}`, '_blank', 'noopener');
      else if (data.pdf_filename) window.open(`${API_BASE}/download/pdf/${encodeURIComponent(data.pdf_filename)}`, '_blank', 'noopener');

      if (data.links?.hq) window.open(`${API_BASE}${data.links.hq}`, '_blank', 'noopener');

      return data;
    } catch (e) {
      if (tent === 2) throw e;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

btnEnviar?.addEventListener('click', async () => {
  if (!PERGUNTAS.length) { mostrarFeedback('Perguntas ainda não carregadas. Tente novamente.', 'erro'); return; }

  const respostas = {};
  PERGUNTAS.forEach((_, i) => respostas[String(i+1)] = (localStorage.getItem(KEY_PREFIX + (i+1)) || '').trim());
  const faltando = Object.keys(respostas).filter(k => !respostas[k]);
  if (faltando.length) {
    mostrarFeedback(`Responda todas as perguntas. Faltando: ${faltando.join(', ')}`, 'erro');
    const idx = Number(faltando[0]) - 1;
    atual = Math.max(0, idx);
    renderPerguntas();
    setTimeout(()=>document.getElementById(`q${idx+1}`)?.focus(), 0);
    return;
  }

  const oldTxt = btnEnviar.textContent;
  btnEnviar.disabled = true; btnEnviar.textContent = 'Enviando...';

  try {
    const data = await enviarJornada();
    mostrarFeedback(data?.mensagem || 'Respostas enviadas com sucesso! Baixe seus arquivos.', 'sucesso');
    limparSalvas();
    areaJornada?.classList.add('hidden');
    btnIniciar?.classList.remove('hidden');
    senhaEl && (senhaEl.value = '');
    senhaEl?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    console.error(err);
    mostrarFeedback(err.message || 'Falha de rede. Tente novamente.', 'erro');
  } finally {
    btnEnviar.disabled = false; btnEnviar.textContent = oldTxt || 'Enviar respostas';
  }
});
