/* =========================
   Jornada Essencial – Front
   ========================= */

/* --- Anti-flash já está no <head>. Aqui focamos na lógica. --- */

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
const APIS = [
  'https://conhecimento-com-luz-api.onrender.com', // principal
  'https://lumen-backend-api.onrender.com'         // backup
];
const API_PATHS = [
  '/jornada/essencial',     // nossa primeira suposição
  '/jornada-essencial',     // variação com hífen
  '/jornada/essencial/pdf', // se o backend devolver direto o PDF
  '/jornada',               // variação curtinha
];
const MIN_CAMPOS = 10;
const KEY_PREFIX = 'jornada_essencial_';
const API_AUTH_PATHS = ['/auth/validar', '/auth/check'];

/* C) Perguntas e blocos */
const PERGUNTAS = [
  // 1–10
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
  // 11–18
  "Com quem foi criado: ambos os pais biológicos, só um dos pais biológicos (divórcio ou morte), pais afetivos (adoção) ou parentes?",
  "É filho único?",
  "Quantos irmãos tem? É primogênito, do meio ou caçula?",
  "Passou fome quando criança?",
  "Nível de escolaridade e formação acadêmica.",
  "Estado civil: solteiro, namorando, casado, divorciado, viúvo?",
  "Tem alguma deficiência física?",
  "Você já sofreu algum tipo de preconceito? Foi superado ou ainda interfere nas suas decisões?",
  // 19–23
  "Quais são os seus maiores sonhos para o futuro?",
  "O que você considera essencial para ter uma vida plena?",
  "Se pudesse mudar algo na sociedade, o que mudaria?",
  "Qual legado gostaria de deixar?",
  "Se pudesse passar uma mensagem para o mundo inteiro agora, qual seria?",
  // 24–32
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
function limparSalvas()
async function validarSenhaAntesDeIniciar(senha) {
  for (const api of APIS) {
    for (const p of API_AUTH_PATHS) {
      try {
        let res = await fetch(`${api}${p}?senha=${encodeURIComponent(senha)}`, { method: 'GET' });
        if (res.status === 200) return true;
        if (res.status === 401) return false;
        if (res.status !== 404) {
          // tenta POST também
          res = await fetch(`${api}${p}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha }),
          });
          if (res.status === 200) return true;
          if (res.status === 401) return false;
        }
      } catch { /* tenta próximo host */ }
    }
  }
  // se não existir endpoint de auth, deixa passar; o backend barra no Enviar (401)
  return true;
}

// tenta vários paths em ambos os hosts; para no primeiro que responde útil
async function postComFallbackPathList(paths, body) {
  const supportsAbortTimeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal;
  let lastErr;
  for (const path of paths) {
    for (const api of APIS) {
      let controller, timer;
      const opts = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, application/pdf' },
        body: JSON.stringify(body),
      };
      if (supportsAbortTimeout) opts.signal = AbortSignal.timeout(30000);
      else { controller = new AbortController(); timer = setTimeout(()=>controller.abort(), 30000); opts.signal = controller.signal; }
      try {
        const res = await fetch(api + path, opts);
        if (timer) clearTimeout(timer);
        if (res.ok || res.status === 400 || res.status === 401) return res;
        lastErr = new Error(`HTTP ${res.status} em ${api+path}`);
      } catch (e) { lastErr = e; }
    }
  }
  throw lastErr || new Error('Falha de rede.');
}
{
  PERGUNTAS.forEach((_,i)=>localStorage.removeItem(KEY_PREFIX+(i+1)));
  localStorage.removeItem(KEY_PREFIX + 'started_at');
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

/* E) Render: modos passo e todas */
let modo = 'passo';        // 'passo' | 'todas'
let atual = 0;             // índice atual no modo passo

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

  // título do bloco
  const blocosIndices = Object.keys(BLOCO_TITULOS).map(n=>parseInt(n,10)).sort((a,b)=>a-b);
  let titulo = '';
  for (const idx of blocosIndices) if (i >= idx) titulo = BLOCO_TITULOS[idx];
  if (titulo) {
    const h3 = document.createElement('h3');
    h3.className = 'mt-6 mb-3 text-xl font-extrabold tracking-wide text-yellow-300';
    h3.textContent = titulo;
    lista.appendChild(h3);
  }

  // topo: progresso + toggle
  lista.appendChild(renderTopoControle(i));

  // wrapper da pergunta
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

  // navegação passo-a-passo
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
  btnAvancar.disabled = !(ta.value.trim().length); // exige resposta pra avançar
  ta.addEventListener('input', () => {
    btnAvancar.disabled = !(ta.value.trim().length);
  });
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

  // foco
  setTimeout(()=>ta.focus(), 0);
}

function renderPerguntasTodas(){
  lista.innerHTML = '';

  // controle topo
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
    ta.className = 'w-full min-h-[110px] rounded-xl bg-gray-900/60 border border-white/10 p-3';
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
  // aquece backend(s)
  APIS.forEach(api => fetch(api + '/ping').catch(()=>{}));
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

/* Limpar com aviso forte */
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

  campos().forEach(t => t.value = '');
  salvarAuto();
  mostrarFeedback('Todas as respostas foram apagadas deste dispositivo.', 'sucesso');
});

/* POST com fallback (tenta outro host em 404/5xx) */
async function validarSenhaAntesDeIniciar(senha) {
  for (const api of APIS) {
    for (const p of API_AUTH_PATHS) {
      try {
        // GET ?senha=
        let res = await fetch(`${api}${p}?senha=${encodeURIComponent(senha)}`, { method: 'GET' });
        if (res.status === 200) return true;
        if (res.status === 401) return false;

        // Se não for 404, tenta POST também
        if (res.status !== 404) {
          res = await fetch(`${api}${p}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ senha }),
          });
          if (res.status === 200) return true;
          if (res.status === 401) return false;
        }
      } catch { /* tenta próximo host */ }
    }
  }
      try {
  try {
  const res = await postComFallbackPathList(API_PATHS, payload);

  const ct = res.headers.get('Content-Type') || '';
  let data = null, blob = null, text = null;

  // Se NÃO ok, lê erro e lança mensagem amigável
  if (!res.ok) {
    if (ct.includes('application/json')) data = await res.json().catch(()=>null);
    else                                  text = await res.text().catch(()=>null);

    let msg = 'Erro ao enviar.';
    if (res.status === 401) msg = 'Senha inválida. Verifique e tente novamente.';
    else if (res.status === 400) msg = (data && (data.detail || data.message)) || 'Dados inválidos. Verifique suas respostas.';
    else if (res.status >= 500) msg = 'Erro no servidor. Tente novamente mais tarde.';
    else msg = (data && (data.detail || data.message)) || text || `Erro ${res.status}`;
    throw new Error(msg);
  }

  // OK: trata sucesso (PDF ou JSON com link/base64)
  if (ct.includes('application/pdf')) {
    blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'jornada-essencial.pdf';
    a.click();
    URL.revokeObjectURL(url);
    mostrarFeedback('PDF gerado com sucesso! 🎉', 'sucesso');
  } else if (ct.includes('application/json')) {
    data = await res.json().catch(()=>null);
    mostrarFeedback((data && (data.message || data.msg)) || 'Respostas enviadas com sucesso!', 'sucesso');

    if (data?.pdf_url) {
      location.href = data.pdf_url;
    } else if (data?.pdf_base64) {
      const a = document.createElement('a');
      a.href = `data:application/pdf;base64,${data.pdf_base64}`;
      a.download = data?.pdf_filename || 'jornada-essencial.pdf';
      a.click();
    } else {
      // JSON sem PDF — informa
      mostrarFeedback('Resposta recebida, mas o PDF não veio. Tente novamente.', 'erro');
    }
  } else {
    // Tipo inesperado
    text = await res.text().catch(()=>null);
    console.error('Resposta inesperada:', text);
    mostrarFeedback('Formato de resposta inesperado do servidor.', 'erro');
  }

  // Limpa storage após sucesso
  limparSalvas();

} catch (err) {
  console.error(err);
  mostrarFeedback(err.message || 'Falha de rede. Tente novamente.', 'erro');
} finally {
  btnEnviar.disabled = false;
  btnEnviar.textContent = oldTxt || 'Enviar respostas';
}
});
        // 1) GET ?senha=
        let res = await fetch(`${api}${p}?senha=${encodeURIComponent(senha)}`, { method: 'GET' });
        if (res.status === 200) return true;
        if (res.status === 401) return false;
        if (res.status === 404) continue; // endpoint não existe nesse host → tenta o próximo
        // 2) POST {senha}
        res = await fetch(`${api}${p}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ senha })
        });
        if (res.status === 200) return true;
        if (res.status === 401) return false;
      } catch (_) { /* tenta o próximo */ }
    }
  }
  // se nenhum endpoint existir, não bloqueia — validação final ocorrerá no envio (401)
  return true;
}

async function postComFallback(path, body) {
  const supportsAbortTimeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal;
  let lastErr;
  for (const api of APIS) {
    let controller, timer;
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json, application/pdf' },
      body: JSON.stringify(body)
    };
    if (supportsAbortTimeout) opts.signal = AbortSignal.timeout(30000);
    else { controller = new AbortController(); timer = setTimeout(()=>controller.abort(), 30000); opts.signal = controller.signal; }

    try {
      const res = await fetch(api + path, opts);
      if (timer) clearTimeout(timer);
      if (res.ok || res.status === 400 || res.status === 401) return res; // devolve; quem chama decide
      lastErr = new Error(`HTTP ${res.status}`);
      continue; // tenta próximo host
    } catch (e) {
      lastErr = e;
      continue;
    }
  }
  throw lastErr || new Error('Falha de rede.');
}

/* Enviar */
btnEnviar?.addEventListener('click', async () => {
  if (!senhaEl?.value.trim()) {
    mostrarFeedback('Por favor, digite a senha de acesso.');
    senhaEl?.focus();
    return;
  }

  // monta respostas
  const respostas = PERGUNTAS.map((texto, i) => ({
    indice: i + 1,
    pergunta: texto,
    resposta: (localStorage.getItem(KEY_PREFIX + (i+1)) || '').trim()
  }));
  const preenchidas = respostas.filter(r => r.resposta.length);

  // valida mínimo e, no modo passo, incentiva completar todas
  if (!preenchidas.length) { mostrarFeedback('Preencha ao menos uma resposta antes de enviar.'); return; }

  if (modo === 'passo' && preenchidas.length < PERGUNTAS.length) {
    if (!confirm(`Você respondeu ${preenchidas.length} de ${PERGUNTAS.length}. Deseja enviar assim mesmo?`)) {
      // foca na primeira em branco
      const idx = respostas.findIndex(r => !r.resposta.length);
      if (idx >= 0) { atual = idx; renderPerguntas(); setTimeout(()=>document.getElementById(`q${idx+1}`)?.focus(),0); }
      return;
    }
  } else if (preenchidas.length < MIN_CAMPOS) {
    if (!confirm(`Somente ${preenchidas.length} respostas preenchidas. Deseja enviar assim mesmo?`)) return;
  }

  const payload = {
    senha: senhaEl.value.trim(),
    origem: 'site-irmandade',
    jornada: 'essencial',
    respostas,
    meta: {
      dispositivo: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      started_at: localStorage.getItem(KEY_PREFIX + 'started_at') || new Date().toISOString(),
      enviado_em: new Date().toISOString()
    }
  };

  const oldTxt = btnEnviar.textContent;
  btnEnviar.disabled = true; btnEnviar.textContent = 'Enviando...';

  try {
    const res = await postComFallback(API_PATH, payload);
    const ct = res.headers.get('Content-Type') || '';
    let data=null, blob=null, text=null;

    if (ct.includes('application/pdf'))      blob = await res.blob();
    else if (ct.includes('application/json')) data = await res.json().catch(()=>null);
    else                                       text = await res.text().catch(()=>null);

    if (!res.ok) {
      let msg = 'Erro ao enviar.';
      if (res.status === 401) msg = 'Senha inválida. Verifique e tente novamente.';
      else if (res.status === 400) msg = (data && (data.detail || data.message)) || 'Dados inválidos. Verifique suas respostas.';
      else if (res.status >= 500) msg = 'Erro no servidor. Tente novamente mais tarde.';
      else msg = (data && (data.detail || data.message)) || text || `Erro ${res.status}`;
      throw new Error(msg);
    }

    mostrarFeedback((data && (data.message || data.msg)) || 'Respostas enviadas com sucesso!', 'sucesso');

    if (blob) {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'jornada-essencial.pdf'; a.click();
      URL.revokeObjectURL(url);
    } else if (data?.pdf_url) {
      location.href = data.pdf_url;
    } else if (data?.pdf_base64) {
      const a = document.createElement('a');
      a.href = `data:application/pdf;base64,${data.pdf_base64}`;
      a.download = data?.pdf_filename || 'jornada-essencial.pdf';
      a.click();
    } else {
      mostrarFeedback('Nenhum PDF retornado pelo servidor.', 'erro');
    }

    // limpa storage após sucesso
    limparSalvas();
  } catch (err) {
    console.error(err);
    mostrarFeedback(err.message || 'Falha de rede. Tente novamente.', 'erro');
  } finally {
    btnEnviar.disabled = false; btnEnviar.textContent = oldTxt || 'Enviar respostas';
  }
});
