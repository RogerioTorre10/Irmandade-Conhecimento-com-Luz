// server.js (unificado)
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// >>> raiz dos arquivos públicos
const STATIC_DIR = path.join(__dirname, "public");

// --- CORS (libere só os domínios que você usa) ---
const ALLOWED = [
  "http://localhost:3000",
  // ajuste aqui para o SEU domínio final:
  "https://irmandade-conhecimento-com-luz.onrender.com"
  // se tiver outro domínio, adicione aqui
];
app.use(cors({
  origin: (origin, cb) => (!origin || ALLOWED.includes(origin)) ? cb(null, true)
    : cb(new Error("Origem não permitida: " + origin), false),
  credentials: true
}));

// --- Cabeçalhos defensivos (evita MIME sniffing errado) ---
app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// --- Arquivos estáticos com cache adequado ---
app.use("/assets", express.static(path.join(STATIC_DIR, "assets"), { maxAge: "7d", immutable: true }));
app.use("/css",    express.static(path.join(STATIC_DIR, "css"),    { maxAge: "1h" }));
app.use("/js",     express.static(path.join(STATIC_DIR, "js"),     { maxAge: "1h" }));

// também serve a raiz (index.html, etc.)
app.use(express.static(STATIC_DIR, { maxAge: "1h" }));

// --- Healthcheck simples (útil no Render) ---
app.get("/healthz", (_req, res) => res.status(200).send("ok"));

// --- SPA fallback (opcional). Descomente se precisar de rotas de front (ex: /app/rota) ---
// app.get("*", (_req, res) => {
//   res.sendFile(path.join(STATIC_DIR, "index.html"));
// });

app.listen(PORT, () => console.log(`Irmandade web rodando na porta ${PORT}`));
