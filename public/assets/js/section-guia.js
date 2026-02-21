// /assets/js/section-guia.js — v3.4 (Fase 1: preview com áudio; Fase 2: TTS da descrição)
(function () {
  'use strict';

  const SECTION_ID      = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS      = 'hidden';

  const TYPING_SPEED = 42;
  const TTS_LATCH_MS = 600;
  const DATA_URL     = '/assets/data/guias.json';

  // UX: confirmação em 2 passos
  const ARM_TIMEOUT_MS = 10000;
  const HOVER_DELAY_MS = 150;

  // Preview (10s)
  const PREVIEW_TIMEOUT_MS = 10200;

  if (window.JCGuia?.__bound) { return; }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ============================
  // ✅ FASES DE ÁUDIO/TTS (NOVO)
  // ============================
  // Fase 1 (antes de confirmar nome): preview com áudio, sem TTS de descrição
  // Fase 2 (depois de confirmar nome): preview mudo, TTS da descrição ligado
  let nomeConfirmado = false;

  // Estado do fluxo
  let hoverTimers = new Map();   // Map<guiaId, timeoutId>
  let armedId = null;            // guia armado
  let armTimer = null;           // timer do arm
  let cancelArm = null;          // função de cancelamento (definida abaixo)

  // =========================
  // PREVIEW 10s (escopo único)
  // =========================
  let previewOverlay = null;
  let previewVideo   = null;
  let previewStopTimer = null;
  let previewPlaying = false;
  let previewCurrentSrc = null;

  function ensurePreviewRefs(root) {
    if (previewOverlay && previewVideo) return true;
    // overlay/video são globais no HTML do guia
    previewOverlay = document.getElementById('guiaPreviewOverlay');
    previewVideo   = document.getElementById('guiaPreviewVideo');
    if (!previewOverlay || !previewVideo) return false;

    // configurações seguras (não forçar muted aqui; quem decide é a fase)
    previewVideo.playsInline = true;
    previewVideo.preload = 'auto';

    // se der erro no vídeo, para preview sem barulho
    previewVideo.addEventListener('error', () => {
      stopPreview();
    });

    return true;
  }

  function showPreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.add('is-on');
    previewOverlay.setAttribute('aria-hidden', 'false');
  }

  function hidePreview() {
    if (!previewOverlay) return;
    previewOverlay.classList.remove('is-on');
    previewOverlay.setAttribute('aria-hidden', 'true');
  }

  function stopPreview() {
    if (previewStopTimer) { clearTimeout(previewStopTimer); previewStopTimer = null; }
    previewPlaying = false;
    previewCurrentSrc = null;

    if (previewVideo) {
      try { previewVideo.pause(); } catch {}
      try { previewVideo.currentTime = 0; } catch {}
    }
    hidePreview();
  }

  // ✅ NOVO: withAudio controla se o preview toca com som
  async function playPreviewSrc(src, root, withAudio = false) {
    if (!src) return false;
    if (!ensurePreviewRefs(root)) return false;

    // se já está tocando o mesmo src, não reinicia
    if (previewPlaying && previewCurrentSrc === src) return true;

    // Se vamos tocar com áudio (fase 1), cancela TTS para não “abafar”
    if (withAudio) {
      try { window.speechSynthesis?.cancel?.(); } catch {}
    }

    stopPreview();
    previewPlaying = true;
    previewCurrentSrc = src;

    // áudio conforme fase
    try {
      previewVideo.muted = !withAudio;
      previewVideo.volume = withAudio ? 1 : 0;
    } catch {}

    previewVideo.src = src;
    try { previewVideo.load(); } catch {}

    showPreview();
    previewStopTimer = setTimeout(() => stopPreview(), PREVIEW_TIMEOUT_MS);

    try {
      await previewVideo.play();
      return true;
    } catch {
      stopPreview();
      return false;
    }
  }

  function bindPreviewToButtons(root, buttons) {
    if (!root || !buttons || !buttons.length) return;
    if (root.dataset.previewBound === '1') return;
    root.dataset.previewBound = '1';

    // preview por botão (SEM delegação em container)
    buttons.forEach((btn) => {
      // evita duplicar se re-renderizar
      if (btn.dataset.previewBtnBound === '1') return;
      btn.dataset.previewBtnBound = '1';

      const getSrc = () => (btn.dataset.previewSrc || '').trim();

      btn.addEventListener('mouseenter', () => {
        const src = getSrc();
        if (!src) return;
        // Fase 1: com áudio / Fase 2: mudo
        playPreviewSrc(src, root, !nomeConfirmado);
      });

      btn.addEventListener('mouseleave', () => {
        stopPreview();
      });

      btn.addEventListener('focusin', () => {
        const src = getSrc();
        if (!src) return;
        playPreviewSrc(src, root, !nomeConfirmado);
      });

      btn.addEventListener('focusout', () => stopPreview());

      btn.addEventListener('touchstart', () => {
        const src = getSrc();
        if (!src) return;
        playPreviewSrc(src, root, !nomeConfirmado);
      }, { passive: true });
    });

    // segurança: ao sair da seção, encerra preview
    window.addEventListener('jc:section:leave', stopPreview, { passive: true });
  }

  // ===== Lock de transição (vídeo) =====
  async function waitForTransitionUnlock(timeoutMs = 20000) {
    if (!window.__TRANSITION_LOCK) return;
    await Promise.race([
      new Promise(res => document.addEventListener('transition:ended', () => res(), { once: true })),
      new Promise(res => setTimeout(res, timeoutMs))
    ]);
  }

  function ensureVisible(el) {
    if (!el) return;
    el.classList.remove(HIDE_CLASS);
    el.setAttribute('aria-hidden', 'false');
    el.style.removeProperty('display');
    el.style.removeProperty('opacity');
    el.style.removeProperty('visibility');
  }

  // ===== Datilografia + TTS =====
  async function localType(el, text, speed = TYPING_SPEED) {
    return new Promise(resolve => {
      let i = 0; el.textContent = '';
      (function tick() {
        if (i < text.length) { el.textContent += text.charAt(i++); setTimeout(tick, speed); }
        else resolve();
      })();
    });
  }

  async function typeOnce(el, text, { speed = TYPING_SPEED, speak = true } = {}) {
    if (!el) return;
    const msg = (text || el.dataset?.text || el.textContent || '').trim();
    if (!msg) return;

    el.classList.add('typing-active'); el.classList.remove('typing-done');

    let usedFallback = false;
    if (typeof window.runTyping === 'function') {
      await new Promise(res => {
        try { window.runTyping(el, msg, () => res(), { speed, cursor: true }); }
        catch { usedFallback = true; res(); }
      });
    } else usedFallback = true;

    if (usedFallback) await localType(el, msg, speed);

    el.classList.remove('typing-active'); el.classList.add('typing-done');

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
      || '/assets/videos/filme-conhecimento-com-luz-jardim.mp4';
  }

  // ===== Fallback de vídeo de transição =====
  function playTransitionSafe(src, nextId) {
    if (typeof window.playTransitionVideo === 'function') {
      window.playTransitionVideo(src, nextId);
      return;
    }
    if (typeof window.playTransitionThenGo === 'function') {
      window.playTransitionThenGo(nextId, src);
      return;
    }

    try {
      window.__TRANSITION_LOCK = true;
      const v = document.createElement('video');
      v.src = src || '/assets/videos/filme-conhecimento-com-luz-jardim.mp4';
      v.playsInline = true;
      v.muted = true;
      v.autoplay = true;
      v.preload = 'auto';
      v.style.cssText = `
        position:fixed;inset:0;z-index:9999;background:#000;
        width:100%;height:100%;object-fit:cover
      `;

      const endTransition = () => {
        v.remove();
        window.__TRANSITION_LOCK = false;
        (window.JC && JC.show) ? JC.show(nextId, { force: true }) : (location.hash = '#' + nextId);
        document.dispatchEvent(new CustomEvent('transition:ended'));
      };

      v.addEventListener('ended', endTransition, { once: true });
      v.addEventListener('error', () => {
        endTransition();
      }, { once: true });

      document.body.appendChild(v);
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => endTransition());
      }
    } catch {
      window.__TRANSITION_LOCK = false;
      (window.JC && JC.show) ? JC.show(nextId, { force: true }) : (location.hash = '#' + nextId);
      document.dispatchEvent(new CustomEvent('transition:ended'));
    }
  }

  // ===== CONFIRMAÇÃO FINAL =====
  async function confirmGuide(guiaId) {
    const root = document.getElementById(SECTION_ID);
    if (!root) return;

    const input = root.querySelector('#guiaNameInput');
    if (!input) return;

    try {
      // encerra preview antes de transicionar
      stopPreview();

      const nome = (input.value || '').trim();
      if (!nome) return;

      sessionStorage.setItem('jornada.nome', nome);
      localStorage.setItem('JORNADA_NOME', nome);

      const guiaAtual = guiaId ? String(guiaId).toLowerCase().trim() : 'zion';

      sessionStorage.setItem('jornada.guia', guiaAtual);
      try {
        window.JC = window.JC || {};
        window.JC.data = window.JC.data || {};
        window.JC.data.guia = guiaAtual;
      } catch {}

      try {
        applyGuiaTheme(guiaAtual);
      } catch {
        document.body.setAttribute('data-guia', guiaAtual);
      }
      window.aplicarGuiaTheme = window.aplicarGuiaTheme || applyGuiaTheme;

      const btnAvancar = root.querySelector('#btn-avancar') || root.querySelector('[data-action="avancar"]');
      if (btnAvancar) {
        btnAvancar.disabled = false;
        btnAvancar.classList.remove('is-hidden');
        btnAvancar.focus?.();
      }

      if (armTimer) { clearTimeout(armTimer); armTimer = null; }
      armedId = null;

      const src = getTransitionSrc(root, btnAvancar);
      playTransitionSafe(src, NEXT_SECTION_ID);
    } catch {
      playTransitionSafe(getTransitionSrc(root, null), NEXT_SECTION_ID);
    }
  }

  function pick(root) {
    return {
      root,
      title:      q('.titulo-pergaminho', root),
      nameInput:  q('#guiaNameInput', root),
      confirmBtn: q('#btn-confirmar-nome', root),
      moldura:    q('.moldura-grande', root),
      guiaTexto:  q('#guiaTexto', root),
      optionsBox: q('.guia-options', root),
      errorBox:   q('#guia-error', root)
    };
  }

  async function loadGuias() {
    const r = await fetch(DATA_URL, { cache: 'no-store' });
    if (!r.ok) throw new Error(`GET ${DATA_URL} -> ${r.status}`);
    return r.json();
  }

  function renderButtons(optionsBox, guias) {
    optionsBox.innerHTML = '';
    guias.forEach(g => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-stone-espinhos no-anim guia-option';
      btn.dataset.action = 'select-guia';
      btn.dataset.guia = String(g.id || '').trim().toLowerCase();

      // trava por lógica (não usar disabled)
      btn.dataset.locked = '1';
      btn.setAttribute('aria-disabled', 'true');
      btn.classList.add('is-locked');

      // Preview do guia (10s) — nomes reais do repo
      const gid = btn.dataset.guia;
      const PREVIEW_BY_ID = {
        zion:  '/assets/videos/Zion-escolhido.mp4',
        lumen: '/assets/videos/Lumen-escolhida.mp4',
        arian: '/assets/videos/Arian-escolhida.mp4',
      };
      btn.dataset.previewSrc = encodeURI(PREVIEW_BY_ID[gid] || '');

      btn.dataset.nome = g.nome;
      btn.setAttribute('aria-label', `Escolher o guia ${g.nome}`);
      btn.innerHTML = `<span class="label">${g.nome}</span>`;

      if (g.bgImage) {
        btn.style.backgroundImage = `url('${g.bgImage}')`;
        btn.style.backgroundSize = 'cover';
        btn.style.backgroundPosition = 'center';
      }

      optionsBox.appendChild(btn);
    });
  }

  function findGuia(guias, id) {
    id = (id || '').toLowerCase();
    return guias.find(g => (g.id || '').toLowerCase() === id);
  }

  // ===== AVISO (#guia-error) =====
  function getNoticeRefs(root) {
    const box = q('#guia-error', root);
    if (!box) return { box: null, span: null };
    let span = box.querySelector('#guia-notice-text');
    if (!span) {
      span = document.createElement('span');
      span.id = 'guia-notice-text';
      box.innerHTML = '';
      box.appendChild(span);
    }
    return { box, span };
  }

  async function showNotice(root, text, { speak = true } = {}) {
    const { box, span } = getNoticeRefs(root);
    if (!box || !span) return;
    box.classList.remove(HIDE_CLASS);
    box.setAttribute('aria-hidden', 'false');
    span.dataset.text = text;
    span.textContent = '';
    await typeOnce(span, null, { speed: 30, speak });
  }

  function hideNotice(root) {
    const { box, span } = getNoticeRefs(root);
    if (!box) return;
    if (span) span.textContent = '';
    box.classList.add(HIDE_CLASS);
    box.setAttribute('aria-hidden', 'true');
  }

  // ===== ARMAR GUIA (2 CLICKS) =====
  function armGuide(root, btn, label) {
    const guiaId = (btn?.dataset?.guia || '').toLowerCase().trim();
    if (!guiaId) return;

    if (armedId === guiaId) {
      confirmGuide(guiaId);
      if (cancelArm) cancelArm(root);
      return;
    }

    if (armTimer) { clearTimeout(armTimer); armTimer = null; }

    root.querySelectorAll('.guia-option').forEach(el => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });

    btn.classList.add('armed');
    btn.setAttribute('aria-pressed', 'true');

    armedId = guiaId;

    showNotice(root, `Você escolheu ${label}. Clique novamente para confirmar.`, { speak: true });

    armTimer = setTimeout(() => {
      armedId = null;
      armTimer = null;

      root.querySelectorAll('.guia-option').forEach(el => {
        el.classList.remove('armed');
        el.setAttribute('aria-pressed', 'false');
      });

      showNotice(root, 'Tempo esgotado. Selecione o guia e clique novamente para confirmar.', { speak: true });
    }, ARM_TIMEOUT_MS);

    const guiaCanon = 'arion' // ou lumen/zion conforme escolhido
    localStorage.setItem('JORNADA_GUIA', guiaCanon);
    sessionStorage.setItem('JORNADA_GUIA', guiaCanon);
    window.JORNADA_STATE = window.JORNADA_STATE || {};
    window.JORNADA_STATE.guia = guiaCanon;
    window.JORNADA_STATE.guiaSelecionado = guiaCanon;
  }

  cancelArm = function (root) {
    armedId = null;
    if (armTimer) { clearTimeout(armTimer); armTimer = null; }

    root?.querySelectorAll('.guia-option').forEach(el => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });

    hideNotice(root);
  };

  // ===== TEMA DINÂMICO =====
  function applyGuiaTheme(guiaIdOrNull) {
    if (guiaIdOrNull) {
      document.body.dataset.guia = guiaIdOrNull.toLowerCase();
      return;
    }

    const saved =
      (window.JC && window.JC.data && window.JC.data.guia) ||
      sessionStorage.getItem('jornada.guia') ||
      '';

    if (saved) document.body.dataset.guia = saved.toLowerCase();
    else delete document.body.dataset.guia;
  }

  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    await waitForTransitionUnlock();
    ensureVisible(root);

    const els = pick(root);
    let guias = [];
    let guideButtons = [];

    // nome em maiúsculo
    if (els.nameInput && !els.nameInput.dataset.upperBound) {
      els.nameInput.dataset.upperBound = '1';
      els.nameInput.addEventListener('input', () => {
        const start = els.nameInput.selectionStart;
        const end = els.nameInput.selectionEnd;
        els.nameInput.value = (els.nameInput.value || '').toUpperCase();
        els.nameInput.setSelectionRange(start, end);
      });
    }

    // título
    if (els.title && !els.title.classList.contains('typing-done')) {
      await typeOnce(els.title, null, { speed: 34, speak: true });
    }

   // carrega guias
let topBox = null;
let bottomBox = null;

try {
  guias = await loadGuias();

  topBox = root.querySelector('.guia-options-top');
  bottomBox = root.querySelector('.guia-options-bottom');

  if (topBox) renderButtons(topBox, guias);
  if (bottomBox) renderButtons(bottomBox, guias);

  // estado inicial:
  // botões de cima ATIVOS (preview apenas)
  // botões de baixo DESABILITADOS
  if (topBox) {
    topBox.classList.remove('disabled');
    topBox.classList.add('enabled');
  }

  if (bottomBox) {
    bottomBox.classList.remove('enabled');
    bottomBox.classList.add('disabled');
  }

  hideNotice(root);
} catch {
  showNotice(root, 'Não foi possível carregar os guias. Tente novamente mais tarde.', { speak: false });
  return;
}

// pega botões dos DOIS containers (topo + baixo)
guideButtons = [
  ...qa('button[data-action="select-guia"]', topBox || root),
  ...qa('button[data-action="select-guia"]', bottomBox || root),
];

// trava seleção nos dois grupos no início (mantém preview ok)
guideButtons.forEach(b => {
  b.dataset.locked = '1';
  b.setAttribute('aria-disabled', 'true');
  b.classList.add('is-locked');
  b.style.opacity = '0.6';
  b.style.cursor = 'pointer';
  b.style.pointerEvents = 'auto';
});


    // BIND preview (único e limpo)
    bindPreviewToButtons(root, guideButtons);

    // confirmar começa bloqueado; libera conforme input
    let __NAME_CONFIRMED__ = false;
    if (els.confirmBtn) els.confirmBtn.disabled = true;

    if (els.nameInput && !els.nameInput.dataset.confirmGateBound) {
      els.nameInput.dataset.confirmGateBound = '1';
      els.nameInput.addEventListener('input', () => {
        const v = (els.nameInput?.value || '').trim();
        if (els.confirmBtn) els.confirmBtn.disabled = (v.length < 2);
      });
    }

    if (els.confirmBtn && !els.confirmBtn.dataset.confirmBound) {
      els.confirmBtn.dataset.confirmBound = '1';
      els.confirmBtn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();

        const name = (els.nameInput?.value || '').trim();
        if (name.length < 2) {
          els.nameInput?.focus();
          return;
        }

        // ✅ ao confirmar o nome, entramos na FASE 2
        nomeConfirmado = true;

        // ✅ evita mix de áudio: para preview e cancela TTS antes de falar descrição
        stopPreview();
        try { window.speechSynthesis?.cancel?.(); } catch {}

        const upperName = name.toUpperCase();
        els.nameInput.value = upperName;

        try {
          window.JC = window.JC || {};
          window.JC.data = window.JC.data || {};
          window.JC.data.nome = upperName;

          sessionStorage.setItem('jornada.nome', upperName);
          localStorage.setItem('jc.nome', upperName);
        } catch {}

        if (!__NAME_CONFIRMED__) {
          __NAME_CONFIRMED__ = true;

          if (els.guiaTexto) {
            const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
            const msg = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);
            els.guiaTexto.textContent = '';
            await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });
            els.moldura?.classList.add('glow');
            els.guiaTexto?.classList.add('glow');
          }
        }

        // destrava seleção (preview já funciona antes)
        guideButtons.forEach(b => {
          b.dataset.locked = '0';
          b.removeAttribute('aria-disabled');
          b.classList.remove('is-locked');
          b.style.opacity = '1';
          b.style.cursor = 'pointer';
          b.style.pointerEvents = 'auto';
        });

        hideNotice(root);
      });
    }

    // eventos dos botões de guia (bind 1x)
    if (root.dataset.guiaButtonsBound !== '1') {
      root.dataset.guiaButtonsBound = '1';

      guideButtons.forEach(btn => {
        const guiaId = (btn.dataset.guia || btn.textContent || '').toLowerCase().trim();
        const label = (btn.dataset.nome || btn.textContent || 'guia').toUpperCase();

        // Hover: descrição + tema (com speak condicionado pela fase)
        btn.addEventListener('mouseenter', () => {
          if (!guiaId) return;

          if (hoverTimers.has(guiaId)) clearTimeout(hoverTimers.get(guiaId));

          const timer = setTimeout(async () => {
            const g = findGuia(guias, guiaId);
            if (g && els.guiaTexto) {
              els.guiaTexto.dataset.spoken = '';
              // ✅ Fase 1: NÃO fala descrição (para não abafar o vídeo)
              // ✅ Fase 2: fala descrição normalmente
              await typeOnce(els.guiaTexto, g.descricao, { speed: 34, speak: !!nomeConfirmado });
            }
            applyGuiaTheme(guiaId);
          }, HOVER_DELAY_MS);

          hoverTimers.set(guiaId, timer);
        });

        btn.addEventListener('mouseleave', () => {
          if (!guiaId) return;
          if (hoverTimers.has(guiaId)) {
            clearTimeout(hoverTimers.get(guiaId));
            hoverTimers.delete(guiaId);
          }
          applyGuiaTheme(null);
        });

        btn.addEventListener('focus', () => {
          const g = findGuia(guias, guiaId);
          if (g && els.guiaTexto) {
            els.guiaTexto.dataset.spoken = '';
            typeOnce(els.guiaTexto, g.descricao, { speed: 34, speak: !!nomeConfirmado });
          }
        });

        // Clique simples: armar
        btn.addEventListener('click', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (btn.dataset.locked === '1') return;
          armGuide(root, btn, label);
        });

        // Double-click: confirmar direto
        btn.addEventListener('dblclick', (ev) => {
          ev.preventDefault();
          ev.stopPropagation();
          if (btn.dataset.locked === '1') return;
          confirmGuide(guiaId);
          if (cancelArm) cancelArm(root);
        });

        // Teclado: Enter/Espaço
        btn.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            if (btn.dataset.locked === '1') return;
            armGuide(root, btn, label);
          }
        });

        btn.setAttribute('role', 'button');
        btn.setAttribute('tabindex', '0');
        btn.setAttribute('aria-pressed', 'false');
      });

      // cancelar arm ao clicar fora (1x global)
      if (!document.documentElement.dataset.guiaOutsideCancelBound) {
        document.documentElement.dataset.guiaOutsideCancelBound = '1';
        document.addEventListener('click', (e) => {
          const inside = e.target.closest('.guia-option, .guia-options, #btn-confirmar-nome, #guiaNameInput');
          if (!inside && armedId && cancelArm) {
            const r = document.getElementById(SECTION_ID);
            if (r) cancelArm(r);
          }
        }, { passive: true });
      }
    }
  }

  function onSectionShown(evt) {
    const { sectionId, node } = evt?.detail || {};
    if (sectionId !== SECTION_ID) return;
    initOnce(node || document.getElementById(SECTION_ID));
  }

  function bind() {
    document.addEventListener('section:shown', onSectionShown, { passive: true });
    const now = document.getElementById(SECTION_ID);
    if (now && !now.classList.contains(HIDE_CLASS)) initOnce(now);
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', bind, { once: true })
    : bind();

  // =========================================================
  // TEMA DO GUIA — reaplica em qualquer seção quando necessário
  // =========================================================
  function applyThemeFromSession() {
    const guiaRaw = sessionStorage.getItem('jornada.guia');
    const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

    let main = '#ffd700', g1 = 'rgba(255,230,180,0.85)', g2 = 'rgba(255,210,120,0.75)';
    if (guia === 'lumen') { main = '#00ff9d'; g1 = 'rgba(0,255,157,0.90)'; g2 = 'rgba(120,255,200,0.70)'; }
    if (guia === 'zion')  { main = '#00aaff'; g1 = 'rgba(0,170,255,0.90)'; g2 = 'rgba(255,214,91,0.70)'; }
    if (guia === 'arian') { main = '#ff00ff'; g1 = 'rgba(255,120,255,0.95)'; g2 = 'rgba(255,180,255,0.80)'; }

    document.documentElement.style.setProperty('--theme-main-color', main);
    document.documentElement.style.setProperty('--progress-main', main);
    document.documentElement.style.setProperty('--progress-glow-1', g1);
    document.documentElement.style.setProperty('--progress-glow-2', g2);
    document.documentElement.style.setProperty('--guide-color', main);

    if (guia) document.body.setAttribute('data-guia', guia);
  }

  document.addEventListener('DOMContentLoaded', applyThemeFromSession);
  document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
  document.addEventListener('guia:changed', applyThemeFromSession);

})();
