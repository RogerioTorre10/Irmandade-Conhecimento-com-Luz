// journey.js — seguro e carinhoso 😊
document.addEventListener("DOMContentLoaded", () => {
  const iniciarBtn   = document.getElementById("iniciarBtn");
  const senhaInput   = document.getElementById("senha");
  const mensagemDiv  = document.getElementById("mensagem");
  const formularioDiv= document.getElementById("formulario");
  if (!iniciarBtn || !senhaInput || !mensagemDiv || !formularioDiv) return;

  // ===== Config de API com fallbacks =====
  const API_BASE =
    (typeof API_URL === "string" && API_URL) ||
    window.API_BASE ||
    window.JORNADA_API_BASE ||
    (window.API && (window.API.API_PRIMARY || window.API.API_FALLBACK)) ||
    "https://conhecimento-com-luz-api.onrender.com";

  const ENDPOINTS = {
    validate: (typeof TOKEN_VALIDATION_ENDPOINT === "string" && TOKEN_VALIDATION_ENDPOINT) || "/validate-token",
    start:    (typeof JOURNEY_START_ENDPOINT      === "string" && JOURNEY_START_ENDPOINT)      || "/start-journey",
  };

  // ===== Helpers =====
  const toast = (msg) => {
    try { (typeof window.toast === "function" ? window.toast : console.log)(msg); } catch {}
  };

  const setBusy = (busy) => {
    iniciarBtn.disabled = !!busy;
    iniciarBtn.setAttribute("aria-busy", busy ? "true" : "false");
    iniciarBtn.dataset._label ??= iniciarBtn.textContent;
    iniciarBtn.textContent = busy ? "Aguarde…" : iniciarBtn.dataset._label;
  };

  const urlJoin = (base, path) => new URL(path, base).toString();

  async function postJSON(path, body) {
    const res = await fetch(urlJoin(API_BASE, path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
      mode: "cors",
      credentials: "omit",
    });
    let data = null;
    try { data = await res.json(); } catch {}
    return { ok: res.ok, status: res.status, data };
  }

  async function getText(path) {
    const res = await fetch(urlJoin(API_BASE, path), { mode: "cors", credentials: "omit" });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text };
  }

  // ===== Fluxo =====
  iniciarBtn.addEventListener("click", async () => {
    const senha = (senhaInput.value || "").trim();

    if (!senha) {
      mensagemDiv.textContent = "Por favor, digite a senha de acesso.";
      toast("Informe a senha para continuar.");
      senhaInput.focus();
      return;
    }

    setBusy(true);
    mensagemDiv.textContent = "Validando senha...";

    try {
      const { ok, data, status } = await postJSON(ENDPOINTS.validate, { token: senha });

      if (!ok) {
        const msg = (data && (data.message || data.error)) || `Senha inválida (HTTP ${status}).`;
        mensagemDiv.textContent = msg;
        toast(msg);
        return;
      }

      mensagemDiv.textContent = "Senha válida! Iniciando a jornada...";
      await iniciarJornada();
    } catch (err) {
      console.error(err);
      mensagemDiv.textContent = "Erro ao validar senha. Tente novamente.";
      toast("Falha na validação. Verifique sua conexão ou tente mais tarde.");
    } finally {
      setBusy(false);
    }
  });

  async function iniciarJornada() {
    try {
      const { ok, text, status } = await getText(ENDPOINTS.start);
      if (!ok) throw new Error(`HTTP ${status}`);

      formularioDiv.innerHTML = text;
      mensagemDiv.textContent = "";

      // Se a página injetada já contém as seções da Jornada, tenta mostrar a primeira
      const first =
        document.getElementById("section-intro") ||
        document.getElementById("section-termos") ||
        document.querySelector(".j-section:not(.hidden)") ||
        null;

      if (first) {
        (typeof window.showSection === "function")
          ? window.showSection(first.id || first)
          : (first.classList.remove("hidden"), first.style.display = "block");
      }
    } catch (error) {
      console.error(error);
      mensagemDiv.textContent = "Erro ao carregar a jornada.";
      toast("Não consegui carregar o formulário da jornada.");
    }
  }

  // Enter no input dispara o clique
  senhaInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") iniciarBtn.click();
  });
});
