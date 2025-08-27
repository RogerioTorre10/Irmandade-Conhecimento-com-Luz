// jornada-core.js
// Config central + estado + helpers de API

const APP = (typeof window !== "undefined" && window.APP_CONFIG) ? window.APP_CONFIG : {};

export const JORNADA_CFG = {
  STORAGE_KEY: APP.STORAGE_KEY || "jornada_essencial_v1",
  API_BASE: (APP.API_BASE || "https://lumen-backend-api.onrender.com/api").replace(/\/+$/, ""),
  PASS: (APP.PASS || "iniciar").toString(),
  ENV: APP.ENV || "prod",
};

// Perguntas: usa window.JORNADA_QUESTIONS se existir; senão fallback
const FALLBACK_QUESTIONS = [
  { id: "q1", titulo: "Quem é você hoje e o que deseja transformar?" },
  { id: "q2", titulo: "Qual lembrança te acende fé quando tudo parece difícil?" },
  { id: "q3", titulo: "Em uma palavra, qual é sua missão?" },
  { id: "q4", titulo: "Quais hábitos deseja fortalecer nos próximos 30 dias?" },
  { id: "q5", titulo: "De 0 a 10, qual seu nível de esperança? Por quê?" }
];

export const JORNADA_PERGUNTAS =
  Array.isArray(window.JORNADA_QUESTIONS) && window.JORNADA_QUESTIONS.length
    ? window.JORNADA_QUESTIONS.map((q, i) =>
        typeof q === "string" ? { id: `q${i+1}`, titulo: q } :
        { id: q.id || `q${i+1}`, titulo: q.t || q.titulo || q.pergunta || `Pergunta ${i+1}` }
      )
    : FALLBACK_QUESTIONS;

export const S = {
  state: {
    auth: false,
    step: "intro",   // intro -> perguntas -> final
    qIndex: 0,       // índice da pergunta atual (wizard)
    respostas: {}    // { qid: texto }
  },
  load() {
    try { return JSON.parse(localStorage.getItem(JORNADA_CFG.STORAGE_KEY) || "{}"); }
    catch { return {}; }
  },
  save(data) {
    localStorage.setItem(JORNADA_CFG.STORAGE_KEY, JSON.stringify(data || {}));
  },
  clear() {
    localStorage.removeItem(JORNADA_CFG.STORAGE_KEY);
  }
};

// Candidatos de base para fallback (com/sem /api)
export function apiBases() {
  const b = JORNADA_CFG.API_BASE;
  return /\/api$/.test(b) ? [b, b.replace(/\/api$/, "")] : [b, b + "/api"];
}

export function buildPayload(state) {
  return {
    meta: {
      ts: new Date().toISOString(),
      env: JORNADA_CFG.ENV,
      storage_key: JORNADA_CFG.STORAGE_KEY,
      version: "mod-1.0"
    },
    answers: state.respostas || {}
  };
}
