/* =========================================================
   jornada-bootstrap.js — ponto de partida da Jornada
   Depende (na página) de carregar ANTES:
     - /jornada-utils.js
     - /jornada-core.js
     - /jornada-auth.js
     - /questions.js
     - /jornada-typing-font.js
     - /jornada-render.js
     - /navigation.js   (novo)
   Expõe: window.JORNADA_BOOTSTRAP, activateJornada, deactivateJornada
   ========================================================= */
;(function () {
  const LOG = (...a) => { try { console.debug("[JORNADA_BOOT]", ...a); } catch(_) {} };

  // ------- Classe no body para esconder/mostrar casca x canvas --------
  function activateJornada(){
    document.body.classList.add("jornada-active");
  }
  function deactivateJornada(){
    document.body.classList.remove("jornada-active");
  }
  // deixa global (usado por navigation.js e render)
  window.activateJornada = activateJornada;
  window.deactivateJornada = deactivateJornada;

  // ------- Tipografia (datilógrafo) – ajustes suaves globais ----------
  function configureTyping(){
    try {
      // Se o motor permitir config global
      if (window.JORNADA_TYPO && typeof JORNADA_TYPO.config === "function"){
        JORNADA_TYPO.config({
          speed: 26,          // um pouco mais lento e legível
          maxTotalMs: 4000,   // limite de digitação por tela
          caretClass: "tty-cursor"
        });
      }
    } catch (e) { LOG("typing config skipped", e); }
  }

  // ------- Senha (olho mágico + política de prazo) --------------------
  function initAuth(){
    try {
      // Só inicializa se a tela tiver os seletores (fica no-op nas outras)
      window.JORNADA_AUTH?.init({
        formSelector:       "#form-senha",
        inputSelector:      "#senha-input",
        eyeSelector:        "#senha-eye",
        countdownSelector:  "#senha-countdown",
        onGranted: () => {
          // liberado → segue para a jornada (intro)
          LOG("Acesso concedido.");
          window.JORNADA_NAV?.goIntro();
        }
      });
    } catch (e) { LOG("auth init skipped", e); }
  }

  // ------- Idiomas (PT/EN/ES) -----------------------------------------
   <script defer>
(function(){
  const LANG_KEY = 'JORNADA_LANG';

  function setLang(lang){
    localStorage.setItem(LANG_KEY, lang);
    window.LANG = lang;

    // Se seu i18n expõe perguntas por idioma, injete aqui:
    // Ex.: window.I18N.questionsFor(lang) => [{name,label}, ...]
    if (window.I18N?.questionsFor) {
      window.DEFAULT_QUESTIONS = window.I18N.questionsFor(lang);
    }

    // Reabre na intro para aplicar textos
    window.JORNADA_RENDER?.renderIntro?.();
  }

  // estado inicial
  const saved = localStorage.getItem(LANG_KEY) || 'pt';
  if (!window.LANG) setLang(saved);

  // botões PT/EN/ES
  document.querySelectorAll('.lang-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> setLang(btn.dataset.lang));
  });
})();
</script>

  // ------- Roteador (hash) -------------------------------------------
  function initNavigation(){
    try {
      window.JORNADA_NAV?.init();
      // Se abriu sem hash, caímos na Intro
      if (!location.hash) window.JORNADA_NAV?.goIntro();
    } catch (e) { LOG("navigation init error", e); }
  }

  // ------- Hook de “voltar à lista” seguro ---------------------------
  // Use com data-nav="home" ou chame direto JORNADA_NAV.goHome()
  function wireHomeLinks(){
    document.addEventListener("click", (ev) => {
      const a = ev.target.closest("a[href='/index.html'], a[href='/jornadas.html']");
      if (!a) return;
      // preferimos usar o roteador para manter consistência
      ev.preventDefault();
      window.JORNADA_NAV?.goHome();
    });
  }

  // ------- Inicialização principal -----------------------------------
  function init(){
    configureTyping();
    initAuth();
    initNavigation();
    wireHomeLinks();

    LOG("Bootstrap pronto ✔");
  }

  // Auto-start
  document.addEventListener("DOMContentLoaded", init);

  // API pública (se precisar re-inicializar após hot-swap)
  window.JORNADA_BOOTSTRAP = { init };
})();

// Hook para disparar assim que o DOM estiver pronto
function ready(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

ready(() => {
  const ns = window.JORNADA || {};

  // Botão "Começar"
  const btn = document.getElementById('btnComecar');
  if (btn) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      if (typeof ns.renderIntro === 'function') {
        ns.renderIntro();
      } else if (typeof ns.renderPerguntas === 'function') {
        ns.renderPerguntas(0);
      } else {
        console.warn('[JORNADA] Nenhum módulo de render encontrado.');
      }
    });
  } else {
    console.warn('[JORNADA] Botão #btnComecar não encontrado no DOM.');
  }
});

