/* jornada.js — estável + caminhos atualizados */
(function () {
  // Detecta API_BASE da página anterior ou recalcula
  const CANDIDATES = [
    "https://lumen-backend-api.onrender.com",
    "https://conhecimento-com-luz-api.onrender.com"
  ];

  async function detectApi() {
    if (window.API_BASE) return window.API_BASE;
    for (const base of CANDIDATES) {
      try {
        const r = await fetch(base + "/health", { method: "GET", mode: "cors" });
        if (r.ok) return base;
      } catch {}
      try {
        const r2 = await fetch(base + "/", { method: "GET", mode: "cors" });
        if (r2.ok) return base;
      } catch {}
    }
    return null;
  }

  // Atualiza badge se existir na página desta jornada
  function setBadgeOnline(ok) {
    const badge = document.getElementById("lumen-badge");
    if (!badge) return;
    if (ok) {
      badge.textContent = "Lumen: online ✓";
      badge.className =
        "text-sm px-2 py-1 rounded-md bg-emerald-600/20 text-emerald-300 border border-emerald-500/40";
    } else {
      badge.textContent = "Lumen: offline ✖";
      badge.className =
        "text-sm px-2 py-1 rounded-md bg-red-600/20 text-red-300 border border-red-500/40";
    }
  }

  // Exemplo de envio de respostas (rotas de ontem)
  async function enviarRespostas(payload) {
    const base = await detectApi();
    setBadgeOnline(!!base);
    if (!base) throw new Error("Backend indisponível");

    const res = await fetch(base + "/jornada/essencial", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json, application/pdf" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error("Falha ao enviar: " + res.status + " " + txt);
    }
    return res; // JSON ou blob/pdf conforme a rota
  }

  // Expõe funções globais para o HTML da jornada
  window.JORNADA = { enviarRespostas, detectApi };
})();
