// --- Rodapé fixo: padding ---
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

// --- Perguntas + render ---
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

const BLOCO_TITULOS = {0:"Reflexões da Alma e da Existência",10:"Raízes e Experiências de Vida",18:"Futuro e Propósito",23:"Jornada Iluminada"};

function renderPerguntas() {
  const lista = document.getElementById("lista-perguntas");
  if (!lista) return;
  lista.innerHTML = "";
  PERGUNTAS.forEach((texto, i) => {
    if (BLOCO_TITULOS[i]) {
      const h3 = document.createElement('h3');
      h3.className = "mt-10 mb-4 text-xl font-extrabold tracking-wide text-yellow-300";
      h3.textContent = BLOCO_TITULOS[i];
      lista.appendChild(h3);
    }
    const div = document.createElement('div');
    div.className = "mb-6 rounded-2xl bg-white/5 p-4 border border-white/10";
    const label = document.createElement('label');
    label.className = "block font-semibold mb-2 break-words";
    label.htmlFor = `q${i + 1}`;
    label.textContent = `${i + 1}. ${texto}`;
    const textarea = document.createElement('textarea');
    textarea.name = `q${i + 1}`;
    textarea.id = `q${i + 1}`;
    textarea.rows = "4";
    textarea.className = "w-full min-h-[110px] rounded-xl bg-gray-900/60 border border-white/10 p-3";
    textarea.placeholder = "Escreva com sinceridade...";
    div.appendChild(label);
    div.appendChild(textarea);
    lista.appendChild(div);
  });
}

// --- Fluxo: iniciar / limpar / enviar (sem auto-abrir) ---
(function () {
  const APIS = [
    'https://conhecimento-com-luz-api.onrender.com',
    'https://lumen-backend-api.onrender.com'
  ];
  const MIN_CAMPOS = 10;
  const KEY_PREFIX = 'jornada_essencial_';

  const areaJornada = document.getElementById('area-jornada');
  const btnIniciar  = document.getElementById('btnIniciar');
  const btnLimpar   = document.getElementById('btnLimpar');
  const btnEnviar   = document.getElementById('btnEnviar');
  const senhaEl     = document.getElementById('senha');

  const campos = () => Array.from(document.querySelectorAll('textarea[name^="q"]'));
  function mostrarFeedback(msg, tipo='erro') {
    const el = document.getElementById('feedback');
    if (!el) return;
    el.className = `rounded-xl p-4 mb-4 text-sm ${tipo === 'sucesso' ? 'bg-green-500/20 text-green-200' : 'bg-red-500/20 text-red-200'}`;
    el.textContent = msg;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 5000);
  }
  function salvarAuto(){ campos().forEach((t,i)=>localStorage.setItem(KEY_PREFIX+(i+1), t.value)); }
  function restaurarAuto(){ campos().forEach((t,i)=>{ const v=localStorage.getItem(KEY_PREFIX+(i+1)); if(v) t.value=v; }); }

  function habilitaAcoes(on) {
    btnLimpar.disabled = !on;
    btnEnviar.disabled = !on;
    btnEnviar.classList.toggle('bg-yellow-400/60', !on);
    btnEnviar.classList.toggle('bg-yellow-400', on);
    btnEnviar.classList.toggle('hover:bg-yellow-300', on);
  }

  // nunca auto-abre: mantém escondido até clicar "Iniciar"
  areaJornada?.classList.add('hidden');
  habilitaAcoes(false);

  // aquece backends
  window.addEventListener('load', () => { APIS.forEach(api => fetch(api + '/ping').catch(()=>{})); });

  function iniciar() {
    if (!senhaEl?.value.trim()) {
      mostrarFeedback('Por favor, digite a senha de acesso.'); senhaEl?.focus(); return;
    }
    // marca início e exibe
    if (!localStorage.getItem(KEY_PREFIX + 'started_at')) {
      localStorage.setItem(KEY_PREFIX + 'started_at', new Date().toISOString());
    }
    renderPerguntas();
    setTimeout(restaurarAuto, 0);
    areaJornada?.classList.remove('hidden');
    habilitaAcoes(true);
    mostrarFeedback('Jornada iniciada. Boa escrita! ✨', 'sucesso');
  }
  btnIniciar?.addEventListener('click', iniciar);

  document.addEventListener('input', (e)=>{ if (e.target && e.target.matches('textarea[name^="q"]')) salvarAuto(); });

  btnLimpar?.addEventListener('click', ()=>{
    if (!confirm('Deseja limpar todas as respostas desta página?')) return;
    campos().forEach(t=>t.value=''); salvarAuto();
  });

  async function postComFallback(path, body) {
    const supportsAbortTimeout = typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal;
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
        return res;
      } catch { /* tenta próximo host */ }
    }
    throw new Error('Falha de rede. Tente novamente em instantes.');
  }

  btnEnviar?.addEventListener('click', async ()=>{
    if (!senhaEl?.value.trim()) { mostrarFeedback('Por favor, digite a senha de acesso.'); senhaEl?.focus(); return; }

    const respostas = campos().map((el,i)=>({ indice:i+1, pergunta: PERGUNTAS[i]||`Pergunta ${i+1}`, resposta: el.value.trim() }));
    const preenchidas = respostas.filter(r=>r.resposta.length);
    if (!preenchidas.length) return mostrarFeedback('Preencha ao menos uma resposta antes de enviar.');
    if (preenchidas.length < MIN_CAMPOS) { if (!confirm(`Somente ${preenchidas.length} respostas preenchidas. Deseja enviar assim mesmo?`)) return; }

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
      const res = await postComFallback('/jornada/essencial', payload);
      const ct = res.headers.get('Content-Type') || '';
      let data=null, blob=null, text=null;
      if (ct.includes('application/pdf')) blob = await res.blob();
      else if (ct.includes('application/json')) data = await res.json().catch(()=>null);
      else text = await res.text().catch(()=>null);

      if (!res.ok) {
        let msg = 'Erro ao enviar.';
        if (res.status === 401) msg = 'Senha inválida. Verifique e tente novamente.';
        else if (res.status === 400) msg = (data && (data.detail || data.message)) || 'Dados inválidos.';
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
        const a = document.createElement('a'); a.href = `data:application/pdf;base64,${data.pdf_base64}`; a.download = data?.pdf_filename || 'jornada-essencial.pdf'; a.click();
      } else {
        mostrarFeedback('Nenhum PDF retornado pelo servidor.', 'erro');
      }

      campos().forEach((_,i)=>localStorage.removeItem(KEY_PREFIX+(i+1)));
      localStorage.removeItem(KEY_PREFIX + 'started_at');
    } catch (err) {
      console.error(err);
      mostrarFeedback(err.message || 'Falha de rede. Tente novamente.', 'erro');
    } finally {
      btnEnviar.disabled = false; btnEnviar.textContent = oldTxt || 'Enviar respostas';
    }
  });
})();
