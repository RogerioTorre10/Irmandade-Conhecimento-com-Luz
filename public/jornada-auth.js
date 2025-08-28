/* ============================================
   jornada-auth.js — Gate de Senha + Olho + Expiração
   Expondo: window.JORNADA_AUTH
   ============================================ */
;(function () {
  // ===== Config =====
  // Você pode injetar via window.JORNADA_CFG os campos abaixo.
  // Suporte a:
  //  - ACCESS_CODE + ISSUED_AT (um único código)
  //  - OU codeProvider(code) -> { issuedAt }  (consulta assíncrona/síncrona ao gerador)
  const CFG = Object.assign(
    {
      STORAGE_KEY: "jornada_auth",
      ACCESS_CODE: (window.JORNADA_CFG && window.JORNADA_CFG.ACCESS_CODE) || "IRMANDADE",
      ISSUED_AT:   (window.JORNADA_CFG && window.JORNADA_CFG.ISSUED_AT)   || null, // ms
      // Janela para iniciar a jornada (a partir da emissão do código)
      START_DAYS:  (window.JORNADA_CFG && window.JORNADA_CFG.START_DAYS)  || 15,
      // Prazo de conclusão após o uso do código
      FINISH_HOURS:(window.JORNADA_CFG && window.JORNADA_CFG.FINISH_HOURS)|| 24,
      // Opcional: função do gerador. Recebe o 'code' e deve retornar:
      //   { issuedAt: <timestamp ms> }  ou  null/undefined se inválido.
      // Pode ser síncrona ou retornar Promise.
      codeProvider: (window.JORNADA_CFG && window.JORNADA_CFG.codeProvider) || null,
    },
    window.JORNADA_CFG || {}
  );

  // ===== Store =====
  const S = {
    load() {
      try { return JSON.parse(localStorage.getItem(CFG.STORAGE_KEY) || "{}"); }
      catch { return {}; }
    },
    save(v) { localStorage.setItem(CFG.STORAGE_KEY, JSON.stringify(v || {})); },
    clear() { localStorage.removeItem(CFG.STORAGE_KEY); }
  };

  // ===== Helpers =====
  const now = () => Date.now();
  const ms   = (h) => h * 3600 * 1000;
  const msd  = (d) => d * 24   * 3600 * 1000;

  function formatCountdown(msLeft) {
    if (msLeft == null) return "";
    const s = Math.floor(msLeft / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    return `${h}h ${m}m ${ss}s`;
  }

  // ===== Regras =====
  // 1) Janela de início (15 dias a partir da emissão)
  function isStartWindowOpen(issuedAt) {
    if (!issuedAt) return true; // sem controle → permite
    const lim = Number(issuedAt) + msd(CFG.START_DAYS || 15);
    return now() <= lim;
  }

  // 2) Prazo de conclusão (24h a partir do 'grant')
  function grantedTimeLeftMs() {
    const st = S.load();
    if (!st.deadline_at) return null;
    return Math.max(0, st.deadline_at - now());
  }

  function isGrantedActive() {
    const left = grantedTimeLeftMs();
    return left != null && left > 0;
  }

  function markGranted(issuedAt) {
    const st = S.load();
    st.granted_at  = now();
    st.deadline_at = st.granted_at + ms(CFG.FINISH_HOURS || 24);
    st.issued_at   = issuedAt || st.issued_at || null;
    S.save(st);
  }

  // (opcional) marca conclusão — útil se quiser bloquear reuso após finalizar
  function markCompleted() {
    const st = S.load();
    st.completed_at = now();
    S.save(st);
  }

  // ===== Validação do código =====
  // Suporta 2 modos:
  //  (A) Código fixo via ACCESS_CODE + ISSUED_AT
  //  (B) Código vindo do gerador: CFG.codeProvider(code) -> {issuedAt}
  async function validateAndResolveIssuedAt(codeInput) {
    const code = String(codeInput || "").trim();

    // Se houver provider, ele manda no jogo:
    if (typeof CFG.codeProvider === "function") {
      const info = await Promise.resolve(CFG.codeProvider(code));
      // info = { issuedAt: <ms> } se válido, ou null/undefined se inválido
      if (!info || !info.issuedAt) return { ok:false, reason:"invalid" };
      if (!isStartWindowOpen(info.issuedAt)) return { ok:false, reason:"start_expired" };
      return { ok:true, issuedAt: Number(info.issuedAt) };
    }

    // Sem provider: comparação direta + janela com ISSUED_AT do CFG
    const ok = code.toUpperCase() === String(CFG.ACCESS_CODE).trim().toUpperCase();
    if (!ok) return { ok:false, reason:"invalid" };
    const issuedAt = Number(CFG.ISSUED_AT) || null;
    if (issuedAt && !isStartWindowOpen(issuedAt)) return { ok:false, reason:"start_expired" };
    return { ok:true, issuedAt };
  }

  // ===== UI (olho mágico) =====
  function bindEyeToggle(inputEl, eyeEl) {
    if (!inputEl || !eyeEl) return;
    let show = false;
    const update = () => {
      inputEl.type = show ? "text" : "password";
      eyeEl.setAttribute("aria-pressed", show ? "true" : "false");
      eyeEl.textContent = show ? "🙈" : "👁️";
    };
    eyeEl.addEventListener("click", (e) => { e.preventDefault(); show = !show; update(); });
    update();
  }

  // ===== API =====
  async function init(opts = {}) {
    const {
      formSelector       = "#form-senha",
      inputSelector      = "#senha-input",
      eyeSelector        = "#senha-eye",
      countdownSelector  = "#senha-countdown",
      onGranted          = () => {},
      onError            = (reason) => {  // "invalid" | "start_expired" | "expired"
        if (reason === "invalid") alert("Senha incorreta.");
        else if (reason === "start_expired") alert("Este código expirou (janela de 15 dias).");
        else if (reason === "expired") alert("Seu acesso expirou (24h). Solicite um novo código.");
      },
    } = opts;

    const form      = document.querySelector(formSelector);
    const input     = document.querySelector(inputSelector);
    const eye       = document.querySelector(eyeSelector);
    const countdown = document.querySelector(countdownSelector);
    if (!form || !input) return;

    bindEyeToggle(input, eye);

    // Se já tem grant anterior, verifica prazo (24h)
    if (isGrantedActive()) {
      // mostra count-down e permite seguir
      startTick(countdown);
      onGranted();   // já liberado dentro da janela
      return;
    } else {
      // Se estava expirado, limpa para recomeçar
      const st = S.load();
      if (st.deadline_at && grantedTimeLeftMs() === 0) onError("expired");
    }

    // form submit → valida + concede
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const code = input.value;
      const res  = await validateAndResolveIssuedAt(code);
      if (!res.ok) { onError(res.reason); return; }
      // dentro da janela de 15 dias → concede e inicia 24h
      markGranted(res.issuedAt);
      startTick(countdown);
      onGranted();
    });
  }

  function startTick(countdownEl) {
    if (!countdownEl) return;
    const tick = () => {
      const left = grantedTimeLeftMs();
      countdownEl.textContent = left != null ? `Tempo restante: ${formatCountdown(left)}` : "";
      if (left != null && left > 0) requestAnimationFrame(tick);
    };
    tick();
  }

  // utilidades públicas
  window.JORNADA_AUTH = {
    init,
    clear: S.clear,
    timeLeftMs: grantedTimeLeftMs,
    formatCountdown,
    isStartWindowOpen,
    isGrantedActive,
    markCompleted,          // chame ao concluir a jornada
  };
})();
