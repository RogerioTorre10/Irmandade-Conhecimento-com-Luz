/* /assets/js/section-selfie.js — FASE 1 (robusta)
   Objetivo: garantir DATILOGRAFIA + LEITURA na section-selfie,
   mesmo se TypingBridge não estiver ativo ainda.
*/
(function (global) {
  'use strict';

  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__phase1_bound) {
    console.log('[Selfie:F1] Já inicializado, ignorando.');
    return;
  }
  NS.__phase1_bound = true;

  // ---------- Utils ----------
  function waitForElement(selector, { tries = 80, interval = 120 } = {}) {
    return new Promise((resolve, reject) => {
      let n = 0;
      const t = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(t); resolve(el); }
        else if (++n >= tries) { clearInterval(t); reject(new Error('Elemento não encontrado: ' + selector)); }
      }, interval);
    });
  }

  function isVisible(el) {
    if (!el) return false;
    const s = getComputedStyle(el);
    return s.display !== 'none' && s.visibility !== 'hidden' && !el.classList.contains('hidden') && el.offsetParent !== null;
  }

  // Typewriter vanilla (fallback quando TypingBridge não está disponível)
  async function typewriter(el, text, speed = 30, cursor = true) {
    return new Promise(resolve => {
      const chars = Array.from(text);
      el.textContent = '';
      el.classList.add('typing-active');
      let i = 0;
      const timer = setInterval(() => {
        el.textContent += chars[i++];
        if (i >= chars.length) {
          clearInterval(timer);
          el.classList.remove('typing-active');
          el.classList.add('typing-done');
          resolve();
        }
      }, Math.max(5, speed));
      if (cursor) {
        el.style.setProperty('--caret', '"|"');
      }
    });
  }

  async function runTyping(el) {
    if (!el) return;
    const text = (el.getAttribute('data-text') || el.textContent || '').trim();
    const speed = Number(el.getAttribute('data-speed') || 30);
    const cursor = el.getAttribute('data-cursor') !== 'false';

    // Se existir TypingBridge, usa ele; senão, fallback vanilla
    if (global.TypingBridge && typeof global.TypingBridge.runTyping === 'function') {
      try {
        global.TypingBridge.runTyping(el, { speed, cursor });
        // tempo estimado = chars * speed + folga
        const est = Math.max(400, text.length * speed) + 500;
        await new Promise(r => setTimeout(r, est));
        return;
      } catch (e) {
        console.warn('[Selfie:F1] TypingBridge falhou, usando fallback:', e);
      }
    }
    await typewriter(el, text, speed, cursor);
  }

  // Injeta o parágrafo de orientação se não existir
  function ensureOrientationParagraph(section) {
    let orient = section.querySelector('#selfieTexto');
    if (!orient) {
      const container = section.querySelector('.parchment-inner-rough') || section;
      const block = document.createElement('div');
      block.className = 'moldura-orientacao';
      block.style.cssText = 'display:flex;justify-content:center;margin-top:8px;';
      orient = document.createElement('p');
      orient.id = 'selfieTexto';
      orient.setAttribute('data-typing', 'true');
      orient.setAttribute('data-cursor', 'true');
      orient.setAttribute('data-speed', '28');
      orient.setAttribute('data-text',
        (global.JC?.data?.participantName ?
          `${global.JC.data.participantName}, ` : 'AMOR, ') +
        'posicione-se em frente à câmera. Centralize o rosto dentro da chama, use luz frontal e ajuste o zoom.'
      );
      orient.style.cssText = 'background:rgba(0,0,0,.35);color:#f9e7c2;padding:12px 16px;border-radius:12px;text-align:center;font-family:Cardo,serif;font-size:15px;margin:0 auto 10px;width:90%;';
      block.appendChild(orient);
      // Insere depois do header
      const header = section.querySelector('.selfie-header') || section.firstElementChild;
      (header?.nextSibling ? container.insertBefore(block, header.nextSibling) : container.appendChild(block));
    }
    return orient;
  }

  // Garante que o título tenha atributos de typing
  function ensureTitleTyping(section) {
    let h2 = section.querySelector('.selfie-header h2');
    if (!h2) {
      // fallback: cria um header mínimo se não existir
      const head = document.createElement('header');
      head.className = 'selfie-header';
      h2 = document.createElement('h2');
      h2.textContent = 'Tirar sua Foto ✨';
      head.appendChild(h2);
      section.prepend(head);
    }
    if (!h2.hasAttribute('data-typing')) {
      h2.setAttribute('data-typing', 'true');
      h2.setAttribute('data-cursor', 'true');
      h2.setAttribute('data-speed', '40');
      h2.setAttribute('data-text', h2.textContent.trim() || 'Tirar sua Foto ✨');
    }
    return h2;
  }

  async function playPhase1(section) {
    try {
      // Evita rodar se a seção ainda não estiver visível
      if (!isVisible(section)) {
        // Observa visibilidade para iniciar quando aparecer
        const mo = new MutationObserver(() => {
          if (isVisible(section)) {
            mo.disconnect();
            playPhase1(section);
          }
        });
        mo.observe(section, { attributes: true, attributeFilter: ['class', 'style', 'aria-hidden'] });
        return;
      }

      if (section.__selfie_phase1_done) {
        console.log('[Selfie:F1] Já concluído nesta seção.');
        return;
      }
      console.log('[Selfie:F1] Iniciando datilografia…');

      // garante nós de título e orientação
      const titleEl  = ensureTitleTyping(section);
      const orientEl = ensureOrientationParagraph(section);

      // rola para o início da seção
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // sequência: título -> orientação
      await runTyping(titleEl);
      await runTyping(orientEl);

      section.__selfie_phase1_done = true;

      // evento para próximas fases
      const ev = new CustomEvent('selfie:phase1:done', { detail: { sectionId: 'section-selfie' } });
      section.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log('[Selfie:F1] Concluído (typing + leitura).');
    } catch (e) {
      console.warn('[Selfie:F1] Erro na fase 1:', e);
    }
  }

  async function init() {
    try {
      const section = await waitForElement('#section-selfie');
      playPhase1(section);
    } catch (e) {
      console.warn('[Selfie:F1] #section-selfie não encontrado:', e.message);
    }
  }

  // Integração com teu sistema de seções
  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') init();
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

})(window);
