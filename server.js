const path = require("path");
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

// Configuração de CORS
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://irmandade-conhecimento-com-luz.onrender.com",
    ];
    // Permitir requisições sem origem (ex.: Postman) ou de origens permitidas
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origem não permitida pelo CORS"));
    }
  },
  credentials: true,
}));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(STATIC_DIR, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith(".json")) {
      res.set("Content-Type", "application/json");
    } else if (filePath.endsWith(".js")) {
      res.set("Content-Type", "application/javascript");
    }
  },
}));

// Rota para arquivos de tradução (i18n)
app.get("/i18n/:lang.json", async (req, res) => {
  const lang = req.params.lang;
  console.log(`[${new Date().toLocaleString()}] Servindo /i18n/${lang}.json`);
  const filePath = path.join(STATIC_DIR, "i18n", `${lang}.json`);
  try {
    await fs.access(filePath);
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error(`[${new Date().toLocaleString()}] Erro ao servir /i18n/${lang}.json:`, err);
        res.status(500).json({ error: "Erro ao carregar arquivo de tradução" });
      }
    });
  } catch (err) {
    console.error(`[${new Date().toLocaleString()}] Arquivo /i18n/${lang}.json não encontrado:`, err);
    res.status(404).json({ error: `Arquivo de tradução ${lang}.json não encontrado` });
  }
});

// Fallback para rotas não encontradas
app.get("*", async (req, res) => {
  const fallbackPath = path.join(STATIC_DIR, "jornada-conhecimento-com-luz1.html");
  try {
    await fs.access(fallbackPath); // Verifica se o arquivo existe
    res.sendFile(fallbackPath);
  } catch (err) {
    console.error(`[${new Date().toLocaleString()}] Erro ao servir fallback ${fallbackPath}:`, err);
    res.status(404).json({ error: "Página não encontrada" });
  }
});

// Inicialização do servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor no ar na porta ${PORT} (${new Date().toLocaleString()})`);
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error(`[${new Date().toLocaleString()}] Erro no servidor:`, err);
  res.status(500).json({ error: "Erro interno do servidor" });
});
