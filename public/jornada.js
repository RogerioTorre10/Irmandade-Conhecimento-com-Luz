/* jornada.js — raiz do /public (NÃO colocar em /assets/js) */
(() => {
  // Candidatos de backend (mantém a ordem que funcionou ontem)
  const CANDIDATES = [
    "https://lumen-backend-api.onrender.com",
    "https://conhecimento-com-luz-api.onrender.com"
  ];

  const badge = document.getElementById("lumen-badge");

  async function ping(api) {
    try {
      const r = await fetch(api + "/health", { method: "GET", mode: "cors" });
      if (r.ok) return true;
    } catch {}
    try {
      const r2 = await fetch(api + "/", { method: "GET", mode: "cors" });
      return r2.ok;
    } catch {}
    return false;
  }

  async function detectApi() {
    for (const base of CANDIDATES) {
      if (await ping(base)) return base;
    }
    return null;
  }

  function setBadge(ok) {
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

  // === Envio dos CHAMADOS (com fallback de endpoint) =========================
  // 1ª tentativa: /chamados   | 2ª tentativa: /jornada/essencial
  async function enviarChamado(payload) {
    const base = await detectApi();
    setBadge(!!base);
    if (!base) throw new Error("Backend indisponível");

    const rotas = ["/chamados", "/jornada/essencial"];
    let ultimaFalha = "";
    for (const rota of rotas) {
      try {
        const res = await fetch(base + rota, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json, application/pdf" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        // se vier PDF, você pode baixar:
        const ct = res.headers.get("content-type") || "";
        if (ct.includes("application/pdf")) {
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "pergaminho.pdf";
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          return { ok: true, tipo: "pdf" };
        }
        const data = await res.json().catch(() => ({}));
        return { ok: true, tipo: "json", data };
      } catch (err) {
        ultimaFalha = err.message || String(err);
      }
    }
    throw new Error("Falha ao enviar chamado: " + ultimaFalha);
  }

  // Facilita o uso via formulário com id="form-chamado"
  async function handleChamadoSubmit(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const btn = form.querySelector("[data-send]");
    const out = form.querySelector("[data-out]");

    btn?.setAttribute("disabled", "true");
    out && (out.textContent = "enviando…");

    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await enviarChamado(payload);
      out && (out.textContent = r.ok ? "Chamado enviado com sucesso!" : "Houve um alerta.");
      form.reset();
    } catch (e) {
      out && (out.textContent = "Erro: " + e.message);
    } finally {
      btn?.removeAttribute("disabled");
    }
  }

  // Auto-bind se existir formulário
  window.addEventListener("DOMContentLoaded", async () => {
    const base = await detectApi();
    setBadge(!!base);
    const form = document.getElementById("form-chamado");
    if (form) form.addEventListener("submit", handleChamadoSubmit);
  });

  // Expor se precisar em outras páginas
  window.LUMEN = { enviarChamado, detectApi };
})();
