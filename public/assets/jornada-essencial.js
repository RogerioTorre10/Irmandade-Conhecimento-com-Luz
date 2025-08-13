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
const KEY_PREFIX = 'jornada_essencial_';
const PERGUNTAS_CACHE_KEY = 'perguntas_cache_v1';

// Modo teste no front (não bloqueia por senha)
const FRONT_MODO_TESTE = true;

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

/* C.1) Olhinho para ver/esconder senha (sem precisar mexer no HTML) */
(function addSenhaToggle() {
  if (!senhaEl) return;
  const wrap = document.createElement('div');
  wrap.className = 'relative inline-block w-full';
  senhaEl.parentNode.insertBefore(wrap, senhaEl);
  wrap.appendChild(senhaEl);
  senhaEl.classList.add('pr-10'); // espaço pro botão

  const eye = document.createElement('button');
  eye.type = 'button';
  eye.title = 'Mostrar/ocultar senha';
  eye.className = 'absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-sm rounded hover:bg-white/10';
  eye.innerText = '👁️';
  eye.addEventListener('click', () => {
    senhaEl.type = (senhaEl.type === 'password') ? 'text' : 'password';
    eye.innerText = (senhaEl.type === 'password') ? '👁️' : '🙈';
  });
  wrap.appendChild(eye);
})();

/* D) Feedback */
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

/* E) Storage helpers */
const campos = () => Array.from(document.querySelectorAll('#lista-perguntas textarea[name^="q"]'));
function salvarAuto() { campos().forEach((t,i) => localStorage.setItem(KEY_PREFIX + (i+1), t.value)); }
function getSalvas()  { return PERGUNTAS.map((_,i) => localStorage.getItem(KEY_PREFIX + (i+1)) || ''); }
function setSalva(i, v){ localStorage.setItem(KEY_PREFIX + (i+1), v); }
function limparSalvas(){
  PERGUNTAS.forEach((_,i)=>localStorage.removeItem(KEY_PREFIX+(i+1)));
  localStorage.removeItem(KEY_PREFIX + 'started_at');
}

/* F) Perguntas via backend (em teste não manda senha) */
async function carregarPerguntas(senha) {
  try {
    const qp = (!FRONT_MODO_TESTE && senha) ? `?senha=${encodeURIComponent(senha)}` : "";
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

/* G) Validação de senha (em teste, sempre OK) */
async function validarSenhaAntesDeIniciar(senha) {
  if (FRONT_MODO_TESTE) return true;
  if (!senha) return false;
  try {
    const res = await fetch(`${API_BASE}/auth/validar?senha=${encodeURIComponent(senha)}`);
    return res.status === 200;
  } catch { return false; }
}

/* H) Render passo-a-passo */
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

// --- Prompt final (aparece na última pergunta) ---
function mostrarPromptFinal() {
  document.getElementById('final-prompt')?.remove();

  const box = document.createElement('div');
  box.id = 'final-prompt';
  box.className = 'mt-4 rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-yellow-100';

  box.innerHTML = `
    <div class="font-semibold mb-2">Você finalizou a Jornada 🎉</div>
    <div class="text-sm opacity-90 mb-3">
      Deseja enviar agora para gerar o PDF (e HQ, quando disponível)?
    </div>
    <div class="flex gap-2">
      <button id="btnEnviarAgora"
        class="px-4 py-2 rounded-lg bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300">
        Enviar agora
      </button>
      <button id="btnRevisar"
        class="px-4 py-2 rounded-lg border border-white/20 hover:bg-white/5">
        Revisar respostas
      </button>
    </div>
  `;

  lista.appendChild(box);

  document.getElementById('btnEnviarAgora')?.addEventListener('click', () => {
    if (btnEnviar) {
      btnEnviar.classList.add('ring-4','ring-yellow-300','ring-offset-2','ring-offset-transparent');
      btnEnviar.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setTimeout(() => btnEnviar.focus(), 300);
      setTimeout(() => btnEnviar.click(), 350);
      setTimeout(() => btnEnviar.classList.remove('ring-4','ring-yellow-300','ring-offset-2','ring-offset-transparent'), 1500);
    }
  });

  document.getElementById('btnRevisar')?.addEventListener('click', () => {
    mostrarFeedback('Use “Voltar” para revisar suas respostas.', 'sucesso');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  box.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
      mostrarPromptFinal();
      if (btnEnviar) {
        btnEnviar.classList.add('ring-4','ring-yellow-300','ring-offset-2','ring-offset-transparent');
        btnEnviar.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => btnEnviar.focus(), 300);
        setTimeout(() => btnEnviar.classList.remove('ring-4','ring-yellow-300','ring-offset-2','ring-offset-transparent'), 1500);
      }
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

/* I) Fluxo inicial: acorda backend e libera iniciar sem bloquear pela senha (modo teste) */
window.addEventListener('load', async () => {
  fetch(API_BASE + '/ping').catch(()=>{});
});

/* Iniciar */
btnIniciar?.addEventListener('click', async () => {
  const senha = (senhaEl?.value || "").trim();

  // Em teste, não bloqueia; em produção valida
  const ok = FRONT_MODO_TESTE ? true : await validarSenhaAntesDeIniciar(senha);
  if (!ok) {
    mostrarFeedback('Senha inválida ou expirada. Por favor, verifique.', 'erro');
    senhaEl?.focus();
    return;
  }
  SESSION_SENHA = senha;

  await carregarPerguntas(SESSION_SENHA);
  if (!PERGUNTAS.length) { mostrarFeedback('Não foi possível carregar as perguntas.', 'erro'); return; }

  if (!localStorage.getItem(KEY_PREFIX + 'started_at')) {
    localStorage.setItem(KEY_PREFIX + 'started_at', new Date().toISOString());
  }
  const vals = getSalvas();
  let idx = 0; for (let i=0;i<vals.length;i++) { if (!(vals[i]||'').trim()) { idx=i; break; } else { idx=vals.length-1; } }
  atual = Math.max(0, idx);

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
  let idx = 0; for (let i=0;i<vals.length;i++) { if (!(vals[i]||'').trim()) { idx=i; break; } else { idx=vals.length-1; } }
  atual = Math.max(0, idx);
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
    // senha segue junto; em MODO_TESTE o backend ignora
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

      // dica sobre onde o arquivo será salvo
      const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
      const dicaPath = isMobile
        ? 'no seu celular, geralmente em Arquivos > Downloads.'
        : 'na pasta padrão de Downloads do seu sistema.';
      mostrarFeedback(
        `Vamos baixar seu PDF; ele ficará ${dicaPath} Após o download, as respostas serão apagadas deste dispositivo.`,
        'sucesso'
      );

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
