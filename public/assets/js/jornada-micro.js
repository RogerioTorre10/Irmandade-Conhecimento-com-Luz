/* =========================
   JORNADA_MICRO (Web Speech) — compat com UI existente
   - attach(textarea[, opts])
   - attachAll([scope, opts])
   - opts: { mode:'append'|'replace', lang:'pt-BR'|'en-US'|'es-ES', autoRestart:false }
   ========================= */
(function (window) {
  'use strict';

  if (window.JORNADA_MICRO) return;

  (function ensureStyle() {
    if (document.getElementById('mic-style')) return;
    const css = `
      .mic-btn {
        position: absolute;
        right: 8px;
        bottom: 8px;
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,.18);
        background: rgba(0,0,0,.28);
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
      }
      .mic-btn[disabled] { opacity: .4; cursor: not-allowed; }
      .mic-btn.rec {
        box-shadow: 0 0 0 3px rgba(255,0,0,.25);
        animation: micpulse 1s ease-in-out infinite;
      }
      @keyframes micpulse { 0% { transform: scale(1); } 50% { transform: scale(1.06); } 100% { transform: scale(1); } }
      .has-mic { padding-right: 44px !important; }
    `;
    const st = document.createElement('style');
    st.id = 'mic-style';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  function detectLang() {
    const sel = document.getElementById('language-select');
    const v = (sel && sel.value) || window.LANG || localStorage.getItem('JORNADA_LANG') || 'pt-BR';
    const l = String(v).toLowerCase();
    return l.startsWith('en') ? 'en-US' : l.startsWith('es') ? 'es-ES' : 'pt-BR';
  }

  function ensureToast(msg) {
    try { (window.toast || ((m) => alert(m)))(msg); } catch {}
  }

  function attach(el, opts = {}) {
    const ta = (typeof el === 'string') ? document.querySelector(el) : el;
    if (!ta) return;

    const mode = opts.mode || 'append';

    const fromBlock = ta.closest('.j-pergunta') || ta.parentElement || document;
    const existing = fromBlock.querySelector('[data-action="start-mic"], .btn-mic');
    const host = ta.parentElement || fromBlock;
    if (host && !host.style.position) host.style.position = 'relative';

    const btn = existing || (() => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mic-btn';
      b.title = 'Falar (Ctrl+M)';
      b.innerHTML = 'microphone';
      host.appendChild(b);
      ta.classList.add('has-mic');
      return b;
    })();

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      btn.disabled = true;
      btn.title = 'Reconhecimento de voz não suportado neste navegador';
      return;
    }

    let rec = null, listening = false;

    function buildRecognizer() {
  const r = new SR();
  r.lang = opts.lang || detectLang();
  r.interimResults = true;
  r.continuous = true; // ← MOBILE: mantém ouvindo até o usuário parar

  let interimBuffer = '';

  r.onresult = (e) => {
    let interim = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) {
        const prev = ta.value.trim();
        const newText = res[0].transcript.trim();
        ta.value = (mode === 'replace')
          ? newText
          : (prev ? prev + ' ' + newText : newText);
        interim = '';
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      } else {
        interim += res[0].transcript;
      }
    }
    // Mostra texto interim no placeholder enquanto fala
    if (interim) ta.setAttribute('placeholder', interim);
    else ta.removeAttribute('placeholder');
  };

  r.onerror = (ev) => {
    // 'no-speech' no mobile é normal — reinicia silenciosamente
    if (ev?.error === 'no-speech') {
      if (listening) {
        try { r.start(); } catch (_) {}
      }
      return;
    }
    listening = false;
    btn.classList.remove('rec');
    if (ev?.error === 'not-allowed') ensureToast('Permissão do microfone negada.');
    else ensureToast('Erro no reconhecimento de voz.');
  };

  r.onend = () => {
    // Reinicia automaticamente enquanto o usuário não clicar para parar
    if (listening) {
      try { r.start(); } catch (_) {
        listening = false;
        btn.classList.remove('rec');
      }
    }
  };

  return r;
}

    function toggle() {
      try {
        if (!rec) rec = buildRecognizer();
        rec.lang = opts.lang || detectLang();
        if (listening) {
          rec.stop();
          listening = false;
          btn.classList.remove('rec');
        } else {
          rec.start();
          listening = true;
          btn.classList.add('rec');
        }
      } catch {}
    }


    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      toggle();
    });

    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggle();
      }
    });

    document.getElementById('language-select')?.addEventListener('change', () => {
      if (rec) rec.lang = detectLang();
    });

    window.addEventListener('beforeunload', () => {
      try { rec && rec.stop(); } catch {}
    });

    return {
      start: () => {
        if (!rec) rec = buildRecognizer();
        rec.start();
        listening = true;
        btn.classList.add('rec');
      },
      stop: () => {
        try { if (rec && listening) rec.stop(); } catch {}
      },
      button: btn
    };
  }

  function attachAll(scope = document, opts = {}) {
    const taSel = '#section-perguntas .j-pergunta textarea, .j-pergunta textarea, textarea';
    scope.querySelectorAll(taSel).forEach(ta => {
      if (ta.dataset.micReady === '1') return;
      attach(ta, Object.assign({ mode: 'append', lang: detectLang() }, opts));
      ta.dataset.micReady = '1';
    });
  }

  window.JORNADA_MICRO = { attach, attachAll };

})(window);
