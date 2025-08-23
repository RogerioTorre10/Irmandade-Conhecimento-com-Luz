const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

const ALLOWED = [
  "http://localhost:3000",
  "https://irmandade-conhecimento-com-luz.onrender.com"
];
app.use(cors({
  origin: (origin, cb) => (!origin || ALLOWED.includes(origin)) ? cb(null, true)
    : cb(new Error("Origem não permitida: " + origin), false),
  credentials: true
}));

app.use((_, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  next();
});

// Sirva pastas explícitas para garantir MIME correto
app.use("/assets", express.static(path.join(STATIC_DIR, "assets"), { maxAge: "7d", immutable: true }));
app.use("/css",    express.static(path.join(STATIC_DIR, "css"),    { maxAge: "1h" }));
app.use("/js",     express.static(path.join(STATIC_DIR, "js"),     { maxAge: "1h" }));

// index.html e demais na raiz de /public
app.use(express.static(STATIC_DIR, { maxAge: "1h" }));

app.get("/healthz", (_req, res) => res.send("ok"));

app.listen(PORT, () => console.log(`Irmandade web rodando na porta ${PORT}`));
