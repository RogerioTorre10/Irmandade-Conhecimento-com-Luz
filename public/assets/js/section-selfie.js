/* /assets/js/section-selfie.js — FASE 1
   Objetivo: apenas DATILOGRAFIA + LEITURA na section-selfie.
   Próximas fases: botões → controles → container da chama.
*/
(function (global) {
  'use strict';

  // Namespace e guarda
  const NS = (global.JCSelfie = global.JCSelfie || {});
  if (NS.__bound_phase1) {
    console.log('[section-selfie.js:F1] Já inicializado. Ignorando.');
    return;
  }
  NS.__bound_phase1 = true;

  // Utilitário: esperar elemento
  function waitForElement(selector, { tries = 50, interval = 120 } = {}) {
    return new Promise((resolve, reject) => {
      let n = 0;
      const t = setInterval(() => {
        const el = document.querySelector(selector);
        if (el) { clearInterval(t); resolve(el); }
        else if (++n >= tries) { clearInterval(t); reject(new Error('Elemento não encontrado: ' + selector)); }
      }, interval);
    });
  }

  // Utilitário: calcular tempo de datilografia com base no data-speed
  function estimateTypingMs(el) {
    const text = (el.dataset.text || el.textContent || '').trim();
    const speed = Number(el.dataset.speed || 30); // ms por caractere
    const base = Math.max(400, text.length * speed);
    // margem para TTS iniciar/terminar
    return base + 500;
  }

  // Aciona TypingBridge no elemento; se não existir, apenas revela o texto
  async function runTyping(el) {
    if (!el) return;
    try {
      // se já tem data-typing, só garante visibilidade
      el.setAttribute('data-typing', 'true');
      // dispara TypingBridge se disponível
      if (global.TypingBridge && typeof global.TypingBridge.runTyping === 'function') {
        global.TypingBridge.runTyping(el, {
          cursor: el.dataset.cursor !== 'false',
          speed: Number(el.dataset.speed || 30)
        });
        // aguarda tempo estimado
        await new Promise(r => setTimeout(r, estimateTypingMs(el)));
      } else {
        // fallback simples: mostra texto sem efeito
        const t = el.dataset.text || el.textContent || '';
        el.textContent = t;
        el.classList.add('typing-done');
        await new Promise(r => setTimeout(r, 250));
      }
    } catch (e) {
      console.warn('[section-selfie:F1] Erro no typing:', e);
    }
  }

  // Sequência Fase 1: título -> parágrafo de orientação
  async function playPhase1Typing(section) {
    try {
      const title = section.querySelector('.selfie-header h2[data-typing]');
      const orient = section.querySelector('#selfieTexto[data-typing]');

      if (!title && !orient) {
        console.log('[section-selfie:F1] Nada para datilografar.');
        return;
      }

      // rola para garantir visibilidade
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // 1) Título
      if (title) {
        console.log('[section-selfie:F1] Datilografando título…');
        await runTyping(title);
      }

      // 2) Texto orientação
      if (orient) {
        console.log('[section-selfie:F1] Datilografando orientação…');
        await runTyping(orient);
      }

      // Sinaliza conclusão da fase 1 (para as próximas fases encadearem)
      const ev = new CustomEvent('selfie:phase1:done', { detail: { sectionId: 'section-selfie' } });
      section.dispatchEvent(ev);
      document.dispatchEvent(ev);
      console.log('[section-selfie:F1] Concluída (typing + leitura).');

    } catch (e) {
      console.warn('[section-selfie:F1] Falha na sequência:', e);
    }
  }

  // Entrada principal: quando a seção estiver no DOM
  async function initPhase1() {
    try {
      const section = await waitForElement('#section-selfie');
      // Evita repetir na mesma seção
      if (section.__phase1Ready) {
        console.log('[section-selfie:F1] Section já preparada.');
        return;
      }
      section.__phase1Ready = true;
      console.log('[section-selfie:F1] Section encontrada. Iniciando datilografia…');
      await playPhase1Typing(section);
    } catch (e) {
      console.warn('[section-selfie:F1] Section selfie não encontrada no DOM:', e.message);
    }
  }

  // Reage ao seu sistema de navegação (se existir)
  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId === 'section-selfie') {
      initPhase1();
    }
  });

  // Fallback: se já estiver visível ao carregar
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initPhase1();
  } else {
    document.addEventListener('DOMContentLoaded', initPhase1);
  }

})(window);
