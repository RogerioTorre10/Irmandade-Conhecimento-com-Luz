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

// Servir arquivos estáticos
app.use(express.static(STATIC_DIR, { extensions: ["html"] }));

// Rota específica para arquivos JSON
app.get("/i18n/:lang.json", (req, res) => {
  const filePath = path.join(STATIC_DIR, "i18n", `${req.params.lang}.json`);
  res.sendFile(filePath, {
    headers: { "Content-Type": "application/json" }
  }, (err) => {
    if (err) {
      console.error(`Erro ao servir /i18n/${req.params.lang}.json:`, err);
      res.status(404).json({ error: "Arquivo JSON não encontrado" });
    }
  });
});

// Fallback: qualquer outra rota não encontrada → index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Servidor no ar na porta ${PORT} (${new Date().toLocaleString()})`);
});
