(function () {
  'use strict';

  const MOD = 'section-guia.js';
  const SECTION_ID = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS = 'hidden';

  if (window.JCGuia?.__bound) {
    console.log('[JCGuia] já carregado');
    return;
  }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const State = { ready: false, listenerOn: false };
  const q = (sel, root = document) => root.querySelector(sel);
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

  const typeOnce = async (el, text, speed = 45) => {
    if (!el || !text) return;
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
  };

  btn.addEventListener('click', () => {
      if (window.speechSynthesis?.cancel) speechSynthesis.cancel();
      if (typeof window.playTransitionVideo === 'function') {
        window.playTransitionVideo('/assets/videos/filme-eu-na-irmandade.mp4', NEXT_SECTION_ID);
      } else {
        window.JC?.show?.(NEXT_SECTION_ID) ?? (location.hash = `#${NEXT_SECTION_ID}`);
      }
    }, { once: true });
  }
  const playTransitionVideo = (nextId) => {
    console.log('[JCSenha] transição vídeo →', VIDEO_SRC);
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(VIDEO_SRC, nextId);
    } else if (window.JC?.show) {
      window.JC.show(nextId);
    } else {
      location.hash = `#${nextId}`;
    }
  };

  const pick = (root) => ({
    root,
    title: q('.titulo-pergaminho', root),
    nameInput: q('#guiaNameInput', root),
    confirmBtn: q('#btn-confirmar-nome', root),
    guiaTexto: q('#guiaTexto', root),
    guiaOptions: qa('.guia-options .btn-stone-espinhos', root),
    errorMsg: q('#guia-error', root)
  });

  const initOnce = async (root) => {
    if (!root) return;
    if (root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    ensureVisible(root);

    const els = pick(root);

    if (els.errorMsg) {
      els.errorMsg.classList.add(HIDE_CLASS);
      els.errorMsg.setAttribute('aria-hidden', 'true');
    }
    if (els.nameInput) els.nameInput.disabled = false;
    if (els.confirmBtn) els.confirmBtn.disabled = false;
    if (els.guiaOptions?.length) {
      els.guiaOptions.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; });
    }

    if (els.title && !els.title.classList.contains('typing-done')) {
      const txt = (els.title.dataset?.text || els.title.textContent || '').trim();
      await typeOnce(els.title, txt);
    }

    if (els.confirmBtn) {
      els.confirmBtn.addEventListener('click', () => {
        const name = (els.nameInput?.value || '').trim();
        if (name.length < 2) {
          window.toast?.('Por favor, insira um nome válido.', 'warning');
          els.nameInput?.focus();
          return;
        }
        if (els.guiaTexto) {
          els.guiaTexto.innerHTML = `<p>Olá, ${name}! Escolha seu guia para a Jornada:</p>`;
        }
        if (els.guiaOptions?.length) {
          els.guiaOptions.forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; });
        }
      }, { once: true });
    }

    if (els.guiaOptions?.length) {
      els.guiaOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const guia = btn.dataset.guia || '(desconhecido)';
          console.log('[JCGuia] guia selecionado:', guia);
          playTransitionVideo(NEXT_SECTION_ID);
        });
      });
    }

    State.ready = true;
    console.log('[JCGuia] pronto');
  };

  const onSectionShown = (evt) => {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    const root = node || document.getElementById(SECTION_ID);
    initOnce(root);
  };

  const bind = () => {
    if (!State.listenerOn) {
      document.addEventListener('section:shown', onSectionShown, { passive: true });
      State.listenerOn = true;
    }
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) {
      initOnce(now);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }

})();
