* Jornada v10 (baseline restaurado)
 * - Intro com senha + olho mágico
 * - Render dinâmico das perguntas (QUESTIONS)
 * - Salvamento local por sessão
 * - “Limpar respostas” realmente limpa TUDO
 * - Envio ao backend + download PDF & HQ com status
 * - Finalização: limpeza geral + retorno ao início
 *******************/

(function(){
  const API_BASE = (typeof window !== 'undefined' && window.API_BASE) ? window.API_BASE : 'https://conhecimento-com-luz-api.onrender.com';
  const ENDPOINT_PATH = (typeof window !== 'undefined' && window.ENDPOINT_PATH) ? window.ENDPOINT_PATH : '/jornada/gerar';
  const ALLOWED_PASSWORDS = ['iniciar','luzEterna']; // para testes

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
    const sid = getSessionId();
    const toRemove = [];
    for (let i=0;i<localStorage.length;i++){
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith(`${KEY_PREFIX}${sid}:`) || k === SESSION_KEY){ toRemove.push(k); }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    // recria nova sessão para começar do zero
    localStorage.setItem(SESSION_KEY, newSessionId());
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

    // carrega salvo
    const saved = localStorage.getItem(storageKey(q.id));
    if (saved) input.value = saved;

    input.addEventListener('input', () => {
      localStorage.setItem(storageKey(q.id), input.value.trim());
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

  function renderQuest
```
