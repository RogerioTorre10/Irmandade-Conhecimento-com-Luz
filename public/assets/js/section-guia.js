(function () {
  'use strict';

  const SECTION_ID      = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS      = 'hidden';

  const TYPING_SPEED = 42;
  const TTS_LATCH_MS = 600;

  if (window.JCGuia?.__bound) {
    console.log('[JCGuia] já carregado');
    return;
  }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;
  const State = { ready: false, listenerOn: false };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  // 🔒 Espera qualquer vídeo de transição terminar
  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;
    let resolved = false;
    const p = new Promise(resolve => {
      const onEnd = () => { if (!resolved) { resolved = true; document.removeEventListener('transition:ended', onEnd); resolve(); } };
      document.addEventListener('transition:ended', onEnd, { once: true });
    });
    const t = new Promise(resolve => setTimeout(resolve, timeoutMs));
    await Promise.race([p, t]);
  }

  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0; el.textContent = '';
      (function tick() { if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(tick, speed); } else resolve(); })();
    });
  }

  async function typeOnce(el, text, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if (!msg) return;

    el.classList.add('typing-active');
    el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => { try { window.runTyping(el, msg, () => res(), { speed, cursor: true }); } catch { usedFallback = true; res(); } });
    } else usedFallback = true;
    if (usedFallback) await localType(el, msg, speed);

    el.classList.remove('typing-active');
    el.classList.add('typing-done');

    if (speak && msg && !el.dataset.spoken) {
      try {
        speechSynthesis.cancel?.();
        if (window.EffectCoordinator?.speak) {
          await window.EffectCoordinator.speak(msg, { lang: 'pt-BR', rate: 1.06, pitch: 1.0 });
          await sleep(TTS_LATCH_MS);
          el.dataset.spoken = 'true';
        }
      } catch {}
    }
    await sleep(60);
  }

  function getTransitionSrc(root, btn) {
    return (btn?.dataset?.transitionSrc)
        || (root?.dataset?.transitionSrc)
        || '/assets/videos/filme-eu-na-irmandade.mp4';
  }

  function resolveGuideLabel(btn) {
    // prioridade: data-label > data-guia normalizado > id conhecido > texto existente
    const dataLabel = btn.dataset.label && btn.dataset.label.trim();
    if (dataLabel) return dataLabel;

    const guia = (btn.dataset.guia || '').trim().toLowerCase();
    if (guia) return guia.charAt(0).toUpperCase() + guia.slice(1);

    const id = (btn.id || '').toLowerCase();
    if (id.includes('zion'))  return 'Zion';
    if (id.includes('lumen')) return 'Lumen';
    if (id.includes('arian') || id.includes('ariane') || id.includes('arian_') || id.includes('arian-btn')) return 'Arian';
    if (id.includes('arian')) return 'Arian'; // redundância segura

    const current = (btn.textContent || '').trim();
    return current || 'Guia';
  }

  function pick(root) {
    const scope = root.querySelector('#guia') || root;
    return {
      root,
      scope,
      // título/pergunta (ex.: "Insira seu nome")
      title: q('.titulo-pergaminho, [data-role="guia-title"], #guia-title', scope),
      // input + confirmar
      nameInput:  q('#guiaNameInput', scope),
      confirmBtn: q('#btn-confirmar-nome', scope),
      // texto com datilografia/leitura (aparece após confirmar)
      guiaTexto:  q('#guiaTexto, [data-role="guia-texto"]', scope),
      // botões dos guias
      guiaOptions: qa('.guia-options button, .guia-options [data-guia], [data-role="guia-option"]', scope),
      // fallback avançar (se existir)
      advanceBtn: q('[data-action="avancar"], #btn-guia-avancar', scope),
      // mensagem de erro
      errorMsg:   q('#guia-error', scope)
    };
  }

  function setButtonsLabels(btns) {
    if (!btns?.length) return;
    btns.forEach(b => {
      const label = resolveGuideLabel(b);
      // Mantém ícones/spans internos; garante um texto visível principal
      if (!b.querySelector('.label')) {
        const span = document.createElement('span');
        span.className = 'label';
        span.textContent = label;
        // se botão já tem conteúdo, preserva e apenas garante o rótulo no fim
        if (b.childNodes.length) b.appendChild(document.createTextNode(' '));
        b.appendChild(span);
      } else {
        b.querySelector('.label').textContent = label;
      }
      // também espelha em aria-label
      b.setAttribute('aria-label', label);
    });
  }

  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    // 🔒 aguarda término de transição anterior
    await waitForTransitionUnlock();

    ensureVisible(root);
    const els = pick(root);

    // estado inicial
    els.errorMsg?.classList.add(HIDE_CLASS);
    els.errorMsg?.setAttribute('aria-hidden', 'true');

    // título/pergunta (datilografia + leitura)
    if (els.title && !els.title.classList.contains('typing-done')) {
      await typeOnce(els.title, null, { speed: TYPING_SPEED, speak: true });
    }

    // prepara botões de guia desativados até confirmar nome
    if (els.guiaOptions?.length) {
      setButtonsLabels(els.guiaOptions); // garante rótulos: Zion/Lumen/Arian
      els.guiaOptions.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; b.style.cursor = 'not-allowed'; });
    }

    // confirma nome → habilita texto e opções
    els.confirmBtn?.addEventListener('click', async () => {
      const name = (els.nameInput?.value || '').trim();
      if (name.length < 2) {
        window.toast?.('Por favor, insira um nome válido.', 'warning');
        els.nameInput?.focus();
        return;
      }

      // Texto do container (datilografia + leitura), personalizando com o nome
      if (els.guiaTexto) {
        // prioriza data-text; se tiver {{nome}}, substitui
        const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
        const msg  = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, name);
        els.guiaTexto.textContent = ''; // limpa pra datilografia
        await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });
      }
      // Texto do container (datilografia + leitura)
if (els.guiaTexto) {
  const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
  const msg  = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, name);
  els.guiaTexto.textContent = '';
  await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });

  // ✨ Ativa o brilho dourado após o texto
  const moldura = els.guiaTexto.closest('.moldura-grande');
  moldura?.classList.add('glow');
  els.guiaTexto?.classList.add('glow');
}


      // habilita as opções
      if (els.guiaOptions?.length) {
        els.guiaOptions.forEach(b => { b.disabled = false; b.style.opacity = '1'; b.style.cursor = 'pointer'; });
      }
    }, { once: true });

    // clique nas opções → registra guia e toca transição
    if (els.guiaOptions?.length) {
      els.guiaOptions.forEach(btn => {
        btn.addEventListener('click', () => {
          if (btn.disabled) return;
          const guia = (btn.dataset.guia || btn.getAttribute('data-value') || resolveGuideLabel(btn)).trim();
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

    // fallback "avançar" (se existir)
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
