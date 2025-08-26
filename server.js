const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

// CORS configurado para desenvolvimento e produção
app.use(cors({
  origin: process.env.NODE_ENV === "development" ? true : "https://irmandade-conhecimento-com-luz.onrender.com",
  credentials: true
}));

// Serve arquivos estáticos
app.use(express.static(STATIC_DIR, { extensions: ["html"] }));

// Log de inicialização
app.listen(PORT, () => {
  console.log(`Servidor no ar na porta ${PORT} em ${new Date().toLocaleString()}`);
});
