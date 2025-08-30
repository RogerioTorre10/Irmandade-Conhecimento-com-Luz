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
    "http://localhost:5173", // se usar vite
    "https://irmandade-conhecimento-com-luz.onrender.com"
  ],
  credentials: true
}));

// Servir arquivos estáticos
app.use(express.static(STATIC_DIR, { extensions: ["html"] }));

// Fallback: qualquer rota não encontrada → index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(STATIC_DIR, "index.html"));
});

// Inicialização
app.listen(PORT, () => {
  console.log(`🚀 Servidor no ar na porta ${PORT} (${new Date().toLocaleString()})`);
});
