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
    let s = localStorage.getItem(SESSION_KEY);
    if (!s){ s = newSessionId(); localStorage.setItem(SESSION_KEY, s); }
    return s;
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
    const res = await fetch(`${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Falha ao baixar: ' + (res.status||''));
    const blob = await res.blob();
    const a = document.createElement('a');
    const objectUrl = URL.createObjectURL(blob);
    a.href = objectUrl;
    a.download = filename || 'arquivo';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 2500);
  }

  // ===== SUBMISSÃO =====
  async function submitAll(){
    if (!validate()){
      setStatus('Preencha os campos obrigatórios marcados com *');
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
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
       cache: 'no-store',
       body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Servidor respondeu com erro ' + res.status);
      const data = await res.json();
      const pdfUrl = data?.pdf_url || data?.pdf || data?.links?.pdf;
      const hqUrl  = data?.hq_url  || data?.hq  || data?.links?.hq;

      if (!pdfUrl && !hqUrl){
        throw new Error('Servidor não retornou links de download.');
      }

      // Baixa sequencialmente mostrando status
      if (pdfUrl){
        setStatus('Baixando PDF…');
        await downloadFile(pdfUrl, 'Jornada-Conhecimento-com-Luz.pdf');
      }
      if (hqUrl){
        setStatus('Baixando HQ…');
        await downloadFile(hqUrl, 'Jornada-Conhecimento-com-Luz-HQ.pdf');
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
