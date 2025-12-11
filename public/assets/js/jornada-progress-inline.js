/* /assets/js/jornada-progress-inline.js
 * v1.3 — Charm progress inline, sem travar datilografia / TTS
 * - One-shot: só move quando a section-perguntas estiver pronta e visível
 * - Não cria loops, não fica espionando a página inteira
 * - Usa elementos já existentes: badge, barra, meta
 */
(function () {
  'use strict';

  if (window.__JPROG_INLINE_BOUND__) {
    console.log('[JPROG-INLINE] Já inicializado, ignorando.');
    return;
  }
  window.__JPROG_INLINE_BOUND__ = true;

  var POS = 'above'; // 'above' = abaixo da chama / título | 'below' = acima dos botões do footer
  var done = false;
  var obs  = null;
  var MOD  = '[JPROG-INLINE]';

  function q(sel, root){ return (root || document).querySelector(sel); }
  function byId(id){ return document.getElementById(id); }

 // depois do bloco principal
const qBadge = document.getElementById('progress-question-value');
const qBar   = document.getElementById('progress-question-fill');


  function ensureWrap(){
    var wrap = byId('progress-inline');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.id = 'progress-inline';
      wrap.className = 'progress-inline';
    } else {
      // limpa se já existir algo antigo
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    }
    return wrap;
  }

  function alreadyPlaced(wrap, badge, bar, meta){
    return (
      wrap &&
      badge && bar && meta &&
      wrap.contains(badge) &&
      wrap.contains(bar) &&
      wrap.contains(meta)
    );
  }

  // ancora “charmosa” logo abaixo do topo da seção de perguntas
  function placeAbove(sec, wrap){
    // tenta ancorar após chama / título / pergunta digitada
    var anchor =
  document.getElementById('jp-question-typed') ||
  sec.firstElementChild;

    if (anchor && anchor.parentNode) {
      anchor.insertAdjacentElement('afterend', wrap);
    } else {
      sec.insertBefore(wrap, sec.firstChild);
    }
  }

  // alternativa: encostar acima do bloco de ações / botões finais
  function placeBelow(sec, wrap){
    var footer =
      q('.footer-actions', sec) ||
      q('.jp-actions', sec) ||
      q('.perguntas-actions', sec);

    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(wrap, footer);
    } else {
      sec.appendChild(wrap);
    }
  }

  // ---- Ação principal (executa uma única vez) ----
  function relocateOnce(){
    if (done) return;

    var sec   = byId('section-perguntas');
    if (!sec) return;

    var badge = findBadge();
    var bar   = findBar();
    var meta  = findMeta();

    // se ainda não existem (carregando blocos / JS), esperamos
    if (!badge || !bar || !meta) {
      return;
    }

    var wrap = byId('progress-inline');

    // se já está tudo dentro do wrap, encerra
    if (alreadyPlaced(wrap, badge, bar, meta)) {
      console.log(MOD, 'Já posicionado, encerrando.');
      done = true;
      if (obs) { obs.disconnect(); obs = null; }
      return;
    }

    // monta / limpa o wrapper
    wrap = ensureWrap();

    // classe opcional pra estilo compacto
    badge.classList.add('inline');

    // pausa observer enquanto mexe no DOM
    if (obs) { obs.disconnect(); obs = null; }

    // injeta na ordem desejada
    wrap.appendChild(badge);
    wrap.appendChild(bar);
    wrap.appendChild(meta);

    if (POS === 'below') placeBelow(sec, wrap);
    else placeAbove(sec, wrap);

    done = true;
    console.log(MOD, 'Progress inline posicionado com sucesso.');
  }

  // ---- Observa apenas a section-perguntas até ficar pronta ----
  function watch(){
    var sec = byId('section-perguntas');
    if (!sec) {
      console.log(MOD, 'section-perguntas ainda não existe, abortando watcher.');
      return;
    }

    // Se a seção já está visível e marcada como inicializada,
    // tenta posicionar direto (evita atrasos)
    var isVisible = !sec.classList.contains('hidden');
    var isReady =
      sec.dataset.initialized === 'true' ||
      sec.getAttribute('data-initialized') === 'true' ||
      sec.classList.contains('j-loaded');

    if (isVisible && isReady) {
      relocateOnce();
      return;
    }

    // Caso contrário, observa só essa seção por mudanças de status
    obs = new MutationObserver(function(muts){
      if (done) {
        if (obs){ obs.disconnect(); obs = null; }
        return;
      }

      var nowVisible = !sec.classList.contains('hidden');
      var nowReady =
        sec.dataset.initialized === 'true' ||
        sec.getAttribute('data-initialized') === 'true' ||
        sec.classList.contains('j-loaded');

      // só quando a seção aparecer E estiver carregada é que movemos
      if (nowVisible && nowReady) {
        relocateOnce();
      }
    });

    obs.observe(sec, {
      attributes: true,
      attributeFilter: ['class', 'data-initialized']
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }
   // FIX 1: Reinit quando section-perguntas vira active
      document.addEventListener('sectionLoaded', (e) => {
      if (e.detail.sectionId === 'section-perguntas') {
      relocateOnce(); // força reposicionamento do badge/bloco
    }
});
  
})();
