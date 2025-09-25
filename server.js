// server.js
const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

// Configuração de CORS
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://irmandade-conhecimento-com-luz.onrender.com"
  ],
  credentials: true
}));

// Servir arquivos estáticos (incluindo .js e .json)
app.use(express.static(STATIC_DIR, { 
  extensions: ["html"],
  setHeaders: (res, path) => {
    if (path.endsWith('.json')) {
      res.set('Content-Type', 'application/json');
    } else if (path.endsWith('.js')) {
      res.set('Content-Type', 'application/javascript');
    }
  }
}));

// Rota específica para arquivos JSON em /assets/js/i18n/ (se ainda estiver nesse caminho)
app.get("/assets/js/i18n/:lang.json", (req, res) => {
  const filePath = path.join(STATIC_DIR, "assets", "js", "i18n", `${req.params.lang}.json`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Erro ao servir /assets/js/i18n/${req.params.lang}.json:`, err);
      res.status(404).send('Arquivo não encontrado');
    }
  });
});

// Rota específica para /i18n/ (caminho padrão)
app.get("/i18n/:lang.json", (req, res) => {
  const filePath = path.join(STATIC_DIR, "i18n", `${req.params.lang}.json`);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error(`Erro ao servir /i18n/${req.params.lang}.json:`, err);
      res.status(404).send('Arquivo não encontrado');
    }
  });
});

// Fallback: qualquer outra rota não encontrada → index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(STATIC_DIR, "jornada-conhecimento-com-luz1.html"));
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Servidor no ar na porta ${PORT} (${new Date().toLocaleString()})`);
});
