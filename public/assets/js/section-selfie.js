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

  // ---------- Nome ----------
  function getUpperName() {
    const jc = (global.JC && global.JC.data) ? global.JC.data : {};
    let name = jc.nome || jc.participantName;
    if (!name) {
      try {
        const ls = localStorage.getItem('jc.nome') || localStorage.getItem('jc.participantName');
        if (ls) name = ls;
      } catch {}
    }
    if (!name || typeof name !== 'string') name = 'AMOR';
    const upper = name.toUpperCase().trim();
    try {
      global.JC = global.JC || {}; 
      global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper; 
      global.JC.data.participantName = upper;
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

  // ---------- Texto Orientação (TYPING 100% FORÇADO) ----------
async function ensureTexto(section) {
  const upper = getUpperName();
  let wrap = section.querySelector('#selfieOrientWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'selfieOrientWrap';
    wrap.style.cssText = 'display:flex;justify-content:center;margin:16px 0 12px;';
    section.appendChild(wrap);
  }

  // REMOVE QUALQUER P ANTERIOR
  const existing = section.querySelector('#selfieTexto');
  if (existing) existing.remove();

  const p = document.createElement('p');
  p.id = 'selfieTexto';
  p.style.cssText = `
    background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;
    text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto;width:92%;max-width:820px;
    opacity:0; transition:opacity .5s ease;
    white-space: nowrap; overflow: hidden; display: inline-block;
  `;

  const fullText = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
  
  // NÃO COLOCA TEXTO NO HTML!
  p.textContent = '';
  p.dataset.text = fullText;
  p.dataset.speed = "30";

  wrap.appendChild(p);

  // GARANTE DOM PRONTO
  await sleep(80);
  p.style.opacity = '1';

  // TYPING COM requestAnimationFrame + PROTEÇÃO
  await new Promise(resolve => {
    requestAnimationFrame(() => {
      const chars = [...fullText];
      let i = 0;
      const speed = 30;
      const interval = setInterval(() => {
        if (i < chars.length) {
          p.textContent += chars[i++];
        } else {
          clearInterval(interval);
          resolve();
        }
      }, speed);

      // PROTEGE DE OUTROS SCRIPTS
      const protector = setInterval(() => {
        if (p.textContent.length > fullText.length) {
          p.textContent = fullText.substring(0, i);
        }
      }, 10);
      setTimeout(() => clearInterval(protector), 5000);
    });
  });

  speak(fullText);
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
async function play(section) {
  const header = ensureHeader(section);
  const title = header.querySelector('h2');
  if (title.dataset.typing === 'true') {
    await runTyping(title); // se ainda usar em outro lugar
    speak(title.dataset.text);
  }

  // TEXTO VEM ANTES DE TUDO
  await ensureTexto(section);

  ensureControls(section);
  ensureButtons(section);

  startOrderObserver(section);
  enforceOrder(section);
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
