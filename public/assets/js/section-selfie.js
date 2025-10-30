/* /assets/js/section-selfie.js — FASE 3.3+ (CORRIGIDO)
   - Garante render de controles e botões mesmo com TTS ativo
   - Ordem fixa e compacta (Header → Texto → Controles → Botões → Prévia)
   - Datilografia + TTS 100% funcionais
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase33_fixed) return;
  NS.__phase33_fixed = true;

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // ---------- Nome (robusto) ----------
function getUpperName() {
  const G = (window.JC && window.JC.data) ? window.JC.data : {};

  // 1) JC.data
  let name = G.nome || G.participantName;

  // 2) localStorage
  if (!name) {
    try {
      name = localStorage.getItem('jc.nome') ||
             localStorage.getItem('jc.participantName') ||
             localStorage.getItem('participantName');
    } catch {}
  }

  // 3) query string (?name=...)
  if (!name) {
    try {
      const u = new URL(window.location.href);
      const qn = u.searchParams.get('name') || u.searchParams.get('nome');
      if (qn) name = qn;
    } catch {}
  }

  if (!name || typeof name !== 'string') name = 'AMOR';
  const upper = name.toUpperCase().trim();

  // Sincroniza de volta (pra próximas seções)
  try {
    window.JC = window.JC || {}; window.JC.data = window.JC.data || {};
    window.JC.data.nome = upper; window.JC.data.participantName = upper;
    try { localStorage.setItem('jc.nome', upper); } catch {}
  } catch {}

  return upper;
}


  // ---------- Utils ----------
  const waitForElement = (sel, opt={}) => new Promise((res, rej) => {
    let t = 0;
    const i = setInterval(() => {
      const e = document.querySelector(sel);
      if (e) { clearInterval(i); res(e); }
      else if (++t > 100) { clearInterval(i); rej(new Error('Timeout waiting for ' + sel)); }
    }, opt.interval || 80);
  });

  const placeAfter = (ref, node) => {
    if (!ref || !ref.parentElement) return;
    if (ref.nextSibling) {
      ref.parentElement.insertBefore(node, ref.nextSibling);
    } else {
      ref.parentElement.appendChild(node);
    }
  };

  const toast = msg => {
    if (global.toast) return global.toast(msg);
    console.log('[Toast]', msg);
    alert(msg);
  };

  // ---------- Typing Effect ----------
  async function runTyping(el) {
    if (!el) return;
    const text = (el.dataset.text || el.textContent || '').trim();
    if (!text) return;

    el.textContent = '';
    el.style.opacity = '1';
    const speed = +el.dataset.speed || 35;
    const chars = [...text];
    let i = 0;

    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (i < chars.length) {
          el.textContent += chars[i++];
        } else {
          clearInterval(interval);
          resolve();
        }
      }, speed);
    });
  }

  // ---------- TTS (Leitura de Voz) ----------
  function speak(text) {
    if (!text) return;
    if (global.speak) {
      global.speak(text);
    } else if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'pt-BR';
      utter.rate = 0.9;
      utter.pitch = 1;
      window.speechSynthesis.speak(utter);
    } else {
      console.log('[TTS Fallback]', text);
    }
  }

  // ---------- Header ----------
  function ensureHeader(section) {
    let head = section.querySelector('.selfie-header');
    if (!head) {
      head = document.createElement('header');
      head.className = 'selfie-header';
      head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;';
      head.innerHTML = `
        <h2 data-text="Tirar sua Foto ✨" data-typing="true" data-speed="40">Tirar sua Foto ✨</h2>
        <button id="btn-skip-selfie" class="btn btn-stone-espinhos">Não quero foto / Iniciar</button>`;
      head.querySelector('#btn-skip-selfie').onclick = onSkip;
      section.prepend(head);
    }
    return head;
  }

 // ---------- Texto Orientação (com name + typing bridge) ----------
async function ensureTexto(section) {
  const upper = getUpperName();

  let wrap = section.querySelector('#selfieOrientWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'selfieOrientWrap';
    wrap.style.cssText = 'display:flex;justify-content:center;margin:16px 0 12px;';
    section.appendChild(wrap);
  }

  // remove P anterior pra evitar lixo de estilos
  const old = section.querySelector('#selfieTexto');
  if (old) old.remove();

  const p = document.createElement('p');
  p.id = 'selfieTexto';
  p.className = 'parchment-text-rough lumen-typing';
  p.style.cssText = `
    background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;
    text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto;width:92%;max-width:820px;
    opacity:1;visibility:visible;min-height:48px;max-height:none;overflow:visible;display:block;`;

  const fullText = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;

  // dataset pro TypingBridge
  p.dataset.text  = fullText;
  p.dataset.speed = '28';
  p.dataset.tts   = 'true';
  p.dataset.voice = 'lumen';

  // conteúdo inicial (bridge pode sobrescrever)
  p.textContent = fullText;
  wrap.appendChild(p);

  // força visibilidade contra resets de transição/CSS globais
  const shield = document.getElementById('selfieTextForce') || (() => {
    const s = document.createElement('style'); s.id = 'selfieTextForce';
    s.textContent = `
      #section-selfie #selfieTexto,
      #section-selfie .lumen-typing { opacity:1!important; visibility:visible!important;
        display:block!important; max-height:none!important; overflow:visible!important; transition:none!important; }`;
    document.head.appendChild(s); return s;
  })();

  // DATILOGRAFIA
  try {
    const hasBridge = (window.TypingBridge && typeof window.TypingBridge.runTyping === 'function');
    if (hasBridge) {
      window.G = window.G || {}; window.G.__typingLock = false;
      p.textContent = ''; // deixa a digitação começar do zero
      await window.TypingBridge.runTyping(p);
    } else {
      // fallback (suave)
      p.textContent = '';
      const chars = [...fullText];
      const speed = +p.dataset.speed || 28;
      await new Promise(resolve => {
        let i = 0;
        const iv = setInterval(() => {
          p.textContent += chars[i++];
          if (i >= chars.length) { clearInterval(iv); resolve(); }
        }, speed);
      });
    }
  } finally {
    // fala no final
    if (window.speak) window.speak(fullText);
    else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(fullText);
      u.lang = 'pt-BR'; u.rate = 0.95; u.pitch = 1; speechSynthesis.speak(u);
    }
  }

  return p;
}

  // ---------- Controles ----------
  function ensureControls(section) {
    if (section.querySelector('#selfieControls')) return;

    const style = document.createElement('style');
    style.textContent = `
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);
      border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;
      font-family:Cardo,serif;font-size:14px}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px;border-radius:2px;background:#555;outline:none;}
      #selfieControls input[type=range]::-webkit-slider-thumb{background:#f9e7c2;border-radius:50%;width:14px;height:14px;}
    `;
    document.head.appendChild(style);

    const c = document.createElement('div');
    c.id = 'selfieControls';
    c.innerHTML = `
      <div class="row"><label>Zoom Geral</label><input id="zoomAll" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomAllVal">1.00×</span></div>
      <div class="row"><label>Zoom Horizontal</label><input id="zoomX" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomXVal">1.00×</span></div>
      <div class="row"><label>Zoom Vertical</label><input id="zoomY" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomYVal">1.00×</span></div>`;
    section.appendChild(c);

    const zoomAll = c.querySelector('#zoomAll');
    const zoomX = c.querySelector('#zoomX');
    const zoomY = c.querySelector('#zoomY');
    const zoomAllVal = c.querySelector('#zoomAllVal');
    const zoomXVal = c.querySelector('#zoomXVal');
    const zoomYVal = c.querySelector('#zoomYVal');

    const update = () => {
      const a = +zoomAll.value, x = +zoomX.value, y = +zoomY.value;
      zoomAllVal.textContent = a.toFixed(2) + '×';
      zoomXVal.textContent = x.toFixed(2) + '×';
      zoomYVal.textContent = y.toFixed(2) + '×';
    };
    zoomAll.oninput = update;
    zoomX.oninput = update;
    zoomY.oninput = update;
    update();
  }

  // ---------- Botões ----------
  function ensureButtons(section) {
    if (section.querySelector('#selfieButtons')) return;

    const css = document.createElement('style');
    css.textContent = `
      #selfieButtons{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
      gap:8px;margin:8px auto;width:92%;max-width:820px}
      #selfieButtons .btn{height:36px;line-height:36px;padding:0 10px;font-size:14px;border-radius:10px;
      box-shadow:0 2px 8px rgba(0,0,0,.25);transition:all .2s}
      #selfieButtons .btn:disabled{opacity:0.5;cursor:not-allowed}
    `;
    document.head.appendChild(css);

    const div = document.createElement('div');
    div.id = 'selfieButtons';
    div.innerHTML = `
      <button id="btn-prev" class="btn btn-stone-espinhos">Prévia</button>
      <button id="btn-retake" class="btn btn-stone-espinhos" disabled>Tirar outra</button>
      <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>`;
    section.appendChild(div);
  }

  // ---------- Pular Selfie ----------
  function onSkip() {
    if (global.JC?.show) global.JC.show('section-card');
    else if (global.showSection) global.showSection('section-card');
  }

 // ---------- Forçar Ordem (COM MUTATIONOBSERVER + DELAY FORÇADO) ----------
function enforceOrder(section) {
  const order = [
    '.selfie-header',
    '#selfieOrientWrap',
    '#selfieControls',
    '#selfieButtons'
  ];

  // Função que roda múltiplas vezes até estabilizar
  let attempts = 0;
  const maxAttempts = 10;

  const tryEnforce = () => {
    let prev = null;
    let changed = false;

    order.forEach(sel => {
      const el = section.querySelector(sel);
      if (el && prev && el.previousElementSibling !== prev) {
        el.remove();
        placeAfter(prev, el);
        changed = true;
      }
      prev = el;
    });

    attempts++;
    if (changed && attempts < maxAttempts) {
      setTimeout(tryEnforce, 50);
    }
  };

  // Primeira tentativa imediata
  tryEnforce();

  // Última tentativa com delay (captura mudanças tardias)
  setTimeout(tryEnforce, 300);
}

// Observer global: qualquer mudança no DOM, reforça ordem
let orderObserver = null;
function startOrderObserver(section) {
  if (orderObserver) orderObserver.disconnect();

  orderObserver = new MutationObserver(() => {
    enforceOrder(section);
  });

  orderObserver.observe(section, {
    childList: true,
    subtree: true,
    attributes: false
  });

  // Para após 3 segundos
  setTimeout(() => {
    if (orderObserver) orderObserver.disconnect();
  }, 3000);
}

// ---------- Init (Play) — VERSÃO FINAL ----------
// ---------- Play (ordem: Header → Texto → Controles → Botões) ----------
async function play(section) {
  const header = ensureHeader(section);
  // Se o título tiver data-typing, mantém o do Zion
  const title = header.querySelector('h2');
  if (title && title.dataset && title.dataset.typing === 'true') {
    // usa runTyping local do arquivo
    if (typeof runTyping === 'function') {
      await runTyping(title);
      speak(title.dataset.text || title.textContent);
    }
  }

  await ensureTexto(section); // texto primeiro (já com name)

  ensureControls(section);
  ensureButtons(section);

  // reforço pós-transição (se algum CSS tentar esconder de novo)
  setTimeout(() => {
    const t = section.querySelector('#selfieTexto');
    if (t) { t.style.opacity = '1'; t.style.visibility = 'visible'; t.style.display = 'block'; }
  }, 500);
}


  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      await play(section);
    } catch (err) {
      console.error('Erro ao carregar section-selfie:', err);
    }
  }

  // Escuta evento de carregamento da seção
  document.addEventListener('sectionLoaded', e => {
    if (e?.detail?.sectionId === 'section-selfie') {
      init();
    }
  });

  // Ou DOM pronto
  if (document.readyState !== 'loading') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})(window);
