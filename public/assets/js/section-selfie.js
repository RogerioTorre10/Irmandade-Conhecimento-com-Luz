/* /assets/js/section-selfie.js — FASE 3.4
   - Texto ressurgindo com datilografia + TTS (via TypingBridge se disponível)
   - Controles e Botões sempre renderizam cedo (sem depender do TTS)
   - Ordem fixa: Header → Texto → Controles → Botões → Prévia
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase34_bound) return;
  NS.__phase34_bound = true;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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
      global.JC = global.JC || {}; global.JC.data = global.JC.data || {};
      global.JC.data.nome = upper; global.JC.data.participantName = upper;
      try { localStorage.setItem('jc.nome', upper); } catch {}
    } catch {}
    return upper;
  }

  // ---------- Utils ----------
  const waitForElement = (sel, opt = {}) => new Promise((res, rej) => {
    let t = 0;
    const i = setInterval(() => {
      const e = document.querySelector(sel);
      if (e) { clearInterval(i); res(e); }
      else if (++t > (opt.tries || 60)) { clearInterval(i); rej(new Error('not-found:' + sel)); }
    }, opt.interval || 100);
  });

  const placeAfter = (ref, node) => {
    if (!ref || !ref.parentElement || !node) return;
    ref.nextSibling ? ref.parentElement.insertBefore(node, ref.nextSibling)
                    : ref.parentElement.appendChild(node);
  };

  const ensureStyleOnce = (id, css) => {
    if (document.getElementById(id)) return;
    const s = document.createElement('style');
    s.id = id; s.textContent = css;
    document.head.appendChild(s);
  };

  const toast = (msg) => { if (global.toast) return global.toast(msg); console.log('[Toast]', msg); };

  // ---------- Datilografia (fallback) ----------
  function fallbackTyping(el, speed = 28) {
    return new Promise((resolve) => {
      if (!el) return resolve();
      const txt = (el.dataset.text || el.textContent || '').trim();
      el.textContent = '';
      let i = 0; const chars = [...txt];
      const h = setInterval(() => {
        el.textContent += chars[i++];
        if (i >= chars.length) { clearInterval(h); resolve(); }
      }, speed);
    });
  }

  // ---------- Header ----------
  function ensureHeader(section) {
    let head = section.querySelector('.selfie-header');
    if (!head) {
      head = document.createElement('header');
      head.className = 'selfie-header';
      head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;';
      head.innerHTML = `
        <h2 data-typing="true" data-text="Tirar sua Foto ✨" data-speed="40">Tirar sua Foto ✨</h2>
        <button id="btn-skip-selfie" class="btn btn-stone-espinhos">Não quero foto / Iniciar</button>
      `;
      section.prepend(head);
      head.querySelector('#btn-skip-selfie').onclick = onSkip;
    }
    return head;
  }

  // ---------- Texto orientação (com atributos pro TypingBridge) ----------
 function ensureTexto(section) {
  const upper = getUpperName();

  let wrap = section.querySelector('#selfieOrientWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'selfieOrientWrap';
    wrap.style.cssText = 'display:flex;justify-content:center;margin:6px 0 8px;';
    section.appendChild(wrap);
  }

  let p = section.querySelector('#selfieTexto');
  if (!p) {
    p = document.createElement('p');
    p.id = 'selfieTexto';
    p.className = 'parchment-text-rough lumen-typing';
    p.style.cssText = [
      'background:rgba(0,0,0,.35)',
      'color:#f9e7c2',
      'padding:10px 14px',
      'border-radius:12px',
      'text-align:center',
      'font-family:Cardo,serif',
      'font-size:15px',
      'margin:0 auto',
      'width:92%',
      'max-width:820px',
      // força visibilidade para o caso em que o Bridge não rodar:
      'opacity:1',
      'visibility:visible'
    ].join(';');
    wrap.appendChild(p);
  }

  const msg = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
  p.dataset.text = msg;
  p.setAttribute('data-typing', 'true');
  p.setAttribute('data-tts', 'true');
  p.setAttribute('data-speed', p.dataset.speed || '28');
  p.setAttribute('data-voice', p.dataset.voice || 'lumen');

  // texto base já visível (se o Bridge assumir, ele sobrescreve)
  p.textContent = msg;

  return p;
}

async function play(section) {
  ensureHeader(section);
  const p = ensureTexto(section);

  // Render do layout primeiro (nada espera o TTS)
  ensureControls(section);
  ensureButtons(section);
  enforceOrder(section);

  // Se houver Bridge, usamos; senão, fallback + “typing-done” visível
  try {
    const hasBridge = (window.TypingBridge && typeof window.TypingBridge.runTyping === 'function');
    if (hasBridge) {
      window.G = window.G || {}; window.G.__typingLock = false;
      await window.TypingBridge.runTyping(p);
    } else {
      await fallbackTyping(p, +(p.dataset.speed || 28));
      p.classList.add('typing-done');
      p.style.opacity = '1';
      p.style.visibility = 'visible';
    }
  } catch (e) {
    console.warn('[Selfie] Bridge falhou; forçando fallback', e);
    await fallbackTyping(p, +(p.dataset.speed || 28));
    p.classList.add('typing-done');
    p.style.opacity = '1';
    p.style.visibility = 'visible';
  }
}

  // ---------- Controles ----------
  function ensureControls(section) {
    ensureStyleOnce('selfieControls-css', `
      #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);
        border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;
        font-family:Cardo,serif;font-size:14px}
      #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
      #selfieControls input[type=range]{width:100%;height:4px}
    `);

    if (section.querySelector('#selfieControls')) return;
    const c = document.createElement('div');
    c.id = 'selfieControls';
    c.innerHTML = `
      <div class="row"><label>Zoom Geral</label><input id="zoomAll" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomAllVal">1.00×</span></div>
      <div class="row"><label>Zoom Horizontal</label><input id="zoomX" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomXVal">1.00×</span></div>
      <div class="row"><label>Zoom Vertical</label><input id="zoomY" type="range" min="0.5" max="2" step="0.01" value="1"><span id="zoomYVal">1.00×</span></div>
    `;
    section.appendChild(c);

    const zoomAll = c.querySelector('#zoomAll');
    const zoomX   = c.querySelector('#zoomX');
    const zoomY   = c.querySelector('#zoomY');
    const zoomAllVal = c.querySelector('#zoomAllVal');
    const zoomXVal   = c.querySelector('#zoomXVal');
    const zoomYVal   = c.querySelector('#zoomYVal');

    const upd = () => {
      const a = +zoomAll.value, x = +zoomX.value, y = +zoomY.value;
      zoomAllVal.textContent = a.toFixed(2) + '×';
      zoomXVal.textContent   = x.toFixed(2) + '×';
      zoomYVal.textContent   = y.toFixed(2) + '×';
      // TODO: aplicar transform na camada da câmera/máscara quando essa camada estiver presente
    };
    zoomAll.oninput = upd; zoomX.oninput = upd; zoomY.oninput = upd;
  }

  // ---------- Botões ----------
  function ensureButtons(section) {
    ensureStyleOnce('selfieButtons-css', `
      #selfieButtons{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));
        gap:8px;margin:8px auto;width:92%;max-width:820px}
      #selfieButtons .btn{height:36px;line-height:36px;padding:0 10px;font-size:14px;border-radius:10px;
        box-shadow:0 2px 8px rgba(0,0,0,.25)}
    `);

    if (section.querySelector('#selfieButtons')) return;
    const div = document.createElement('div');
    div.id = 'selfieButtons';
    div.innerHTML = `
      <button id="btn-prev" class="btn btn-stone-espinhos">Prévia</button>
      <button id="btn-retake" class="btn btn-stone-espinhos" disabled>Tirar outra</button>
      <button id="btn-confirm" class="btn btn-stone-espinhos" disabled>Confirmar / Iniciar</button>
    `;
    section.appendChild(div);

    // TODO: conectar com tua camada de câmera/máscara quando disponível
    const btnPrev = div.querySelector('#btn-prev');
    btnPrev.addEventListener('click', () => toast('Prévia: abrir câmera e aplicar máscara da chama'));
  }

  function onSkip() {
    if (global.JC?.show) global.JC.show('section-card');
    else if (global.showSection) global.showSection('section-card');
  }

  // ---------- Ordem fixa ----------
  function enforceOrder(section) {
    const head = section.querySelector('.selfie-header');
    const txt  = section.querySelector('#selfieOrientWrap');
    const ctr  = section.querySelector('#selfieControls');
    const btn  = section.querySelector('#selfieButtons');
    if (head && txt && txt.previousElementSibling !== head) { txt.remove(); placeAfter(head, txt); }
    if (txt && ctr && ctr.previousElementSibling !== txt)   { ctr.remove(); placeAfter(txt, ctr); }
    if (ctr && btn && btn.previousElementSibling !== ctr)   { btn.remove(); placeAfter(ctr, btn); }
  }

  // ---------- Play (render+digitar+tts) ----------
  async function play(section) {
    ensureHeader(section);
    const p = ensureTexto(section);

    // Render de layout primeiro
    ensureControls(section);
    ensureButtons(section);
    enforceOrder(section);

    // Datilografia + TTS (preferindo TypingBridge)
    try {
      if (global.TypingBridge && typeof global.TypingBridge.runTyping === 'function') {
        // Alguns bridges usam uma trava global; garantimos que não está travado
        global.G = global.G || {}; global.G.__typingLock = false;
        await global.TypingBridge.runTyping(p);
      } else {
        await fallbackTyping(p, +(p.dataset.speed || 28));
      }
    } catch (e) {
      console.warn('[Selfie] TypingBridge falhou, usando fallback', e);
      await fallbackTyping(p, +(p.dataset.speed || 28));
    }
  }

  // ---------- Init ----------
  async function init() {
    try {
      const s = await waitForElement('#section-selfie');
      await play(s);
    } catch (e) {
      console.warn('[Selfie] seção não encontrada a tempo', e);
    }
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);

})(window);
