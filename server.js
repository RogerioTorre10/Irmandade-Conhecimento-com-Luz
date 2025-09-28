const path = require("path");
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

// Utilitário de log com timestamp
const log = (...args) => console.log(`[${new Date().toLocaleString()}]`, ...args);

// CORS liberado para origens confiáveis
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://irmandade-conhecimento-com-luz.onrender.com"
  ],
  credentials: true,
}));

// Logging de requisições
app.use((req, res, next) => {
  log(`${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos da pasta public
app.use(express.static(STATIC_DIR, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".json")) res.set("Content-Type", "application/json");
    if (filePath.endsWith(".js")) res.set("Content-Type", "application/javascript");
    if (filePath.endsWith(".mp4")) res.set("Content-Type", "video/mp4");
  },
}));

// Rota para arquivos de tradução i18n dentro de /assets/js/i18n/
app.get("/assets/js/i18n/:lang.json", async (req, res) => {
  const lang = req.params.lang;
  const filePath = path.join(STATIC_DIR, "assets", "js", "i18n", `${lang}.json`);
  try {
    await fs.access(filePath);
    log(`Servindo /assets/js/i18n/${lang}.json`);
    res.sendFile(filePath);
  } catch (err) {
    log(`Arquivo de tradução ${lang}.json não encontrado`);
    const fallbackPath = path.join(STATIC_DIR, "assets", "js", "i18n", "pt-BR.json");
    try {
      await fs.access(fallbackPath);
      log(`Servindo fallback pt-BR.json`);
      res.sendFile(fallbackPath);
    } catch (fallbackErr) {
      log(`Fallback pt-BR.json também não encontrado`, fallbackErr);
      if (!res.headersSent) {
        res.status(404).json({ error: `Arquivo de tradução ${lang}.json não encontrado` });
      }
    }
  }
});

// Fallback para SPA
app.get("*", async (req, res) => {
  const fallbackPath = path.join(STATIC_DIR, "jornada-conhecimento-com-luz1.html");
  try {
    await fs.access(fallbackPath);
    res.sendFile(fallbackPath);
  } catch (err) {
    log(`Erro ao servir fallback ${fallbackPath}:`, err);
    if (!res.headersSent) {
      res.status(404).json({ error: "Página não encontrada" });
    }
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  log(`🚀 Servidor rodando na porta ${PORT}`);
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
  log(`Erro interno do servidor`, err);
  if (!res.headersSent) {
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});
