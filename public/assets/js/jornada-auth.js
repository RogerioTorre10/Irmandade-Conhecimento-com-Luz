/* ============================================
   jornada-auth.js — Gate de Senha + Olho
   Expondo: window.JORNADA_AUTH
   v1.1 — countdown de 24h removido, sessão de 72h
   delegada ao jornada-session-tracker.js
============================================ */
;(function () {
  const CFG = Object.assign(
    {
      ACCESS_CODE: (window.JORNADA_CFG && window.JORNADA_CFG.PASS) || "IRMANDADE",
      STORAGE_KEY: "jornada_auth",
      START_DAYS: null,
      ISSUED_AT: null,
    },
    window.JORNADA_CFG || {}
  );

  const S = {
    load() { try { return JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || "{}"); } catch { return {}; } },
    save(v) { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(v || {})); },
    clear() { localStorage.removeItem(CFG.STORAGE_KEY); }
  };

  const now = () => Date.now();
  const msd = (d) => d * 24 * 3600 * 1000;

  function validate(code) {
    return String(code || "").trim() === String(CFG.ACCESS_CODE).trim();
  }

  function isStartWindowOpen() {
    if (!CFG.START_DAYS || !CFG.ISSUED_AT) return true;
    return now() <= (Number(CFG.ISSUED_AT) + msd(CFG.START_DAYS));
  }

  function bindEyeToggle(inputEl, eyeEl) {
    if (!inputEl || !eyeEl) return;
    eyeEl.addEventListener("click", () => {
      const isPwd = inputEl.type === "password";
      inputEl.type = isPwd ? "text" : "password";
      eyeEl.classList.toggle("eye-open", isPwd);
      eyeEl.classList.toggle("eye-closed", !isPwd);
    });
  }

  function init(opts = {}) {
    const {
      formSelector = "#form-senha",
      inputSelector = "#senha",
      eyeSelector = ".password-toggle",
      emailSelector = "#email",
      onGranted = () => {}
    } = opts;

    const form = document.querySelector(formSelector);
    const input = document.querySelector(inputSelector);
    const eye = document.querySelector(eyeSelector);

    if (!form || !input) return;

    bindEyeToggle(input, eye);

    if (!isStartWindowOpen()) {
      form.querySelector("button[type=submit]")?.setAttribute("disabled", "disabled");
      return;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const ok = validate(input.value);
      if (!ok) {
        form.classList.add("shake");
        setTimeout(() => form.classList.remove("shake"), 500);
        return;
      }

      const emailInput = document.querySelector(emailSelector) || document.querySelector("[name=email]");
      const emailDoParticipante = emailInput ? emailInput.value.trim() : (window.JORNADA_EMAIL || "");

      if (window.JORNADA_SESSION && typeof window.JORNADA_SESSION.iniciarSessao === "function") {
        await window.JORNADA_SESSION.iniciarSessao({ email: emailDoParticipante });
      } else {
        console.warn("[JORNADA_AUTH] JORNADA_SESSION não encontrado — contador de 72h não foi iniciado.");
      }

      onGranted();
    });
  }

  window.JORNADA_AUTH = {
    init,
    clear: S.clear,
  };
})();
