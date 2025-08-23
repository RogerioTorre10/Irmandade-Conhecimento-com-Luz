const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Diretório estático agora é a pasta 'public'
const STATIC_DIR = path.join(__dirname, 'public');

// CORS para permitir acesso de domínios específicos
const ALLOWED_URLS = [
  'http://localhost:3000',
  'https://irmandade-conhecimento-com-luz-1.onrender.com'
];
app.use(cors({
  origin: (origin, callback) => {
    if (ALLOWED_URLS.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida: ' + origin), false);
    }
  },
  credentials: true
}));

// Servir todos os arquivos estáticos de forma única
// Esta única linha substitui todas as suas linhas de app.use(express.static(...))
app.use(express.static(STATIC_DIR));

// Rota de fallback para o HTML
// Apenas se necessário, se for um SPA. Se não for, pode ser removida.
// app.get('*', (req, res) => {
//   res.sendFile(path.join(STATIC_DIR, 'index.html'));
// });

app.listen(PORT, () => {
  console.log(`Irmandade web rodando na porta ${PORT}`);
});
