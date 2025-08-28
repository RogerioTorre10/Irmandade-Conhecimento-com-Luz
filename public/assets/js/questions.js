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
