(function () {
  'use strict';

  const SECTION_ID      = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS      = 'hidden';

  if (window.JCGuia?.__bound) {
    console.log('[JCGuia] já carregado');
    return;
  }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const State = { ready: false, listenerOn: false };

  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const ensureVisible = (el) => {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  };

// helper: espera o vídeo acabar
async function waitForTransitionUnlock(timeoutMs = 15000) {
  if (!window.__TRANSITION_LOCK) return;
  let resolved = false;
  const p = new Promise(resolve => {
    const onEnd = () => { if (!resolved) { resolved = true; document.removeEventListener('transition:ended', onEnd); resolve(); } };
    document.addEventListener('transition:ended', onEnd, { once: true });
  });
  const t = new Promise((resolve) => setTimeout(resolve, timeoutMs));
  await Promise.race([p, t]); // não fica preso para sempre
}

// … dentro do initOnce(root) ANTES de começar a digitar:
await waitForTransitionUnlock();

// agora sim, rode a sequência:
// for (const el of items) await typeOnce(el, ...);

  
  async function typeOnce(el, text, speed = 45) {
    if (!el || !text) return;
    el.classList.remove('typing-done');
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try { window.runTyping(el, text, () => res(), { speed, cursor: true }); }
        catch { res(); }
      });
    } else {
      el.textContent = '';
      for (let i = 0; i < text.length; i++) {
        el.textContent += text[i];
        await sleep(speed);
      }
    }
    el.classList.add('typing-done');
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc)
        || (root?.dataset?.transitionSrc)
        || '/assets/videos/filme-eu-na-irmandade.mp4';
  }

  const pick = (root) => ({
    root,
    title:      q('.titulo-pergaminho', root),
    nameInput:  q('#guiaNameInput', root),
    confirmBtn: q('#btn-confirmar-nome', root),
    guiaTexto:  q('#guiaTexto', root),
    guiaOptions: qa('.guia-options .btn-stone-espinhos, .guia-options [data-guia]', root),
    errorMsg:   q('#guia-error', root),
    advanceBtn: q('[data-action="avancar"]', root) || q('#btn-guia-avancar', root)
  });

  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    ensureVisible(root);
    const els = pick(root);

    // estado inicial
    els.errorMsg?.classList.add(HIDE_CLASS);
    els.errorMsg?.setAttribute('aria-hidden', 'true');

    if (els.nameInput)  els.nameInput.disabled = false;
    if (els.confirmBtn) els.confirmBtn.disabled = false;

    if (els.guiaOptions?.length) {
      els.guiaOptions.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; b.style.cursor = 'not-allowed'; });
    }

    // título com datilografia
    if (els.title && !els.title.classList.contains('typing-done')) {
      const txt = (els.title.dataset?.text || els.title.textContent || '').trim();
      await typeOnce(els.title, txt, 42);
    }

    // confirmar nome → habilita opções
    if (els.confirmBtn) {
      els.confirmBtn.addEventListener('click', () => {
        const name = (els.nameInput?.value || '').trim();
        if (name.length < 2) {
          window.toast?.('Por favor, insira um nome válido.', 'warning');
          els.nameInput?.focus();
          return;
        }
        if (els.guiaTexto) {
          els.guiaTexto.innerHTML = `<p>Olá, <b>${name}</b>! Escolha seu guia para a Jornada:</p>`;
        }
        if (els.guiaOptions?.length) {
          els.guiaOptions.forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; });
        }
      }, { once: true });
    }

    // clique nas opções de guia → registra e toca transição
    if (els.guiaOptions?.length) {
      els.guiaOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const guia = btn.dataset.guia || btn.getAttribute('data-value') || '(desconhecido)';
          console.log('[JCGuia] guia selecionado:', guia);

          try {
            window.JC = window.JC || {};
            window.JC.data = window.JC.data || {};
            window.JC.data.guia = guia;
          } catch {}

          const src = getTransitionSrc(root, btn);
          if (typeof window.playTransitionVideo === 'function') {
            window.playTransitionVideo(src, NEXT_SECTION_ID);
          } else {
            window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
          }
        });
      });
    }

    // botão "avançar" (se existir, mesma navegação)
    if (els.advanceBtn && !els.advanceBtn.__wired) {
      els.advanceBtn.__wired = true;
      els.advanceBtn.addEventListener('click', () => {
        const src = getTransitionSrc(root, els.advanceBtn);
        if (typeof window.playTransitionVideo === 'function') {
          window.playTransitionVideo(src, NEXT_SECTION_ID);
        } else {
          window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
        }
      });
    }

    State.ready = true;
    console.log('[JCGuia] pronto');
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    if (!State.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      State.listenerOn = true;
    }
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();

})();
