/* /assets/js/section-selfie.js — FASE 3.3
   - Garante render de controles e botões mesmo com TTS ativo
   - Ordem fixa e compacta (Header → Texto → Controles → Botões)
   - Reforços anti-race (RAF + setTimeouts)
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase33_bound) return;
  NS.__phase33_bound = true;

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
  const waitForElement = (sel, opt = {}) =>
    new Promise((res, rej) => {
      let t = 0;
      const i = setInterval(() => {
        const e = document.querySelector(sel);
        if (e) { clearInterval(i); res(e); }
        else if (++t > (opt.tries || 60)) { clearInterval(i); rej(); }
      }, opt.interval || 100);
    });

  const placeAfter = (ref, node) => {
    if (!ref || !ref.parentElement || !node) return;
    ref.nextSibling ? ref.parentElement.insertBefore(node, ref.nextSibling)
                    : ref.parentElement.appendChild(node);
  };

  const toast = (msg) => { if (global.toast) return global.toast(msg); console.log('[Toast]', msg); };

  // Helpers para reforçar montagem
  function raf(fn){ return requestAnimationFrame(fn); }

  // ---------- Typing (leve) ----------
  function runTyping(el) {
    if (!el) return;
    // Se já foi tipado, não repetir
    if (el.__typedDone) return;
    const txt = (el.dataset.text || el.textContent || '').trim();
    const spd = +el.dataset.speed || 28;
    el.textContent = '';
    let i = 0;
    const chars = [...txt];
    const interval = setInterval(() => {
      el.textContent += chars[i++];
      if (i >= chars.length) {
        clearInterval(interval);
        el.__typedDone = true;
        // Dispara um evento local de término de parágrafo (compat com hooks)
        try { window.dispatchEvent(new CustomEvent('typing:paragraph:done')); } catch {}
      }
    }, spd);
  }

  // ========= BLOCO DE UI =========

  // ---------- Header ----------
  function ensureHeader(section) {
    let head = section.querySelector('.selfie-header');
    if (!head) {
      head = document.createElement('header');
      head.className = 'selfie-header';
      head.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin:-6px 0 4px;';
      head.innerHTML = `
        <h2 data-text="Tirar sua Foto ✨" data-typing="true" data-speed="40">Tirar sua Foto ✨</h2>
        <button id="btn-skip-selfie" class="btn btn-stone-espinhos">Não quero foto / Iniciar</button>
      `;
      head.querySelector('#btn-skip-selfie').onclick = () => onSkip();
      section.prepend(head);
    }
    return head;
  }

  // ---------- Texto orientação ----------
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
      p.style.cssText = 'background:rgba(0,0,0,.35);color:#f9e7c2;padding:10px 14px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto;width:92%;max-width:820px;';
      p.dataset.text = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
      wrap.appendChild(p);
    } else {
      // Atualiza o texto se necessário
      if (p.dataset && p.dataset.text && !p.__typedDone) {
        p.dataset.text = `${upper}, posicione-se em frente à câmera e centralize o rosto dentro da chama. Use boa luz e evite sombras.`;
      }
    }
    return p;
  }

  // ---------- Controles ----------
  function ensureControls(section) {
    if (section.querySelector('#selfieControls')) return;
    // estilos mínimos locais (não conflitam com globais)
    if (!document.getElementById('selfieControlsStyles')) {
      const style = document.createElement('style');
      style.id = 'selfieControlsStyles';
      style.textContent = `
        #selfieControls{margin:6px auto 8px;width:92%;max-width:820px;background:rgba(0,0,0,.32);
          border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:8px 10px;color:#f9e7c2;
          font-family:Cardo,serif;font-size:14px;opacity:0;transition:opacity .14s ease}
        #selfieControls.is-mounted{opacity:1}
        #selfieControls .row{display:grid;grid-template-columns:130px 1fr 56px;gap:8px;align-items:center;margin:4px 0}
        #selfieControls input[type=range]{width:100%;height:
