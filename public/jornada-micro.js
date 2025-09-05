/* =========================
   JORNADA_MICRO (🎤 Web Speech)
   - attach(textarea[, opts])
   - opts: { mode: 'append'|'replace', lang: 'pt-BR'|'en-US'|'es-ES', autoRestart: false }
   ========================= */
(function (global) {
  'use strict';
  if (global.JORNADA_MICRO) return;

  (function ensureStyle(){
    if (document.getElementById('mic-style')) return;
    const css = `
      .mic-btn{position:absolute;right:8px;bottom:8px;width:36px;height:36px;border-radius:999px;
        border:1px solid rgba(255,255,255,.18);background:rgba(0,0,0,.28);color:#fff;
        display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px}
      .mic-btn[disabled]{opacity:.4;cursor:not-allowed}
      .mic-btn.rec{box-shadow:0 0 0 3px rgba(255,0,0,.25);animation:micpulse 1s ease-in-out infinite}
      @keyframes micpulse{0%{transform:scale(1)}50%{transform:scale(1.06)}100%{transform:scale(1)}}
      .has-mic{padding-right:44px !important}
    `;
    const st = document.createElement('style');
    st.id = 'mic-style';
    st.textContent = css;
    document.head.appendChild(st);
  })();

  function detectLang() {
    const l = (global.LANG || localStorage.getItem('JORNADA_LANG') || 'pt').toLowerCase();
    return l.startsWith('en') ? 'en-US' : l.startsWith('es') ? 'es-ES' : 'pt-BR';
  }

  function attach(el, opts={}) {
    const ta = (typeof el === 'string') ? document.querySelector(el) : el;
    if (!ta) return;
    const mode = opts.mode || 'append';

    const host = ta.parentElement || ta;
    host.style.position = host.style.position || 'relative';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'mic-btn';
    btn.title = 'Falar (Ctrl+M)';
    btn.innerHTML = '🎤';
    host.appendChild(btn);
    ta.classList.add('has-mic');

    if (!global.SpeechRecognition && !global.webkitSpeechRecognition) {
      btn.disabled = true;
      btn.title = 'Reconhecimento de voz não suportado neste navegador';
      return;
    }

    let rec = null, listening = false;

    function buildRecognizer() {
      const r = new (global.SpeechRecognition || global.webkitSpeechRecognition)();
      r.lang = opts.lang || detectLang();
      r.interimResults = true;
      r.continuous = false;
      r.onresult = (e) => {
        let finalTxt = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          finalTxt += res[0].transcript;
          if (res.isFinal) {
            const prev = ta.value.trim();
            ta.value = (mode === 'replace') ? finalTxt.trim() : (prev ? (prev + ' ' + finalTxt.trim()) : finalTxt.trim());
            finalTxt = '';
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      };
      r.onerror = () => { listening = false; btn.classList.remove('rec'); };
      r.onend = () => {
        listening = false; btn.classList.remove('rec');
        if (opts.autoRestart && btn.dataset.hold === '1') {
          try { r.start(); listening = true; btn.classList.add('rec'); } catch{}
        }
      };
      return r;
    }

    function toggle() {
      try {
        if (!rec) rec = buildRecognizer();
        rec.lang = opts.lang || detectLang();
        if (listening) {
          rec.stop(); listening = false; btn.classList.remove('rec');
        } else {
          rec.start(); listening = true; btn.classList.add('rec');
        }
      } catch{}
    }

    btn.addEventListener('click', toggle);
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggle();
      }
    });

    return { start: () => { if (!rec) rec = buildRecognizer(); rec.start(); listening = true; btn.classList.add('rec'); },
             stop:  () => { if (rec && listening) rec.stop(); } };
  }

  global.JORNADA_MICRO = { attach };
})(window);
<!-- Grok xAI - Uhuuuuuuu! 🚀 -->
