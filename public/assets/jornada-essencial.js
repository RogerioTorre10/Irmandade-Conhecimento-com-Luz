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

/* B) Configuração (API FIXA, sem fallback) */
const API_BASE = 'https://lumen-backend-api.onrender.com';
const JOURNEY_POST_PATH = '/formulario'; // POST oficial
const API_AUTH_PATHS = ['/auth/validar', '/auth/check']; // se existir
const MIN_CAMPOS = 10;
const KEY_PREFIX = 'jornada_essencial_';
const DEBUG_API = true;

/* C) Perguntas e blocos */
const PERGUNTAS = [
  "Como você tem percebido sua própria vida até aqui?",
  "E a vida das pessoas ao seu redor, como você a enxerga?",
  "Como lida com seus traumas? Consegue falar sobre eles?",
  "Você acredita que a verdade existe ou tudo é relativo? Explique.",
  "O que significa a doença para você? Está enfrentando alguma? Fale livremente.",
  "Há alguém que você gostaria de ter ao seu lado agora? Quem é essa pessoa e por que ela não está?",
  "Qual é o seu maior vício? Por que você acha que ele surgiu? Já tentou vencê-lo?",
  "Sente que tem outros vícios, mesmo que sutis ou emocionais? Quais?",
  "Como você percebe a morte? Ela te assusta, conforta ou provoca curiosidade?",
  "Você acredita em continuidade após a morte? O que imagina que exista?",
  "Com quem foi criado: ambos os pais biológicos, só um dos pais biológicos (divórcio ou morte), pais afetivos (adoção) ou parentes?",
  "É filho único?",
  "Quantos irmãos tem? É primogênito, do meio ou caçula?",
  "Passou fome quando criança?",
  "Nível de escolaridade e formação acadêmica.",
  "Estado civil: solteiro, namorando, casado, divorciado, viúvo?",
  "Tem alguma deficiência física?",
  "Você já sofreu algum tipo de preconceito? Foi superado ou ainda interfere nas suas decisões?",
  "Quais são os seus maiores sonhos para o futuro?",
  "O que você considera essencial para ter uma vida plena?",
  "Se pudesse mudar algo na sociedade, o que mudaria?",
  "Qual legado gostaria de deixar?",
  "Se pudesse passar uma mensagem para o mundo inteiro agora, qual seria?",
  "Você se recorda da idade em que, pela primeira vez, percebeu que era alguém neste mundo?",
  "Se encontrasse seu 'eu' de 10 anos atrás, o que diria?",
  "O que significa fé para você?",
  "Já teve alguma experiência que mudou sua forma de ver a vida?",
  "Quais pessoas mais marcaram sua caminhada? Por quê?",
  "Você acredita que tudo tem um propósito?",
  "Se pudesse receber uma resposta direta de Deus agora, qual pergunta faria?",
  "Que hábito você pode iniciar hoje que te aproximaria do seu propósito?",
  "Qual é a decisão corajosa que você vem adiando e precisa tomar?"
];

const BLOCO_TITULOS = {
  0: "Reflexões da Alma e da Existência",
  10: "Raízes e Experiências de Vida",
  18: "Futuro e Propósito",
  23: "Jornada Iluminada"
};

/* D) Elementos e helpers */
const areaJornada = document.getElementById('area-jornada');
const lista = document.getElementById('lista-perguntas');
const feedbackEl = document.getElementById('feedback');
const btnIniciar = document.getElementById('btnIniciar');
const btnLimpar  = document.getElementById('btnLimpar');
const btnEnviar  = document.getElementById('btnEnviar');
const senhaEl    = document.getElementById('senha');

function mostrarFeedback(msg, tipo='erro') {
  if (!feedbackEl) return;
  feedbackEl.className = `rounded-xl p-4 mb-4 text-sm ${
    tipo === 'sucesso' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'
  }`;
  feedbackEl.textContent = msg;
  feedbackEl.classList.remove('hidden');
  setTimeout(() => feedbackEl.classList.add('hidden'), 5000);
}

const campos = () => Array.from(document.querySelectorAll('#lista-perguntas textarea[name^="q"]'));
function salvarAuto() { campos().forEach((t,i) => localStorage.setItem(KEY_PREFIX + (i+1), t.value)); }
function getSalvas()  { return PERGUNTAS.map((_,i) => localStorage.getItem(KEY_PREFIX + (i+1)) || ''); }
function setSalva(i, v){ localStorage.setItem(KEY_PREFIX + (i+1), v); }

// LIMPEZA TOTAL garantida
function limparSalvas(){
  const prefix = KEY_PREFIX;
  const extras = [
    'jornada_pdf_url','jornada_meta','jornada_progress','jornada_started_at',
    'jornada_result','jornada_nome','jornada_email','jornada_telefone'
  ];
  const toRemove = [];
  for (let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if (!k) continue;
    if (k.startsWith(prefix) || extras.includes(k)) toRemove.push(k);
  }
  for (const k of toRemove) localStorage.removeItem(k);
}

const respondidasCount = vals => vals.filter(v => (v||'').trim().length>0).length;
const primeiraNaoRespondida = vals => {
  for (let i=0;i<vals.length;i++) if (!(vals[i]||'').trim()) return i;
  return vals.length-1;
};

function habilitaAcoes(on){
  btnLimpar.disabled = !on;
  btnEnviar.disabled = !on;
  btnEnviar.classList.toggle('bg-yellow-400/60', !on);
  btnEnviar.classList.toggle('bg-yellow-400', on);
  btnEnviar.classList.toggle('hover:bg-yellow-300', on);
}

/* --- Helpers de rede --- */
// valida senha se existir endpoint; se não existir, segue fluxo
async function validarSenhaAntesDeIniciar(senha) {
  for (const p of API_AUTH_PATHS) {
    try {
      let res = await fetch(`${API_BASE}${p}?senha=${encodeURIComponent(senha)}`, { method: 'GET' });
      if (res.status === 200) return true;
      if (res.status === 401) return false;

      if (res.status !== 404) {
        res = await fetch(`${API_BASE}${p}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha }),
        });
        if (res.status === 200) return true;
        if (res.status === 401) return false;
      }
    } catch { /* ignora e tenta próximo path */ }
  }
  return true; // sem /auth → prossegue
}

function montarPayload() {
  // respostas: { q1: '...', q2: '...', ... }
  const vals = getSalvas();
  const respostas = {};
  vals.forEach((v, i) => respostas['q' + (i + 1)] = (v ?? '').trim());

  const meta = {
    started_at: localStorage.getItem(KEY_PREFIX + 'started_at') || new Date().toISOString(),
    origem: 'site-irmandade',
    versao_form: 'essencial-v1',
    dispositivo: navigator.userAgent,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    enviado_em: new Date().toISOString()
  };

  const contato = {
    nome: localStorage.getItem('jornada_nome') || '',
    email: localStorage.getItem('jornada_email') || '',
    telefone: localStorage.getItem('jornada_telefone') || ''
  };

  return { respostas, meta, contato };
}

async function enviarJornada() {
  const url = API_BASE + JOURNEY_POST_PATH;
  const body = montarPayload();
  if (DEBUG_API) console.debug('POST', url, body);

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    mode: 'cors',
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const ct = resp.headers.get('Content-Type') || '';
    const txt = ct.includes('application/json') ? JSON.stringify(await resp.json().catch(()=>null)) : await resp.text().catch(()=> '');
    throw new Error(`POST falhou ${resp.status} ${resp.statusText} — ${txt}`);
  }

  const data = await resp.json();
  if (DEBUG_API) console.debug('Resposta:', data);

  // Convenções de retorno do backend
  if (data.pdf_filename) {
    const pdfUrl = `${API_BASE}/download/pdf/${encodeURIComponent(data.pdf_filename)}`;
    window.open(pdfUrl, '_blank', 'noopener');
  }
  if (data.hq_filename) {
    const hqUrl = `${API_BASE}/download/hq/${encodeURIComponent(data.hq_filename)}`;
    window.open(hqUrl, '_blank', 'noopener');
  }
  return data;
}

/* E) Render: modos passo e todas */
let modo = 'passo'; // 'passo' | 'todas'
let atual = 0;      // índice atual

function renderTopoControle(qIndex) {
  const barra = document.createElement('div');
  barra.className = 'mb-3 flex items-center justify-between text-sm';

  const progresso = document.createElement('div');
  progresso.className = 'font-semibold text-yellow-300';
  progresso.textContent = `Pergunta ${qIndex+1} de ${PERGUNTAS.length}`;
  barra.appendChild(progresso);

  const b = document.createElement('button');
  b.id = 'btnToggleModo';
  b.className = 'px-3 py-1.5 rounded-lg border border-white/15 hover:bg-white/5';
  b.textContent = (modo === 'passo') ? 'Exibir todas' : 'Modo passo-a-passo';
  b.addEventListener('click', () => {
    modo = (modo === 'passo') ? 'todas' : 'passo';
    if (modo === 'passo') {
      const vals = getSalvas();
      atual = Math.max(0, primeiraNaoRespondida(vals));
    }
    renderPerguntas();
  });
  barra.appendChild(b);
  return barra;
}

function renderPerguntaUnica(i){
  lista.innerHTML = '';

  const blocosIndices = Object.keys(BLOCO_TITULOS).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
  let titulo = '';
  for (const idx of blocosIndices) if (i >= idx) titulo = BLOCO_TITULOS[idx];
  if (titulo) {
    const h3 = document.createElement('h3');
    h3.className = 'mt-6 mb-3 text-xl font-extrabold tracking-wide text-yellow-300';
    h3.textContent = titulo;
    lista.appendChild(h3);
  }

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

  wrap.appendChild(label);
  wrap.appendChild(ta);

  const nav = document.createElement('div');
  nav.className = 'mt-4 flex gap-3';

  const btnVoltar = document.createElement('button');
  btnVoltar.className = 'px-4 py-2 rounded-xl border border-white/15 hover:bg-white/5 disabled:opacity-50';
  btnVoltar.textContent = 'Voltar';
  btnVoltar.disabled = (i === 0);
  btnVoltar.addEventListener('click', () => {
    atual = Math.max(0, i-1);
    renderPerguntas();
    setTimeout(()=>document.getElementById(`q${atual+1}`)?.focus(), 0);
  });

  const btnAvancar = document.createElement('button');
  btnAvancar.className = 'px-4 py-2 rounded-xl bg-yellow-400 text-gray-900 font-semibold hover:bg-yellow-300 disabled:opacity-50';
  btnAvancar.textContent = (i === PERGUNTAS.length-1) ? 'Concluir' : 'Avançar';
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

  nav.appendChild(btnVoltar);
  nav.appendChild(btnAvancar);
  wrap.appendChild(nav);
  lista.appendChild(wrap);

  setTimeout(()=>ta.focus(), 0);
}

function renderPerguntasTodas(){
  lista.innerHTML = '';
  lista.appendChild(renderTopoControle(Math.max(atual,0)));

  PERGUNTAS.forEach((texto, i) => {
    if (BLOCO_TITULOS[i]) {
      const h3 = document.createElement('h3');
      h3.className = 'mt-10 mb-4 text-xl font-extrabold tracking-wide text-yellow-300';
      h3.textContent = BLOCO_TITULOS[i];
      lista.appendChild(h3);
    }
    const wrap = document.createElement('div');
    wrap.className = 'mb-6 rounded-2xl bg-white/5 p-4 border border-white/10';

    const label = document.createElement('label');
    label.className = 'block font-semibold mb-2 break-words';
    label.htmlFor = `q${i+1}`;
    label.textContent = `${i+1}. ${texto}`;

    const ta = document.createElement('textarea');
    ta.name = `q${i+1}`;
    ta.id = `q${i+1}`;
    ta.rows = 4;
    ta.className = 'w-full min-h-[110px] rounded-xl bg-gray-900/60 border border-white/10';
    ta.placeholder = 'Escreva com sinceridade...';
    ta.value = localStorage.getItem(KEY_PREFIX + (i+1)) || '';
    ta.addEventListener('input', () => setSalva(i, ta.value));

    wrap.appendChild(label);
    wrap.appendChild(ta);
    lista.appendChild(wrap);
  });
}

function renderPerguntas(){
  if (modo === 'todas') renderPerguntasTodas();
  else renderPerguntaUnica(atual);
}

/* F) Fluxo principal */
window.addEventListener('load', () => {
  // acorda o backend
  fetch(API_BASE + '/ping').catch(()=>{});
});

/* Iniciar */
btnIniciar?.addEventListener('click', async () => {
  const senha = senhaEl?.value.trim();
  if (!senha) { mostrarFeedback('Por favor, digite a senha de acesso.'); senhaEl?.focus(); return; }

  const ok = await validarSenhaAntesDeIniciar(senha);
  if (!ok) { mostrarFeedback('Senha inválida. Verifique e tente novamente.'); senhaEl?.focus(); return; }

  if (!localStorage.getItem(KEY_PREFIX + 'started_at')) {
    localStorage.setItem(KEY_PREFIX + 'started_at', new Date().toISOString());
  }
  const vals = getSalvas();
  atual = Math.max(0, primeiraNaoRespondida(vals));
  modo = 'passo';
  areaJornada?.classList.remove('hidden');
  habilitaAcoes(true);
  renderPerguntas();
  mostrarFeedback('Jornada iniciada. Boa escrita! ✨', 'sucesso');
});

/* Autosave global */
document.addEventListener('input', (e) => {
  if (e.target && e.target.matches('#lista-perguntas textarea[name^="q"]')) {
    salvarAuto();
  }
});

/* Limpar com aviso forte (apaga TUDO mesmo) */
btnLimpar?.addEventListener('click', () => {
  const temAlgo = campos().some(t => t.value.trim().length);
  if (!temAlgo) { mostrarFeedback('Não há respostas para limpar.', 'erro'); return; }

  const msg = [
    '⚠️ ATENÇÃO: Este botão apaga TODAS as respostas desta página.',
    '',
    'Para apagar somente UMA resposta, use o teclado na pergunta desejada (Ctrl+A e Backspace/Apagar).',
    '',
    'Tem certeza de que deseja apagar TUDO agora?'
  ].join('\n');

  if (!confirm(msg)) return;

  limparSalvas();         // <- limpa localStorage
  renderPerguntas();      // <- re-render zerado
  window.scrollTo?.({ top: 0, behavior: 'smooth' });
  mostrarFeedback('Todas as respostas foram apagadas deste dispositivo.', 'sucesso');
});

/* Enviar */
btnEnviar?.addEventListener('click', async () => {
  if (!senhaEl?.value.trim()) {
    mostrarFeedback('Por favor, digite a senha de acesso.');
    senhaEl?.focus();
    return;
  }

  const respostasArr = PERGUNTAS.map((texto, i) => ({
    indice: i + 1,
    pergunta: texto,
    resposta: (localStorage.getItem(KEY_PREFIX + (i+1)) || '').trim()
  }));
  const preenchidas = respostasArr.filter(r => r.resposta.length);

  if (!preenchidas.length) { mostrarFeedback('Preencha ao menos uma resposta antes de enviar.'); return; }

  if (modo === 'passo' && preenchidas.length < PERGUNTAS.length) {
    if (!confirm(`Você respondeu ${preenchidas.length} de ${PERGUNTAS.length}. Deseja enviar assim mesmo?`)) {
      const idx = respostasArr.findIndex(r => !r.resposta.length);
      if (idx >= 0) { atual = idx; renderPerguntas(); setTimeout(()=>document.getElementById(`q${idx+1}`)?.focus(),0); }
      return;
    }
  } else if (preenchidas.length < MIN_CAMPOS) {
    if (!confirm(`Somente ${preenchidas.length} respostas preenchidas. Deseja enviar assim mesmo?`)) return;
  }

  const oldTxt = btnEnviar.textContent;
  btnEnviar.disabled = true; btnEnviar.textContent = 'Enviando...';

  try {
    const data = await enviarJornada();

    if (data?.message || data?.msg) {
      mostrarFeedback(data.message || data.msg, 'sucesso');
    } else {
      mostrarFeedback('Respostas enviadas com sucesso!', 'sucesso');
    }

    // limpa e reseta a tela
    limparSalvas();
    renderPergunta
