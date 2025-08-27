/* ============================================
   jornada-auth.js — Gate de Senha + Olho
   Expondo: window.JORNADA_AUTH
   ============================================ */
;(function () {
  const CFG = Object.assign(
    {
      ACCESS_CODE: (window.JORNADA_CFG && window.JORNADA_CFG.ACCESS_CODE) || "IRMANDADE",
      STORAGE_KEY: "jornada_auth",
      FINISH_HOURS: 24,   // após liberar, prazo para concluir
      START_DAYS: null,   // opcional (ex.: 15). Requer issuedAt.
      ISSUED_AT: null,    // timestamp ms (se quiser validar START_DAYS)
    },
    window.JORNADA_CFG || {}
  );

  const S = {
    load() {
      try { return JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || "{}"); }
      catch { return {}; }
    },
    save(v) { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(v || {})); },
    clear() { localStorage.removeItem(CFG.STORAGE_KEY); }
  };

  function now() { return Date.now(); }
  function ms(h){ return h*3600*1000; }
  function msd(d){ return d*24*3600*1000; }

  function validate(code) {
    return String(code || "").trim() === String(CFG.ACCESS_CODE).trim();
  }

  function isStartWindowOpen() {
    if (!CFG.START_DAYS || !CFG.ISSUED_AT) return true; // sem política de 15 dias => ignora
    return now() <= (Number(CFG.ISSUED_AT) + msd(CFG.START_DAYS));
  }

  function grant() {
    const st = S.load();
    st.granted_at = now();
    st.deadline_at = st.granted_at + ms(CFG.FINISH_HOURS);
    S.save(st);
  }

  function timeLeftMs() {
    const st = S.load();
    if (!st.deadline_at) return null;
    return Math.max(0, st.deadline_at - now());
  }

  function formatCountdown(msLeft) {
    if (msLeft == null) return "";
    const s = Math.floor(msLeft / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}h ${m}m ${ss}s`;
  }

  // Olho mágico: alterna visibilidade do input de senha
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
      inputSelector = "#senha-input",
      eyeSelector = "#senha-eye",
      countdownSelector = "#senha-countdown",
      onGranted = () => {}
    } = opts;

    const form = document.querySelector(formSelector);
    const input = document.querySelector(inputSelector);
    const eye = document.querySelector(eyeSelector);
    const countdown = document.querySelector(countdownSelector);

    if (!form || !input) return; // nada pra fazer se a tela não tiver senha

    bindEyeToggle(input, eye);

    // política opcional de início (15 dias)
    if (!isStartWindowOpen()) {
      form.querySelector("button[type=submit]")?.setAttribute("disabled", "disabled");
      if (countdown) countdown.textContent = "Janela de início expirada.";
      return;
    }

    // countdown do prazo (se já concedido antes)
    const tick = () => {
      const msLeft = timeLeftMs();
      if (countdown) countdown.textContent = msLeft ? `Tempo restante: ${formatCountdown(msLeft)}` : "";
      if (msLeft && msLeft > 0) requestAnimationFrame(tick);
    };
    tick();

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const ok = validate(input.value);
      if (!ok) {
        form.classList.add("shake");
        setTimeout(() => form.classList.remove("shake"), 500);
        return;
      }
      grant();
      onGranted();
    });
  }

  window.JORNADA_AUTH = {
    init,
    clear: S.clear,
    timeLeftMs,
    formatCountdown,
  };
})();
