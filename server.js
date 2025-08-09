import express from "express";
import compression from "compression";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = process.env.PORT || 10000;

app.use(compression());
app.use(
  express.static(path.join(__dirname, "public"), {
    maxAge: "1y",
    etag: true,
    immutable: true,
  })
);

// Rotas conhecidas (fallback para index.html se precisar)
app.get("*", (req, res) => {
  const known = ["/", "/index.html", "/sobre.html", "/jornadas.html", "/jornada-conhecimento.html", "/jornada-vocacional.html", "/jornada-amorosa.html", "/manifesto.html", "/contato.html"];
  if (known.includes(req.path)) {
    res.sendFile(path.join(__dirname, "public", req.path === "/" ? "index.html" : req.path.slice(1)));
  } else {
    res.status(404).sendFile(path.join(__dirname, "public", "index.html"));
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor da Irmandade no ar na porta ${port}`);
});
