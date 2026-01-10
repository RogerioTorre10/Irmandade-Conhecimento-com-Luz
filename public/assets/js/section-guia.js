// /assets/js/section-guia.js — v3.2 (NOME + GUIA SALVOS COM GARANTIA + 2 PASSOS + TTS + AURA)
(function () {
  'use strict';

  const SECTION_ID      = 'section-guia';
  const NEXT_SECTION_ID = 'section-selfie';
  const HIDE_CLASS      = 'hidden';

  const TYPING_SPEED = 42;
  const TTS_LATCH_MS = 600;
  const DATA_URL     = '/assets/data/guias.json';

  // UX: confirmação em 2 passos
  const ARM_TIMEOUT_MS = 10000;   // tempo para confirmar após 1º clique
  const HOVER_DELAY_MS = 150;     // atraso para preview no hover

  if (window.JCGuia?.__bound) { console.log('[JCGuia] já carregado'); return; }
  window.JCGuia = window.JCGuia || {};
  window.JCGuia.__bound = true;

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const q  = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

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

  // ===== Fallback de vídeo de transição (100% seguro) =====
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
        console.warn('[guia] erro no vídeo de transição, seguindo...');
        endTransition();
      }, { once: true });

      document.body.appendChild(v);
      const p = v.play();
      if (p && typeof p.catch === 'function') {
        p.catch(() => {
          console.warn('[guia] autoplay bloqueado, indo direto...');
          endTransition();
        });
      }
    } catch (e) {
      console.error('[guia] fallback transição falhou', e);
      window.__TRANSITION_LOCK = false;
      (window.JC && JC.show) ? JC.show(nextId, { force: true }) : (location.hash = '#' + nextId);
      document.dispatchEvent(new CustomEvent('transition:ended'));
    }
  }

  // ===== CONFIRMAÇÃO FINAL (GUIA + NOME SALVO) =====
  let armedId = null;
  let armTimer = null;
  const hoverTimers = new Map();

  function cancelArm(root) {
    if (armTimer) clearTimeout(armTimer);
    armTimer = null;
    armedId = null;
    qa('.guia-option.armed', root).forEach(el => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });
    hideNotice(root);
  }

  function confirmGuide(root, guiaId, guiaName) {
    // === SALVA O GUIA ===
    try {
      window.JC = window.JC || {};
      window.JC.data = window.JC.data || {};
      window.JC.data.guia = guiaId;

      sessionStorage.setItem('jornada.guia', guiaId);
      localStorage.setItem('jc.guia', guiaId);
      document.body.dataset.guia = guiaId;
    } catch (e) {
      console.warn('[JCGuia] Erro ao salvar guia:', e);
    }

    // === SALVA O NOME (GARANTIDO AQUI TAMBÉM, POR SEGURANÇA) ===
const nameInput = q('#guiaNameInput', root);
const userName  = (nameInput?.value || '').trim().toUpperCase();
const guiaAtual = (guiaId || '').trim().toLowerCase();

if (!userName || !guiaAtual) {
  try {
    const errBox = q('#guia-error', root);
    if (errBox) {
      errBox.classList.remove('hidden');

      const msg = q('#guia-notice-text', errBox) || errBox;
      msg.textContent = !userName
        ? 'Para seguir, digite seu nome e escolha um guia.'
        : 'Agora escolha o guia que caminhará com você.';
    }

    // só por segurança: reabilita todos os botões da tela guia
    const buttons = root.querySelectorAll(
      '.guia-options button, #btn-confirmar-nome'
    );
    buttons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('is-disabled');
    });
  } catch (e) {
    console.warn('[XGuia] Falha ao mostrar aviso na tela guia:', e);
  }

  // ⚠️ ponto chave: NÃO avança, NÃO grava nome, NÃO seta dataset.guia
  return;
}

// ======================================================
// === SALVA O NOME (GARANTIDO AQUI TAMBÉM, POR SEGURANÇA)
// (agora reaproveitando userName que já está lá em cima)
// ======================================================
try {
  if (userName) {
    window.xc.data.nome = userName;
    sessionStorage.setItem('jornada.nome', userName);
    localStorage.setItem('jc.nome', userName);
  }
} catch (e) {
  console.warn('[XGuia] Erro ao salvar nome (backup):', e);
}

// ======================================================
// === AURA DO CORPO (COR DO GUIA) ===
// (reaproveita guiaAtual já em lowerCase)
// ======================================================
try {
  if (guiaAtual) {
    document.body.dataset.guia = guiaAtual;
    console.log('[AURA] Guia ativo:', guiaAtual, '— cor aplicada');
  }
} catch (err) {
  console.warn('[AURA] Falha ao definir cor:', err);
}


    // === TRANSIÇÃO ===
    const src = getTransitionSrc(root);
    playTransitionSafe(src, NEXT_SECTION_ID);
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
      btn.dataset.guia = g.id;
      btn.dataset.nome = g.nome;
      btn.setAttribute('aria-label', `Escolher o guia ${g.nome}`);
      btn.disabled = true;

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

  // ===== AVISO (usando #guia-error) =====
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
    const id = (btn.dataset.guia || '').toLowerCase();

    if (armedId === id) {
      confirmGuide(root, id, label);
      cancelArm(root);
      return;
    }

    armedId = id;
    qa('.guia-option', root).forEach(el => {
      el.classList.remove('armed');
      el.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('armed');
    btn.setAttribute('aria-pressed', 'true');

    showNotice(root, `Você escolheu ${label}. Clique novamente para confirmar.`, { speak: true });

    if (armTimer) clearTimeout(armTimer);
    armTimer = setTimeout(() => {
      cancelArm(root);
      showNotice(root, 'Tempo esgotado. Selecione o guia e clique novamente para confirmar.', { speak: true });
    }, ARM_TIMEOUT_MS);
  }

  async function initOnce(root) {
    if (!root || root.dataset.guiaInitialized === 'true') return;
    root.dataset.guiaInitialized = 'true';

    await waitForTransitionUnlock();
    ensureVisible(root);

    const els = pick(root);
    let guias = [];
    let guideButtons = [];

    // ===== NOME EM MAIÚSCULO =====
    if (els.nameInput) {
      els.nameInput.addEventListener('input', () => {
        const start = els.nameInput.selectionStart;
        const end = els.nameInput.selectionEnd;
        els.nameInput.value = els.nameInput.value.toUpperCase();
        els.nameInput.setSelectionRange(start, end);
      });
    }

    // ===== TÍTULO COM TTS =====
    if (els.title && !els.title.classList.contains('typing-done')) {
      await typeOnce(els.title, null, { speed: 34, speak: true });
    }

    // ===== CARREGA GUIAS =====
    try {
      guias = await loadGuias();
      renderButtons(els.optionsBox, guias);
      hideNotice(root);
    } catch (e) {
      console.error('[JCGuia] Erro ao carregar guias:', e);
      showNotice(root, 'Não foi possível carregar os guias. Tente novamente mais tarde.', { speak: false });
      return;
    }

    guideButtons = qa('button[data-action="select-guia"]', els.optionsBox);
    guideButtons.forEach(b => { b.disabled = true; b.style.opacity = '0.6'; b.style.cursor = 'not-allowed'; });

    // ===== CONFIRMAR NOME (SALVA NOME AQUI) =====
    els.confirmBtn?.addEventListener('click', async () => {
      let name = (els.nameInput?.value || '').trim();
      if (name.length < 2) {
        window.toast?.('Por favor, insira um nome válido.', 'warning');
        els.nameInput?.focus();
        return;
      }

      const upperName = name.toUpperCase();
      els.nameInput.value = upperName;

      // === SALVA NOME COM GARANTIA ===
      try {
        window.JC = window.JC || {};
        window.JC.data = window.JC.data || {};
        window.JC.data.nome = upperName;

        sessionStorage.setItem('jornada.nome', upperName);
        localStorage.setItem('jc.nome', upperName);
      } catch (e) {
        console.warn('[JCGuia] Erro ao salvar nome:', e);
      }

      // === TEXTO PERSONALIZADO ===
      if (els.guiaTexto) {
        const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
        const msg = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);
        els.guiaTexto.textContent = '';
        await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });
        els.moldura?.classList.add('glow');
        els.guiaTexto?.classList.add('glow');
      }

      // === HABILITA BOTÕES ===
      guideButtons.forEach(b => {
        b.disabled = false;
        b.style.opacity = '1';
        b.style.cursor = 'pointer';
      });
      hideNotice(root);
    }, { once: true });

    // ===== HOVER: PRÉVIA DA DESCRIÇÃO =====
    guideButtons.forEach(btn => {
      const preview = async () => {
        if (btn.disabled) return;
        const g = findGuia(guias, btn.dataset.guia);
        if (!g || !els.guiaTexto) return;
        els.guiaTexto.dataset.spoken = '';
        await typeOnce(els.guiaTexto, g.descricao, { speed: 34, speak: true });
      };

      btn.addEventListener('mouseenter', () => {
        if (btn.disabled) return;
        const t = setTimeout(preview, HOVER_DELAY_MS);
        hoverTimers.set(btn, t);
      });
      btn.addEventListener('mouseleave', () => {
        const t = hoverTimers.get(btn);
        if (t) clearTimeout(t);
        hoverTimers.delete(btn);
      });
      btn.addEventListener('focus', () => {
        if (!btn.disabled) preview();
      });
    });

    // ===== CLIQUE: ARMAR / DUPLUCLIQUE: CONFIRMAR =====
guideButtons.forEach(btn => {
  const label = (btn.dataset.nome || btn.textContent || 'guia').toUpperCase();
  const guiaId = (btn.dataset.guia || '').toLowerCase();

  btn.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (btn.disabled) return;
    armGuide(root, btn, label);
  });

  btn.addEventListener('dblclick', (ev) => {
    ev.preventDefault();
    if (btn.disabled) return;
    confirmGuide(root, guiaId, label);
    cancelArm(root);
  });

  btn.addEventListener('keydown', (ev) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      if (btn.disabled) return;
      armGuide(root, btn, label);
    }
  });

  // ===== PREVIEW DE TEMA AO PASSAR O MOUSE =====
  btn.addEventListener('mouseenter', () => {
    if (btn.disabled || !guiaId) return;
    applyGuiaTheme(guiaId);    // aplica cor/tema temporário
  });

  btn.addEventListener('mouseleave', () => {
    if (btn.disabled) return;
    applyGuiaTheme(null);      // volta para o tema oficial (ou dourado)
  });

  btn.setAttribute('role', 'button');
  btn.setAttribute('tabindex', '0');
  btn.setAttribute('aria-pressed', 'false');
});


    // ===== CANCELA AO CLICAR FORA =====
    document.addEventListener('click', (e) => {
      const inside = e.target.closest?.('.guia-option');
      if (!inside && armedId) cancelArm(root);
    }, { passive: true });

    console.log('[JCGuia] Inicializado com sucesso: nome + guia salvos + 2 cliques + TTS + aura');
  }
  // ===== TEMA DINÂMICO DOS GUIAS (preview ao passar o mouse) =====
function applyGuiaTheme(guiaIdOrNull) {
  if (guiaIdOrNull) {
    // aplica tema do guia passado
    document.body.dataset.guia = guiaIdOrNull.toLowerCase();
    return;
  }

  // sem parâmetro: restaura o tema "oficial" (já escolhido ou nenhum)
  const saved =
    (window.JC && window.JC.data && window.JC.data.guia) ||
    sessionStorage.getItem('jornada.guia') ||
    '';

  if (saved) {
    document.body.dataset.guia = saved.toLowerCase();
  } else {
    // remove o data-guia → volta pro padrão dourado
    delete document.body.dataset.guia;
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
  
/* =========================================================
   GUIA – Nome primeiro + DEMO automática (ANTI-TRAVA TOTAL + RETRY)
   ========================================================= */
(function () {
  'use strict';

  const root = document.getElementById('section-guia');
  if (!root) return;

  if (root.dataset.guiaDemoBound === '1') return;
  root.dataset.guiaDemoBound = '1';

  const input      = root.querySelector('#guiaNameInput');
  const btnConfirm = root.querySelector('#btn-confirmar-nome');
  const guiaNotice = root.querySelector('#guia-notice-text');
  const guideButtons = Array.from(root.querySelectorAll('.guia-options button, .guia-buttons button, .btn-guia'));

  if (!input || !btnConfirm || guideButtons.length === 0) return;

  let demoDone = false;
  let guiaEscolhido = false;

  // Tema dourado no início
  document.body.removeAttribute('data-guia');
  document.body.removeAttribute('data-guia-hover');
  document.documentElement.style.setProperty('--theme-main-color', '#d4af37');
  document.documentElement.style.setProperty('--progress-main', '#ffd700');
  document.documentElement.style.setProperty('--progress-glow-1', 'rgba(255,230,180,0.85)');
  document.documentElement.style.setProperty('--progress-glow-2', 'rgba(255,210,120,0.75)');

  function lockGuides() {
    guideButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.pointerEvents = 'none';
    });
  }

  function unlockGuides() {
    guideButtons.forEach(btn => {
      btn.disabled = false;
      btn.style.pointerEvents = 'auto';
    });
    demoDone = true;
    if (guiaNotice) {
      guiaNotice.setAttribute('data-text', 'Agora escolha, com calma, qual guia caminhará com você nesta jornada.');
    }
  }

  lockGuides();
  btnConfirm.disabled = true;

  input.addEventListener('input', () => {
    btnConfirm.disabled = input.value.trim().length === 0;
  });

  btnConfirm.addEventListener('click', () => {
    const nome = input.value.trim();
    if (!nome) {
      alert('Digite seu nome para prosseguir!');
      input.focus();
      return;
    }

    // Se demo já rodou, só destrava
    if (demoDone) {
      unlockGuides();
      return;
    }

    if (guiaNotice) {
      guiaNotice.setAttribute('data-text', `Veja a apresentação dos guias, ${nome}, e depois escolha o que tocar seu coração.`);
    }

    lockGuides(); // trava guias durante demo

    const seq = ['lumen', 'zion', 'arian'];
    let step = 0;

    const playStep = () => {
      guideButtons.forEach(b => b.classList.remove('guia-demo-active'));
      document.body.removeAttribute('data-guia-hover');

      if (step >= seq.length) {
        unlockGuides(); // destrava guias no final da demo
        return;
      }

      const guia = seq[step];
      document.body.setAttribute('data-guia-hover', guia);

      const btn = guideButtons.find(b => b.textContent.toLowerCase().includes(guia));
      if (btn) btn.classList.add('guia-demo-active');

      step++;
      setTimeout(playStep, 1400);
    };

    playStep();
  });

  // ===== ESCOLHA DO GUIA =====
  guideButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const guiaId = btn.dataset.guia || btn.textContent.toLowerCase().trim();
      if (!guiaId) return;

      // Salva nome e guia
      sessionStorage.setItem('jornada.nome', input.value.trim());
      sessionStorage.setItem('jornada.guia', guiaId);

      // Aplica tema definitivo
      aplicarGuiaTheme(guiaId);

      guiaEscolhido = true;

      // Avança para próxima seção
      if (typeof JC !== 'undefined' && JC.next) JC.next();
    });
  });

  // ANTI-TRAVA FINAL: se usuário não escolher guia após demo, permite retry
  setTimeout(() => {
    if (!guiaEscolhido && demoDone) {
      alert('Você ainda não escolheu um guia. Clique em um dos guias para prosseguir ou digite o nome novamente e confirme.');
      btnConfirm.disabled = false;
      input.focus();
    }
  }, 20000); // 20s após demo (tempo para usuário reagir)

  console.log('[GUIA] Anti-trava total + retry ativado');
})();

})();
