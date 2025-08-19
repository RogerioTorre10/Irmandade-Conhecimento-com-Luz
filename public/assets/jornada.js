 * Jornada v10 (baseline restaurado)
 * - Intro com senha + olho mágico
 * - Render dinâmico das perguntas (QUESTIONS)
 * - Salvamento local por sessão
 * - “Limpar respostas” realmente limpa TUDO
 * - Envio ao backend + download PDF & HQ com status
 * - Finalização: limpeza geral + retorno ao início
 *******************/

(function(){
 const API_BASE = (typeof window !== 'undefined' && (window.JORNADA_API_BASE || window.API_BASE))
 ? (window.JORNADA_API_BASE || window.API_BASE)
 : 'https://conhecimento-com-luz-api.onrender.com';
 const ENDPOINT_PATH = (typeof window !== 'undefined' && (window.JORNADA_ENDPOINT_PATH || window.ENDPOINT_PATH))
 ? (window.JORNADA_ENDPOINT_PATH || window.ENDPOINT_PATH)
 : '/jornada/gerar';
 const ALLOWED_PASSWORDS =
  (typeof window !== 'undefined' && Array.isArray(window.JORNADA_ALLOWED_PASSWORDS) && window.JORNADA_ALLOWED_PASSWORDS.length)
    ? window.JORNADA_ALLOWED_PASSWORDS
    : ['iniciar','luzEterna']; // padrão (testes)

  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => Array.from(document.querySelectorAll(sel));

  // ===== SESSÃO E STORAGE =====
  const KEY_PREFIX = 'jcl:'; // tudo que for salvo começará com este prefixo
  const SESSION_KEY = KEY_PREFIX + 'sessionId';

  function newSessionId(){ return 'S' + Math.random().toString(36).slice(2) + Date.now().toString(36); }
  function getSessionId(){
   try {
     let s = localStorage.getItem(SESSION_KEY);
     if (!s){ s = newSessionId(); localStorage.setItem(SESSION_KEY, s); }
     return s;
   } catch {
     // fallback para navegação privada / quota
     return 'S-' + Date.now().toString(36);
   }

  }
  function storageKey(qid){ return `${KEY_PREFIX}${getSessionId()}:${qid}`; }

  // Remove todas as chaves desta sessão E também metadados auxiliares
    function clearAllStorage(){
-   const sid = getSessionId();
+   const sid = getSessionId();
    const toRemove = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(`${KEY_PREFIX}${sid}:`) || k === SESSION_KEY){ toRemove.push(k); }
    }
-   toRemove.forEach(k => localStorage.removeItem(k));
+   toRemove.forEach(k => { try { localStorage.removeItem(k); } catch {} });
    // recria nova sessão para começar do zero
-   localStorage.setItem(SESSION_KEY, newSessionId());
+   try { localStorage.setItem(SESSION_KEY, newSessionId()); } catch {}
  }


  // ===== RENDER DAS PERGUNTAS =====
  const QUESTIONS = (typeof window !== 'undefined' && window.QUESTIONS) ? window.QUESTIONS : [];

  function createField(q){
    const wrap = document.createElement('div');
    wrap.className = 'field';

    const label = document.createElement('label');
    label.className = 'label';
    label.setAttribute('for', q.id);
    label.textContent = q.label + (q.required ? ' *' : '');

    let input;
    if (q.type === 'textarea'){
      input = document.createElement('textarea');
      input.className = 'input-base';
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.className = 'input-base';
    }
    input.id = q.id;
    input.name = q.id;
    if (q.required) input.required = true;
   
    // carrega salvo
    const saved = localStorage.getItem(storageKey(q.id));
    if (saved) input.value = saved;

    input.addEventListener('input', () => {
    try { localStorage.setItem(storageKey(q.id), input.value.trim()); } catch {}
  });

    wrap.appendChild(label);
    wrap.appendChild(input);

    const err = document.createElement('div');
    err.className = 'err hidden';
    err.id = `err-${q.id}`;
    err.textContent = 'Campo obrigatório';
    wrap.appendChild(err);

    return wrap;
  }

  function renderQuestions(){
   const holder = qs('#questionsContainer');
    if (!holder) { console.warn('questionsContainer não encontrado'); return; }
    holder.innerHTML = '';
    if (!QUESTIONS || !QUESTIONS.length){
      holder.innerHTML = '<p class="text-slate-300">Sem perguntas carregadas. Verifique seu <code>questions.js</code>.</p>';
      return;
    }
    QUESTIONS.forEach(q => holder.appendChild(createField(q)));
  }

  // ===== VALIDAÇÃO / COLETA =====
  function validate(){
    let ok = true;
    (QUESTIONS||[]).forEach(q => {
      if (!q.required) return;
      const val = (localStorage.getItem(storageKey(q.id)) || '').trim();
      const err = qs(`#err-${q.id}`);
      if (!val){ ok = false; err && err.classList.remove('hidden'); }
      else { err && err.classList.add('hidden'); }
    });
    return ok;
  }

  function collectAnswers(){
    const obj = {};
    (QUESTIONS||[]).forEach(q => {
      obj[q.id] = (localStorage.getItem(storageKey(q.id)) || '').trim();
    });
    return obj;
  }

  // ===== UI HELPERS =====
  function setStatus(t){ const el = qs('#statusBar'); if (el) el.textContent = t; }
  function show(el){ el && el.classList.remove('hidden'); }
  function hide(el){ el && el.classList.add('hidden'); }

  // ===== DOWNLOAD =====
 async function downloadFile(url, filename){
  const a = document.createElement('a');

  // Se já for blob: ou data:, linkamos direto (não dá pra fazer fetch de blob:)
  if (/^(blob:|data:)/i.test(url)) {
    a.href = url;
  } else {
    const noCacheUrl = `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    const res = await fetch(noCacheUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao baixar: ' + (res.status || ''));
    const blob = await res.blob();
    a.href = URL.createObjectURL(blob);
    setTimeout(() => URL.revokeObjectURL(a.href), 2500);
  }

  a.download = filename || 'arquivo';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

  // ===== SUBMISSÃO =====
  async function submitAll(){
    if (!validate()){
      setStatus('Preencha os campos obrigatórios marcados com *');
     const firstErr = document.querySelector('.err:not(.hidden)');
if (firstErr) { const id = firstErr.id.replace(/^err-/, ''); const el = document.getElementById(id); el?.focus(); el?.scrollIntoView({behavior:'smooth', block:'center'}); }
return;
    }
    const payload = {
      respostas: collectAnswers(),
      metadata: {
        sessionId: getSessionId(),
        ts: new Date().toISOString(),
        app: 'Jornada Conhecimento com Luz (baseline v10)'
      }
    };

    const endpoint = `${API_BASE.replace(/\/$/,'')}/${ENDPOINT_PATH.replace(/^\//,'')}`; // garante 1 única barra
    setStatus('Enviando… gerando seus arquivos (pode levar alguns segundos)…');
    qs('#sendBtn')?.setAttribute('disabled','true');

    try {
     const ct = (res.headers.get('content-type') || '').toLowerCase();
if (res.ok && ct.includes('application/pdf')) {
  setStatus('Baixando PDF…');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  await downloadFile(url, 'Jornada-Conhecimento-com-Luz.pdf');
  URL.revokeObjectURL(url);
  setStatus('PDF recebido. Preparando HQ…');
  // segue para a HQ normalmente (o bloco de JSON abaixo será pulado via return)
  return;
}
     
 const data = await res.json();
     
// detecta URL ou base64
const pdfUrl = data?.pdf_url || data?.links?.pdf;
const hqUrl  = data?.hq_url  || data?.links?.hq;
const pdfB64 = data?.pdf_base64 || (typeof data?.pdf === 'string' && !/^https?:/i.test(data.pdf) ? data.pdf : null);
const hqB64  = data?.hq_base64  || (typeof data?.hq  === 'string' && !/^https?:/i.test(data.hq)  ? data.hq  : null);

// helper p/ baixar base64
const baixarBase64 = (b64, fname, mime) => {
  const a = document.createElement('a');
  a.href = `data:${mime};base64,${b64}`;
  a.download = fname;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

if (!pdfUrl && !hqUrl && !pdfB64 && !hqB64) {
  throw new Error('Servidor não retornou links/arquivos para download.');
}

// Baixa sequencialmente mostrando status
if (pdfUrl) {
  setStatus('Baixando PDF…');
  await downloadFile(pdfUrl, 'Jornada-Conhecimento-com-Luz.pdf');
} else if (pdfB64) {
  setStatus('Preparando PDF…');
  baixarBase64(pdfB64, 'Jornada-Conhecimento-com-Luz.pdf', 'application/pdf');
}

if (hqUrl) {
  setStatus('Baixando HQ…');
  await downloadFile(hqUrl, 'Jornada-Conhecimento-com-Luz-HQ.png');
} else if (hqB64) {
  setStatus('Preparando HQ…');
  baixarBase64(hqB64, 'Jornada-Conhecimento-com-Luz-HQ.png', 'image/png');
}
     
      if (hqUrl){
        setStatus('Baixando HQ…');
       await downloadFile(hqUrl, 'Jornada-Conhecimento-com-Luz-HQ.png');
      }

      setStatus('PDF e HQ finalizados. Limpando dados…');
      clearAllStorage();
     try { sessionStorage.removeItem('journey-started'); sessionStorage.removeItem('veio_da_intro'); } catch {}

      // Mostra tela final bem simples
      hide(qs('#questions-screen'));
      show(qs('#final-screen'));
      setStatus('Finalizado! Voltando ao início…');
      setTimeout(() => {
        // Redireciona para a principal
        location.href = '/index.html';
      }, 3000);

    } catch (err){
      console.error(err);
      setStatus('Falha ao gerar/baixar. Verifique sua conexão ou espaço no dispositivo e tente novamente.');
      qs('#sendBtn')?.removeAttribute('disabled');
    }
  }

  // ===== INICIALIZAÇÃO =====
  function attachEvents(){
    // Olho mágico
    qs('#toggleSenha')?.addEventListener('click', () => {
      const f = qs('#senha'); if (!f) return;
      f.type = (f.type === 'password') ? 'text' : 'password';
    });
   qs('#senha')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); qs('#startBtn')?.click(); }
});

    // Start
    qs('#startBtn')?.addEventListener('click', () => {
      const pwd = (qs('#senha')?.value || '').trim();
      if (!ALLOWED_PASSWORDS.includes(pwd)){
        qs('#introMsg').textContent = 'Senha inválida. Verifique e tente novamente.';
        return;
       try { sessionStorage.setItem('journey-started','1'); sessionStorage.setItem('veio_da_intro','1'); } catch {}
      }
     
      // Libera perguntas
      hide(qs('#intro-screen'));
      show(qs('#questions-screen'));
      setStatus('Respondendo…');
      renderQuestions();
    });

    // Revisar
    qs('#reviewBtnTop')?.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    qs('#reviewBtnFinal')?.addEventListener('click', () => {
      hide(qs('#final-screen')); show(qs('#questions-screen'));
      setStatus('Revendo respostas…');
    });

    // Limpar tudo
    qs('#clearBtn')?.addEventListener('click', () => {
      if (confirm('Tem certeza que deseja apagar TODAS as respostas?')){
        clearAllStorage();
        renderQuestions();
        setStatus('Respostas apagadas.');
      }
    });

    // Enviar (gerar PDF + HQ)
    qs('#sendBtn')?.addEventListener('click', submitAll);
  }

  // Mostra intro sempre no primeiro acesso
 function boot(){
  const params = new URLSearchParams(location.search);
  const started =
    params.get('start') === '1' ||
    (typeof sessionStorage !== 'undefined' && (
      sessionStorage.getItem('journey-started') === '1' ||
      sessionStorage.getItem('veio_da_intro') === '1'
    ));

  if (started) {
    hide(qs('#intro-screen'));
    show(qs('#questions-screen'));
    hide(qs('#final-screen'));
    renderQuestions();
    setStatus('Respondendo…');
  } else {
    show(qs('#intro-screen'));
    hide(qs('#questions-screen'));
    hide(qs('#final-screen'));
    setStatus('Pronto.');
  }

  document.addEventListener('DOMContentLoaded', () => { boot(); attachEvents(); });
})();
