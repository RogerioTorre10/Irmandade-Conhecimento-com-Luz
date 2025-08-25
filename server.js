const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

app.use(cors({ origin: true, credentials: true }));

// Serve arquivos estáticos (HTML, CSS, JS, imagens)
app.use(express.static(STATIC_DIR, { extensions: ["html"] }));

// Rotas explícitas (opcional)
app.get("/", (_,res)=>res.sendFile(path.join(STATIC_DIR,"index.html")));
app.get("/jornadas.html", (_,res)=>res.sendFile(path.join(STATIC_DIR,"jornadas.html")));
app.get("/jornada-conhecimento-com-luz1.html", (_,res)=>res.sendFile(path.join(STATIC_DIR,"jornada-conhecimento-com-luz1.html")));

app.listen(PORT, ()=> console.log("Servidor no ar na porta", PORT));
