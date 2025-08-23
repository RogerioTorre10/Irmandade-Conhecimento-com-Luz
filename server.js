const path = require("path");
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const STATIC_DIR = path.join(__dirname, "public");

app.use(cors());
app.use((_, res, next)=>{ res.setHeader('X-Content-Type-Options','nosniff'); next(); });

app.use('/assets', express.static(path.join(STATIC_DIR, 'assets'), { maxAge: '7d', immutable: true }));
app.use('/css',    express.static(path.join(STATIC_DIR, 'css'),    { maxAge: '1h' }));
app.use('/js',     express.static(path.join(STATIC_DIR, 'js'),     { maxAge: '1h' }));
app.use(express.static(STATIC_DIR, { maxAge: '1h' }));

app.get('*', (_req, res)=> res.sendFile(path.join(STATIC_DIR, 'index.html')));

app.listen(PORT, ()=> console.log(`Web rodando na porta ${PORT}`));
