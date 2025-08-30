/* ============================================
   questions.js — dados + utilitários de perguntas
   Expondo: window.QUESTIONS
   ============================================ */
;(function () {
  const STORAGE_KEY = "jornada_respostas_v1";

  // === DADOS ===
  // 5 blocos com 10 perguntas cada (exemplos; substitua pelos seus textos).
  const BLOCS = [
    {
      id: "b1", title: "Bloco 1 — Raízes",
      items: [
        "Quem é você neste momento da jornada?",
        "Qual é sua maior força hoje?",
        "O que te dá coragem?",
        "Qual lembrança aquece seu coração?",
        "O que você quer aprender?",
        "Qual valor é inegociável pra você?",
        "O que você precisa perdoar?",
        "Qual hábito deseja cultivar?",
        "O que tem significado profundo hoje?",
        "Qual pequeno passo pode dar agora?",
      ]
    },
    { id:"b2", title:"Bloco 2 — Caminho", items: new Array(10).fill(0).map((_,i)=>`Pergunta ${i+11}`) },
    { id:"b3", title:"Bloco 3 — Encontros", items: new Array(10).fill(0).map((_,i)=>`Pergunta ${i+21}`) },
    { id:"b4", title:"Bloco 4 — Virtudes",  items: new Array(10).fill(0).map((_,i)=>`Pergunta ${i+31}`) },
    { id:"b5", title:"Bloco 5 — Síntese",   items: new Array(10).fill(0).map((_,i)=>`Pergunta ${i+41}`) },
  ];

  // +1 acolhimento do Lumen (pode ser exibida no final)
  const ACOLHIMENTO = {
    id:"acolhimento",
    title: "Acolhimento do Lumen",
    items: ["Deixe aqui uma palavra ao seu Eu do Futuro."]
  };

  // === PERSISTÊNCIA ===
  function loadAll(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); }
    catch(_){ return {}; }
  }
  function saveAll(obj){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj||{}));
  }

  // === API ===
  function totalBlocks(){ return BLOCS.length; }
  function totalQuestions() {
    return BLOCS.reduce((n,b)=>n+b.items.length, 0) + ACOLHIMENTO.items.length;
  }
  function getBlock(i){ return BLOCS[i] || null; }
  function getAcolhimento(){ return ACOLHIMENTO; }

  function getAnswerMap(){ return loadAll(); }
  function getAnswer(key){ return loadAll()[key] || ""; }
  function setAnswer(key, val){
    const all = loadAll(); all[key] = String(val || ""); saveAll(all);
  }

  function blockKey(blockIdx, qIdx){ return `${BLOCS[blockIdx].id}#${qIdx}`; }
  function acolhKey(){ return `${ACOLHIMENTO.id}#0`; }

  function countAnswered(){
    const all = loadAll();
    let answered = 0;
    BLOCS.forEach((b,bi)=>{
      b.items.forEach((_,qi)=>{
        if ((all[blockKey(bi,qi)]||"").trim().length>0) answered++;
      });
    });
    if ((all[acolhKey()]||"").trim().length>0) answered++;
    return answered;
  }

   // /public/js/questions.js
(function (ns) {
  const { qs, qsa, showSection } = ns;

  // Adapte este render à sua estrutura atual
  ns.renderPerguntas = function renderPerguntas(startIndex = 0) {
    // Se já existir a section #perguntas no DOM:
    const sec = qs('#perguntas');
    if (sec) {
      showSection('perguntas');
      // aqui você pode inicializar estado, bind de botões etc.
      initPerguntasUI(startIndex);
      return;
    }

    // Caso você gere perguntas dinamicamente, faça aqui:
    const app = qs('#app') || qs('main') || document.body;

    const section = document.createElement('section');
    section.id = 'perguntas';
    section.className = 'card pergaminho pergaminho-h';
    section.innerHTML = `
      <header class="titulo">
        <h2>Perguntas</h2>
        <p class="sub">Etapa de reflexão</p>
      </header>
      <div id="blocoPerguntas"></div>
      <div class="acoes">
        <button id="btnVoltarIntro">Voltar</button>
        <button id="btnProxima">Próxima</button>
      </div>
    `;

    qsa('section.card').forEach(s => s.classList.add('hidden'));
    app.appendChild(section);

    initPerguntasUI(startIndex);
  };

  function initPerguntasUI(i) {
    // Exemplos de listeners básicos
    const btnVoltar = qs('#btnVoltarIntro');
    if (btnVoltar) btnVoltar.onclick = (e) => {
      e.preventDefault();
      if (typeof ns.renderIntro === 'function') ns.renderIntro();
    };

    const btnNext = qs('#btnProxima');
    if (btnNext) btnNext.onclick = (e) => {
      e.preventDefault();
      // aqui você coloca sua lógica de avançar pergunta
      // por enquanto, só loga:
      console.log('[JORNADA] Próxima a partir do índice', i);
    };
  }
})(window.JORNADA = window.JORNADA || {});

  window.QUESTIONS = {
    BLOCS,
    ACOLHIMENTO,
    totalBlocks,
    totalQuestions,
    getBlock,
    getAcolhimento,
    blockKey,
    acolhKey,
    getAnswerMap,
    getAnswer,
    setAnswer,
    countAnswered,
  };
})();

<script src="/jornada-utils.js"></script>
<script src="/jornada-core.js"></script>

<script src="/jornada-auth.js"></script>
<script src="/questions.js"></script>

<script src="/jornada-typing-font.js"></script>
<script src="/jornada-render.js"></script>
<script src="/jornada-bootstrap.js"></script>


