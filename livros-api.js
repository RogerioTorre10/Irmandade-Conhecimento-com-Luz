// =========================================================
// LIVROS — celular virtual de Henrique ("Todo crime tem um autor?")
//
// Como funciona:
// - O leitor se cadastra com nome e e-mail e responde a um desafio
//   do livro (a primeira palavra de uma página). Recebe um código
//   pessoal de 3 dígitos, calculado a partir do e-mail. Nada é
//   gravado: o mesmo e-mail gera sempre o mesmo código.
// - Cada senha do livro é somada ao código pessoal. O servidor
//   subtrai o código e descobre qual etapa do celular abrir.
// - O conteúdo do celular fica em dados/henrique/celular.json, fora
//   da pasta public, e só é entregue etapa por etapa.
//
// HENRIQUE_SEGREDO (variável de ambiente no Render): defina uma vez,
// antes do lançamento. Se trocar depois, os códigos de todos os
// leitores mudam.
// =========================================================
const path = require("path");
const crypto = require("crypto");
const fsSync = require("fs");

const SEGREDO = process.env.HENRIQUE_SEGREDO || "irmandade-luz-henrique-2010";
const DADOS = path.join(__dirname, "dados", "henrique", "celular.json");

// Senhas fixas impressas no livro → etapa do celular
const ETAPAS = {
  4821: 1, // cap. 2  — abre o celular
  1403: 2, // cap. 7  — pasta protegida, "Sinistro 2006"
  7316: 3, // cap. 12 — e-mail pessoal
  1207: 4, // cap. 16 — gravador, "Para o Carlos"
  1071: 5, // cap. 23 — galeria e notas
  7215: 6, // cap. 27 — segundo cadeado, conversa com "A."
  1271: 7, // cap. 30 — o cartão-postal
};

// Desafio do cadastro: primeira palavra da página (sem contar o travessão),
// conferida no PDF final de 221 páginas. Se o miolo mudar, conferir de novo.
const DESAFIOS = [
  { id: "p23", pagina: 23, resposta: "cinco" },
  { id: "p47", pagina: 47, resposta: "preciso" },
  { id: "p58", pagina: 58, resposta: "pai" },
  { id: "p91", pagina: 91, resposta: "naquela" },
  { id: "p125", pagina: 125, resposta: "quem" },
  { id: "p201", pagina: 201, resposta: "freios" },
];

const normEmail = (e) => String(e || "").trim().toLowerCase();
const emailValido = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 160;
const semAcento = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z]/g, "");

function codigoPessoal(email) {
  const h = crypto.createHmac("sha256", SEGREDO).update(normEmail(email)).digest();
  return 101 + (h.readUInt32BE(0) % 899); // 101 a 999
}

// Limite simples de tentativas por IP (memória do processo)
const tentativas = new Map();
function excedeu(ip, max = 40, janelaMs = 10 * 60 * 1000) {
  const agora = Date.now();
  const lista = (tentativas.get(ip) || []).filter((t) => agora - t < janelaMs);
  lista.push(agora);
  tentativas.set(ip, lista);
  if (tentativas.size > 5000) tentativas.clear();
  return lista.length > max;
}

let cache = null;
function conteudo() {
  if (!cache || process.env.NODE_ENV !== "production") {
    cache = JSON.parse(fsSync.readFileSync(DADOS, "utf8"));
  }
  return cache;
}

module.exports = function livrosApi(app, express) {
  const json = express.json({ limit: "8kb" });
  const ipDe = (req) => (req.headers["x-forwarded-for"] || req.ip || "").toString().split(",")[0].trim();

  // Um desafio aleatório para o cadastro
  app.get("/api/henrique/desafio", (req, res) => {
    const d = DESAFIOS[crypto.randomInt(DESAFIOS.length)];
    res.set("Cache-Control", "no-store");
    res.json({ id: d.id, pergunta: `Qual é a primeira palavra da página ${d.pagina}? (sem contar o travessão)` });
  });

  // Cadastro: confere o desafio e devolve o código pessoal
  app.post("/api/henrique/cadastro", json, (req, res) => {
    if (excedeu("c:" + ipDe(req))) return res.status(429).json({ erro: "Muitas tentativas. Espere alguns minutos." });
    const { nome, email, desafio, resposta } = req.body || {};
    const e = normEmail(email);
    if (!String(nome || "").trim()) return res.status(400).json({ erro: "Escreva o seu nome." });
    if (!emailValido(e)) return res.status(400).json({ erro: "Confira o e-mail." });
    const d = DESAFIOS.find((x) => x.id === desafio);
    if (!d) return res.status(400).json({ erro: "Desafio inválido. Recarregue a página." });
    if (semAcento(resposta) !== d.resposta) {
      return res.status(403).json({ erro: `Não é essa a palavra. Abra o livro na página ${d.pagina}.` });
    }
    res.json({ codigo: codigoPessoal(e) });
  });

  // Abrir uma etapa: senha digitada = senha do livro + código pessoal
  app.post("/api/henrique/abrir", json, (req, res) => {
    if (excedeu("a:" + ipDe(req), 120)) return res.status(429).json({ erro: "Muitas tentativas. Espere alguns minutos." });
    const { email, senha } = req.body || {};
    const e = normEmail(email);
    if (!emailValido(e)) return res.status(400).json({ erro: "Entre com o e-mail do cadastro." });
    const n = Number(String(senha || "").replace(/\D/g, ""));
    if (!Number.isInteger(n) || n <= 0) return res.status(400).json({ erro: "Digite só números." });
    const base = n - codigoPessoal(e);
    const etapa = ETAPAS[base];
    if (!etapa) {
      const dica = ETAPAS[n] ? " Lembre de somar o seu código pessoal à senha do livro." : "";
      return res.status(403).json({ erro: "Senha incorreta." + dica });
    }
    const dados = conteudo();
    let c = dados.etapas[String(etapa)];
    if (etapa === 4) c = { ...c, gravador: { ...c.gravador, temAudio: Boolean(arquivoAudio()) } };
    res.set("Cache-Control", "no-store");
    res.json({ etapa, conteudo: c });
  });

  // Áudio "Para o Carlos": só sai para quem tem a senha do gravador (1207 + código pessoal)
  app.post("/api/henrique/audio", json, (req, res) => {
    if (excedeu("s:" + ipDe(req), 60)) return res.status(429).json({ erro: "Muitas tentativas. Espere alguns minutos." });
    const { email, senha } = req.body || {};
    const e = normEmail(email);
    const n = Number(String(senha || "").replace(/\D/g, ""));
    if (!emailValido(e) || ETAPAS[n - codigoPessoal(e)] !== 4) return res.status(403).json({ erro: "Senha incorreta." });
    const arq = arquivoAudio();
    if (!arq) return res.status(404).json({ erro: "Áudio ainda não disponível." });
    res.set("Cache-Control", "no-store");
    res.type(path.extname(arq).slice(1));
    res.sendFile(arq);
  });
};

// Coloque o arquivo em dados/henrique/ com um destes nomes (o primeiro que existir vale)
function arquivoAudio() {
  for (const ext of ["mp3", "m4a", "ogg", "wav"]) {
    const f = path.join(__dirname, "dados", "henrique", `para-o-carlos.${ext}`);
    if (fsSync.existsSync(f)) return f;
  }
  return null;
}
