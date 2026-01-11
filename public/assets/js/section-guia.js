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
   // ===== CONFIRMAR NOME (SALVA NOME AQUI) =====
let __NAME_CONFIRMED__ = false;

// confirma começa bloqueado; libera conforme input
if (els.confirmBtn) els.confirmBtn.disabled = true;

els.nameInput?.addEventListener('input', () => {
  const v = (els.nameInput?.value || '').trim();
  if (els.confirmBtn) els.confirmBtn.disabled = (v.length < 2);
});

els.confirmBtn?.addEventListener('click', async (ev) => {
  ev.preventDefault();
  ev.stopPropagation();

  let name = (els.nameInput?.value || '').trim();
  if (name.length < 2) {
    window.toast?.('Por favor, insira um nome válido (mín. 2 letras).', 'warning');
    els.nameInput?.focus();
    return; // <-- agora pode tentar de novo (SEM once:true)
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

  // Se já confirmou antes, não precisa re-rodar TTS/datilo; só garante botões liberados
  if (!__NAME_CONFIRMED__) {
    __NAME_CONFIRMED__ = true;

    // === TEXTO PERSONALIZADO ===
    if (els.guiaTexto) {
      const base = (els.guiaTexto.dataset?.text || els.guiaTexto.textContent || 'Escolha seu guia para a Jornada.').trim();
      const msg = base.replace(/\{\{\s*(nome|name)\s*\}\}/gi, upperName);
      els.guiaTexto.textContent = '';
      await typeOnce(els.guiaTexto, msg, { speed: 38, speak: true });
      els.moldura?.classList.add('glow');
      els.guiaTexto?.classList.add('glow');
    }
  }

  // === HABILITA BOTÕES (SEMPRE) ===
  guideButtons.forEach(b => {
    b.disabled = false;
    b.style.opacity = '1';
    b.style.cursor = 'pointer';
    b.style.pointerEvents = 'auto';
  });

  hideNotice(root);

  // opcional: desabilita confirmar depois de sucesso (evita “stress”)
  // els.confirmBtn.disabled = true;
});


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
   GUIA – CONFIRMAR BLINDADO (anti-submit + stopImmediatePropagation + failsafe)
   ========================================================= */
(function () {
  'use strict';

  const root = document.getElementById('section-guia');
  if (!root) return;

  // trava para não bindar 2x
  if (root.dataset.guiaBound === '1') return;
  root.dataset.guiaBound = '1';

  const input        = root.querySelector('#guiaNameInput');
  const btnConfirm   = root.querySelector('#btn-confirmar-nome');
  const guiaNotice   = root.querySelector('#guia-notice-text');
  const guideButtons = Array.from(root.querySelectorAll('.guia-options button, .guia-buttons button, .btn-guia'));

  if (!input || !btnConfirm || guideButtons.length === 0) return;

  // === MUITO IMPORTANTE: impedir SUBMIT ===
  btnConfirm.setAttribute('type', 'button');
  guideButtons.forEach(b => b.setAttribute('type', 'button'));

  // Tema dourado inicial
  document.body.removeAttribute('data-guia');
  document.body.removeAttribute('data-guia-hover');
  document.documentElement.style.setProperty('--theme-main-color', '#d4af37');
  document.documentElement.style.setProperty('--progress-main', '#ffd700');
  document.documentElement.style.setProperty('--progress-glow-1', 'rgba(255,230,180,0.85)');
  document.documentElement.style.setProperty('--progress-glow-2', 'rgba(255,210,120,0.75)');

  // Estado inicial
  let unlocked = false;

  function setNotice(msg) {
    if (guiaNotice) guiaNotice.setAttribute('data-text', msg);
  }

  function lockGuides() {
    guideButtons.forEach(b => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
    });
  }

  function unlockGuides() {
    guideButtons.forEach(b => {
      b.disabled = false;
      b.style.pointerEvents = 'auto';
    });
    unlocked = true;
    setNotice(`${(input.value || '').trim()}, agora escolha o guia que caminhará com você.`);
  }

  // Inicial: guias travados, confirmar travado
  lockGuides();
  btnConfirm.disabled = true;
  setNotice('Digite seu nome para desbloquear a escolha do guia.');

  // Habilita Confirmar ao digitar nome
  input.addEventListener('input', () => {
    btnConfirm.disabled = input.value.trim().length === 0;
  });

  // FAILSAFE: se algo travar, destrava em 2s
  function armFailsafe() {
    setTimeout(() => {
      if (!unlocked && input.value.trim()) {
        console.warn('[GUIA] FAILSAFE destravando guias.');
        btnConfirm.disabled = false;
        unlockGuides();
      }
    }, 2000);
  }

  // === CONFIRMAR: CAPTURE + stopImmediatePropagation para bloquear handlers antigos ===
  btnConfirm.addEventListener('click', (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    ev.stopImmediatePropagation(); // <- isto é o que normalmente resolve a “inoperância”

    const nome = input.value.trim();
    if (!nome) {
      btnConfirm.disabled = true;
      alert('Digite seu nome para prosseguir!');
      input.focus();
      return;
    }

    sessionStorage.setItem('jornada.nome', nome);

    // Destrava sem demo (zero risco)
    unlockGuides();

    // Failsafe extra (caso outro script trave depois)
    armFailsafe();
  }, true); // <- CAPTURE: pega antes de outros listeners

  // Escolha do guia (também blindado)
  guideButtons.forEach(btn => {
    if (btn.__guiaBound) return;
    btn.__guiaBound = true;

    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
      ev.stopImmediatePropagation();

      if (btn.disabled) return;

      const guiaId = (btn.dataset.guia || btn.textContent || '').toLowerCase().trim();
      if (!guiaId) return;

      sessionStorage.setItem('jornada.guia', guiaId);

      if (typeof aplicarGuiaTheme === 'function') {
        aplicarGuiaTheme(guiaId);
      } else {
        document.body.setAttribute('data-guia', guiaId);
      }

      if (typeof JC !== 'undefined' && JC && typeof JC.next === 'function') {
        JC.next();
      }
    }, true);
  });

  console.log('[GUIA] Confirmar blindado + anti-trava real ativado');
})();

/* =========================================================
   TEMA DO GUIA — reaplica em qualquer seção quando necessário
   ========================================================= */
(function () {
  'use strict';

  function applyThemeFromSession() {
    const guiaRaw = sessionStorage.getItem('jornada.guia');
    const guia = guiaRaw ? guiaRaw.toLowerCase().trim() : '';

    // fallback dourado
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

  // roda no carregamento e também quando o app troca seção
  document.addEventListener('DOMContentLoaded', applyThemeFromSession);
  document.addEventListener('sectionLoaded', () => setTimeout(applyThemeFromSession, 50));
  document.addEventListener('guia:changed', applyThemeFromSession);
})();



})();
