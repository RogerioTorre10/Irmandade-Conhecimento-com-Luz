/* ============================================
   navigation.js — Rotas e navegação da Jornada (v1.1)
   Expondo: window.JORNADA_NAV
   Compat: JORNADA_RENDER.*, JORNADA_BLOCKS, JC, data-nav
   ============================================ */
;(function () {
  'use strict';

  const R = {
    intro:      'intro',
    perguntas:  'perguntas',   // uso: #perguntas:0 (bloco 0..n-1)
    acolhe:     'acolhimento',
    final:      'final',
    home:       'home',
  };

  // ---- Fallbacks e adapters ------------------------------------
  const RENDER = (function () {
    const JR = window.JORNADA_RENDER || {};
    return {
      intro:     () => JR.renderIntro?.(),
      perguntas: (i=0) => JR.renderPerguntas?.(i),
      final:     () => JR.renderFinal?.(),
      bg:        (id) => (window.updateCanvasBackground || JR.updateCanvasBackground || (()=>{}))(id),
    };
  })();

  function totalBlocks() {
    // Preferência: QUESTIONS.totalBlocks(); fallback: JORNADA_BLOCKS.length
    try { if (window.QUESTIONS?.totalBlocks) return Number(window.QUESTIONS.totalBlocks()) || 0; } catch {}
    try { if (Array.isArray(window.JORNADA_BLOCKS)) return window.JORNADA_BLOCKS.length; } catch {}
    return 0;
  }

  // Ativar/desativar “modo jornada” (no-ops se não houver CSS/handler)
  function activateJornada()   { try { document.body.classList.add('jornada-active'); } catch {} }
  function deactivateJornada() { try { document.body.classList.remove('jornada-active'); } catch {} }

  // ---- Render conforme hash ------------------------------------
  function renderFromHash() {
    const raw = (location.hash || '').replace(/^#/, '');
    if (!raw) return goIntro(false);

    const [route, param] = raw.split(':');
    const idx = Number(param || 0) || 0;

    switch (route) {
      case R.intro:
        activateJornada(); RENDER.intro(); RENDER.bg('section-intro'); return;
      case R.perguntas:
        activateJornada(); RENDER.perguntas(idx); RENDER.bg('section-perguntas'); return;
      case R.final:
        activateJornada(); RENDER.final(); RENDER.bg('section-final'); return;
      case R.home:
        deactivateJornada(); return goHome(true);
      case R.acolhe:
        // Se houver uma tela “acolhimento”, renderize aqui (placeholder)
        activateJornada();
        if (window.JORNADA_RENDER?.renderAcolhimento) {
          window.JORNADA_RENDER.renderAcolhimento();
        } else {
          // fallback: vá para final
          RENDER.final();
        }
        return;
      default:
        return goIntro(false);
    }
  }

  // ---- APIs públicas -------------------------------------------
  function goIntro(push = true) {
    if (push) { location.hash = '#'+R.intro; return; }
    location.replace('#'+R.intro); RENDER.intro(); RENDER.bg('section-intro');
  }
  function goPerguntas(blockIndex = 0) { location.hash = `#${R.perguntas}:${blockIndex}`; }
  function goAcolhimento()             { location.hash = '#'+R.acolhe; }
  function goFinal()                   { location.hash = '#'+R.final; }
  function goHome(replaceOnly = false) {
    const url = '/jornadas.html';
    if (replaceOnly) location.replace(url); else window.location.href = url;
  }

  function nextBlock(currIndex) {
    const last = Math.max(0, totalBlocks() - 1);
    if (currIndex < last) return goPerguntas(currIndex + 1);
    return goAcolhimento();
  }
  function prevBlock(currIndex) {
    if (currIndex > 0) return goPerguntas(currIndex - 1);
    return goIntro();
  }

  // ---- Delegação de cliques -----------------------------------
  function onClick(e) {
    const a = e.target.closest?.('[data-nav]');
    if (!a) return;
    const nav = a.getAttribute('data-nav');
    if (!nav) return;
    e.preventDefault();

    switch (nav) {
      case 'home':            return goHome();
      case 'intro':           return goIntro();
      case 'final':           return goFinal();
      case 'acolhimento':     return goAcolhimento();
      case 'perguntas-next':  return nextBlock(Number(a.dataset.idx||0));
      case 'perguntas-prev':  return prevBlock(Number(a.dataset.idx||0));
      case 'perguntas':       return goPerguntas(Number(a.dataset.idx||0));
    }
  }

  function init() {
    window.addEventListener('hashchange', renderFromHash);
    document.addEventListener('click', onClick);
    renderFromHash(); // primeira carga
  }

  window.JORNADA_NAV = {
    init, goHome, goIntro, goPerguntas, goAcolhimento, goFinal,
    nextBlock, prevBlock, routes: R
  };
})();
