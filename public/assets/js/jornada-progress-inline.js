/* /assets/js/jornada-progress-inline.js
 * v1.4 — Progress inline corrigido + cor do guia aplicada
 * - Corrige erro findBadge/findBar/findMeta não definidos
 * - Aplica cor do guia na barra movida
 * - Mantém tudo leve e one-shot
 */

(function () {
  'use strict';

  if (window.__JPROG_INLINE_BOUND__) {
    console.log('[JPROG-INLINE] Já inicializado, ignorando.');
    return;
  }
  window.__JPROG_INLINE_BOUND__ = true;

  const MOD = '[JPROG-INLINE]';
  const POS = 'above'; // 'above' = abaixo do título | 'below' = acima dos botões

  let done = false;
  let obs = null;

  const q = (sel, root = document) => root.querySelector(sel);
  const byId = (id) => document.getElementById(id);

  // =========================================================
  // FIX 1: Funções de busca explícitas (não dependem de nada externo)
  // =========================================================
  function findBadge() {
    return byId('progress-question-value') || q('.progress-question-value');
  }

  function findBar() {
    return byId('progress-question-fill') || q('.progress-question-fill');
  }

  function findMeta() {
    // Meta pode ser o label "Perguntas no Bloco" ou o container
    return q('.progress-middle .progress-label') || 
           q('.progress-middle') || 
           byId('progress-question-label') ||
           q('.perguntas-no-bloco-label');
  }

  // =========================================================
  // FIX 2: Aplica cor do guia na barra (depois de mover)
  // =========================================================
  function applyGuideColor(barFill) {
    if (!barFill) return;

    const guia = document.body.getAttribute('data-guia') || 
                 sessionStorage.getItem('jornada.guia') || 
                 'lumen';

    let color = '#00ff9d';      // fallback Lumen
    let glow = '0 0 20px #00ff9d, 0 0 40px rgba(0,255,157,0.8)';

    if (guia.toLowerCase() === 'zion') {
      color = '#00aaff';
      glow = '0 0 20px #00aaff, 0 0 40px rgba(0,170,255,0.8), 0 0 30px rgba(255,214,91,0.6)';
    } else if (guia.toLowerCase() === 'arian') {
      color = '#ff00ff';
      glow = '0 0 25px #ff00ff, 0 0 50px rgba(255,120,255,0.9)';
    }

    barFill.style.background = color;
    barFill.style.boxShadow = glow;
    barFill.style.backgroundImage = 'none'; // remove textura temporariamente se conflitar
  }

  // =========================================================
  // Restante do código (mantido e melhorado)
  // =========================================================
  function ensureWrap() {
    let wrap = byId('progress-inline');
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'progress-inline';
      wrap.className = 'progress-inline';
    } else {
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    }
    return wrap;
  }

  function alreadyPlaced(wrap, badge, bar, meta) {
    return wrap && badge && bar && meta &&
           wrap.contains(badge) && wrap.contains(bar) && wrap.contains(meta);
  }

  function placeAbove(sec, wrap) {
    const anchor = byId('jp-question-typed') || sec.firstElementChild;
    if (anchor && anchor.parentNode) {
      anchor.insertAdjacentElement('afterend', wrap);
    } else {
      sec.insertBefore(wrap, sec.firstChild);
    }
  }

  function placeBelow(sec, wrap) {
    const footer = q('.footer-actions', sec) || q('.jp-actions', sec) || q('.perguntas-actions', sec);
    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(wrap, footer);
    } else {
      sec.appendChild(wrap);
    }
  }

  function relocateOnce() {
    if (done) return;

    const sec = byId('section-perguntas');
    if (!sec) return;

    const badge = findBadge();
    const bar = findBar();
    const meta = findMeta();

    if (!badge || !bar || !meta) {
      console.log(MOD, 'Elementos ainda não prontos, aguardando...');
      return;
    }

    let wrap = byId('progress-inline');

    if (alreadyPlaced(wrap, badge, bar, meta)) {
      console.log(MOD, 'Já posicionado corretamente.');
      done = true;
      if (obs) { obs.disconnect(); obs = null; }
      return;
    }

    wrap = ensureWrap();

    if (obs) { obs.disconnect(); obs = null; }

    // Ordem: meta (texto) + barra + badge (número)
    wrap.appendChild(meta);
    wrap.appendChild(bar);
    wrap.appendChild(badge);

    // Posiciona
    if (POS === 'below') {
      placeBelow(sec, wrap);
    } else {
      placeAbove(sec, wrap);
    }

    // FIX 2: Força cor do guia na barra movida
    applyGuideColor(bar);

    done = true;
    console.log(MOD, 'Progress inline reposicionado + cor do guia aplicada com sucesso.');
  }

  function watch() {
    const sec = byId('section-perguntas');
    if (!sec) {
      console.log(MOD, 'section-perguntas não encontrada.');
      return;
    }

    const isVisible = !sec.classList.contains('hidden');
    const isReady = sec.dataset.initialized === 'true' || sec.classList.contains('j-loaded');

    if (isVisible && isReady) {
      relocateOnce();
      return;
    }

    obs = new MutationObserver(() => {
      if (done) {
        if (obs) obs.disconnect();
        return;
      }
      const nowVisible = !sec.classList.contains('hidden');
      const nowReady = sec.dataset.initialized === 'true' || sec.classList.contains('j-loaded');
      if (nowVisible && nowReady) {
        relocateOnce();
      }
    });

    obs.observe(sec, {
      attributes: true,
      attributeFilter: ['class', 'data-initialized']
    });
  }

  // Inicialização
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }

  // Re-posiciona se a seção for recarregada
  document.addEventListener('sectionLoaded', (e) => {
    if (e.detail && e.detail.sectionId === 'section-perguntas') {
      setTimeout(relocateOnce, 100); // pequeno delay pra DOM estar pronto
    }
  });

  // Atualiza cor do guia se mudar durante a sessão
  document.addEventListener('guia:changed', () => {
    const bar = findBar();
    if (bar) applyGuideColor(bar);
  });

})();
