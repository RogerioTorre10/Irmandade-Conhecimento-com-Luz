const path = require("path");
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;

const app = express();
const PORT = process.env.PORT || 3000;
const STATIC_DIR = path.join(__dirname, "public");

// Utilitário de log com timestamp
const log = (...args) => console.log(`[${new Date().toLocaleString()}]`, ...args);

// ✅ CORS liberado para QUALQUER origem (inclusive "null", que é a origem
// dentro do iframe da Hotmart). Sem isso a página fica preta no checkout.
app.use(cors({ origin: true, credentials: false }));
app.options("*", cors());

// ✅ Permitir que o site seja exibido dentro do iframe da Hotmart
app.use((req, res, next) => {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Security-Policy", "frame-ancestors *");
  res.setHeader("Access-Control-Allow-Origin", "*");
  log(`${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos da pasta public
app.use(express.static(STATIC_DIR, {
  extensions: ["html"],
  setHeaders: (res, filePath) => {
    res.set("Access-Control-Allow-Origin", "*");
    if (filePath.endsWith(".json")) res.set("Content-Type", "application/json");
    if (filePath.endsWith(".js")) res.set("Content-Type", "application/javascript");
    if (filePath.endsWith(".mp4")) res.set("Content-Type", "video/mp4");
  },
}));

// =========================================================
// VOZ NEURAL (ElevenLabs) — narração épica/aveludada
// A chave fica só no servidor (variável de ambiente no Render).
// Sem chave configurada, o front usa a voz do navegador (fallback).
// =========================================================
const crypto = require("crypto");
const os = require("os");

const TTS_KEY = process.env.ELEVENLABS_API_KEY || "";
const TTS_MODEL = process.env.ELEVENLABS_MODEL || "eleven_multilingual_v2";
const TTS_DEFAULT_VOICE = process.env.ELEVENLABS_VOICE_ID || "";
const TTS_VOICES = {
  lumen: process.env.ELEVENLABS_VOICE_LUMEN || TTS_DEFAULT_VOICE,
  zion: process.env.ELEVENLABS_VOICE_ZION || TTS_DEFAULT_VOICE,
  arian: process.env.ELEVENLABS_VOICE_ARIAN || TTS_DEFAULT_VOICE,
  cerimonial: process.env.ELEVENLABS_VOICE_CERIMONIAL || TTS_DEFAULT_VOICE,
};
const TTS_ENABLED = Boolean(TTS_KEY && TTS_DEFAULT_VOICE);
const TTS_CACHE_DIR = path.join(os.tmpdir(), "jornada-tts-cache");
const TTS_MAX_CHARS = 1500;
const ttsMemCache = new Map(); // hash -> Buffer (LRU simples)
const TTS_MEM_MAX = 200;
const ttsHits = new Map(); // ip -> [timestamps]

function ttsRateOk(ip) {
  const now = Date.now();
  const list = (ttsHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  ttsHits.set(ip, list);
  return list.length <= 120;
}

function ttsMemSet(key, buf) {
  ttsMemCache.delete(key);
  ttsMemCache.set(key, buf);
  if (ttsMemCache.size > TTS_MEM_MAX) ttsMemCache.delete(ttsMemCache.keys().next().value);
}

app.get("/api/tts/status", (req, res) => {
  res.json({ enabled: TTS_ENABLED });
});

app.post("/api/tts", express.json({ limit: "16kb" }), async (req, res) => {
  if (!TTS_ENABLED) return res.status(503).json({ error: "tts desativado" });

  const text = String(req.body?.text || "").replace(/\s+/g, " ").trim();
  const guideRaw = String(req.body?.guide || "lumen").toLowerCase();
  const guide = TTS_VOICES[guideRaw] ? guideRaw : "lumen";
  if (!text) return res.status(400).json({ error: "texto vazio" });
  if (text.length > TTS_MAX_CHARS) return res.status(413).json({ error: "texto longo demais" });
  if (!ttsRateOk(req.ip)) return res.status(429).json({ error: "muitas requisições" });

  const voiceId = TTS_VOICES[guide];
  const key = crypto.createHash("sha1").update(`${TTS_MODEL}|${voiceId}|${text}`).digest("hex");
  const file = path.join(TTS_CACHE_DIR, `${key}.mp3`);

  const send = (buf) => {
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.end(buf);
  };

  const mem = ttsMemCache.get(key);
  if (mem) return send(mem);
  try {
    const buf = await fs.readFile(file);
    ttsMemSet(key, buf);
    return send(buf);
  } catch {}

  try {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": TTS_KEY, "Content-Type": "application/json", Accept: "audio/mpeg" },
        body: JSON.stringify({
          text,
          model_id: TTS_MODEL,
          voice_settings: {
            stability: Number(process.env.ELEVENLABS_STABILITY ?? 0.55),
            similarity_boost: Number(process.env.ELEVENLABS_SIMILARITY ?? 0.85),
            style: Number(process.env.ELEVENLABS_STYLE ?? 0.3),
            use_speaker_boost: true,
          },
        }),
      }
    );
    if (!r.ok) {
      log(`TTS ElevenLabs falhou: ${r.status} ${(await r.text()).slice(0, 200)}`);
      return res.status(502).json({ error: "falha no tts" });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    ttsMemSet(key, buf);
    fs.mkdir(TTS_CACHE_DIR, { recursive: true }).then(() => fs.writeFile(file, buf)).catch(() => {});
    return send(buf);
  } catch (err) {
    log("TTS erro:", err?.message || err);
    if (!res.headersSent) res.status(502).json({ error: "falha no tts" });
  }
});

// Rota para arquivos de tradução i18n dentro de /assets/js/i18n/
app.get("/assets/js/i18n/:lang.json", async (req, res) => {
  const lang = req.params.lang;
  const filePath = path.join(STATIC_DIR, "assets", "js", "i18n", `${lang}.json`);
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    await fs.access(filePath);
    log(`Servindo /assets/js/i18n/${lang}.json`);
    res.setHeader("Content-Type", "application/json");
    res.sendFile(filePath);
  } catch (err) {
    log(`Arquivo de tradução ${lang}.json não encontrado`);
    const fallbackPath = path.join(STATIC_DIR, "assets", "js", "i18n", "pt-BR.json");
    try {
      await fs.access(fallbackPath);
      log(`Servindo fallback pt-BR.json`);
      res.setHeader("Content-Type", "application/json");
      res.sendFile(fallbackPath);
    } catch (fallbackErr) {
      log(`Fallback pt-BR.json também não encontrado`, fallbackErr);
      if (!res.headersSent) {
        res.status(404).json({ error: `Arquivo de tradução ${lang}.json não encontrado` });
      }
    }
  }
});

app.get("*", async (req, res, next) => {
  // Ignora arquivos estáticos
  if (
    req.path.endsWith(".js") ||
    req.path.endsWith(".json") ||
    req.path.endsWith(".css") ||
    req.path.endsWith(".woff") ||
    req.path.endsWith(".woff2") ||
    req.path.endsWith(".ttf")
  ) {
    return next();
  }

  const fallbackPath = path.join(STATIC_DIR, "jornada-conhecimento-com-luz.html");
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
