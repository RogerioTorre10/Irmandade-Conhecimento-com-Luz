// server.js
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// >>> Se quiser mudar a raiz estática para 'docs', troque aqui:
const STATIC_DIR = path.join(__dirname, "public");

// CORS (libere só os domínios que você usa)
const ALLOWED = [
  'http://localhost:3000',
  'https://irmandade-conhecimento-com-luz-1.onrender.com'
];
app.use(cors({
  origin: (origin, cb) => (!origin || ALLOWED.includes(origin)) ? cb(null, true) : cb(new Error('Origem não permitida: ' + origin), false),
  credentials: true
}));

// Cabeçalhos defensivos
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// Static (HTML/CSS/JS) + assets com cache
app.use('/assets', express.static(path.join(STATIC_DIR, 'assets'), { maxAge: '7d', immutable: true }));
app.use('/css', express.static(path.join(STATIC_DIR, 'css'), { maxAge: '1h' }));
app.use('/js', express.static(path.join(STATIC_DIR, 'js'), { maxAge: '1h' }));
app.use(express.static(STATIC_DIR, { maxAge: '1h' }));

// SPA fallback
app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

app.listen(PORT, () => console.log(`Irmandade web rodando na porta ${PORT}`));
