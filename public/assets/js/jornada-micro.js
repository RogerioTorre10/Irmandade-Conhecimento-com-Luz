/* =========================
   JORNADA_MICRO (🎤 Web Speech) — compat com UI existente
   - attach(textarea[, opts])
   - attachAll([scope, opts])
   - opts: { mode:'append'|'replace', lang:'pt-BR'|'en-US'|'es-ES', autoRestart:false }
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
    const sel = document.getElementById('language-select');
    const v = (sel && sel.value) || global.LANG || localStorage.getItem('JORNADA_LANG') || 'pt-BR';
    const l = String(v).toLowerCase();
    return l.startsWith('en') ? 'en-US' : l.startsWith('es') ? 'es-ES' : 'pt-BR';
  }

  function ensureToast(msg){
    try { (global.toast || ((m)=>alert(m)))(msg); } catch {}
  }

  function attach(el, opts={}) {
    const ta = (typeof el === 'string') ? document.querySelector(el) : el;
    if (!ta) return;
    const mode = opts.mode || 'append';

    // Reutiliza botão existente se houver (evita duplicar UI)
    const fromBlock = ta.closest('.j-pergunta') || ta.parentElement || document;
    const existing = fromBlock.querySelector('[data-action="start-mic"], .btn-mic');
    const host = ta.parentElement || fromBlock;
    if (host && !host.style.position) host.style.position = 'relative';

    const btn = existing || (() => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mic-btn';
      b.title = 'Falar (Ctrl+M)';
      b.innerHTML = '🎤';
      host.appendChild(b);
      ta.classList.add('has-mic');
      return b;
    })();

    // Suporte do navegador?
    const SR = global.SpeechRecognition || global.webkitSpeechRecognition;
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
      r.continuous = false;

      r.onresult = (e) => {
        let finalTxt = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          finalTxt += res[0].transcript;
          if (res.isFinal) {
            const prev = ta.value.trim();
            ta.value = (mode === 'replace')
              ? finalTxt.trim()
              : (prev ? (prev + ' ' + finalTxt.trim()) : finalTxt.trim());
            finalTxt = '';
            ta.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      };
      r.onerror = (ev) => {
        listening = false; btn.classList.remove('rec');
        if (ev && ev.error === 'not-allowed') ensureToast('Permissão do microfone negada.');
        else if (ev && ev.error === 'no-speech') ensureToast('Nenhuma fala detectada.');
        else ensureToast('Erro no reconhecimento de voz.');
      };
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
        if (listening) { rec.stop(); listening = false; btn.classList.remove('rec'); }
        else           { rec.start(); listening = true;  btn.classList.add('rec'); }
      } catch{}
    }

    // Clique/atalho
    btn.addEventListener('click', (ev)=>{ ev.preventDefault(); toggle(); });
    ta.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'm') { e.preventDefault(); toggle(); }
    });

    // Pressionar e segurar (opcional): segure o botão para gravar
    btn.addEventListener('mousedown', ()=>{ btn.dataset.hold = '1'; if (!listening) toggle(); });
    btn.addEventListener('mouseup',   ()=>{ btn.dataset.hold = '0'; if (listening)  toggle(); });
    btn.addEventListener('mouseleave',()=>{ btn.dataset.hold = '0'; if (listening)  toggle(); });

    // Atualiza idioma se o seletor mudar
    document.getElementById('language-select')?.addEventListener('change', () => {
      if (rec) rec.lang = detectLang();
    });

    // Para em mudanças de seção/unload
    window.addEventListener('beforeunload', ()=> { try { rec && rec.stop(); } catch{} });

    return {
      start: () => { if (!rec) rec = buildRecognizer(); rec.start(); listening = true; btn.classList.add('rec'); },
      stop:  () => { try { if (rec && listening) rec.stop(); } catch{} },
      button: btn
    };
  }

  function attachAll(scope=document, opts={}) {
    const taSel = '#section-perguntas .j-pergunta textarea, .j-pergunta textarea, textarea';
    scope.querySelectorAll(taSel).forEach(ta => {
      if (ta.dataset.micReady === '1') return;
      attach(ta, Object.assign({ mode:'append', lang: detectLang() }, opts));
      ta.dataset.micReady = '1';
    });
  }

  global.JORNADA_MICRO = { attach, attachAll };
})(window);
