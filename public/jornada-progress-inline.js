/* Progress inline sem loop: move uma única vez quando as perguntas ficam visíveis (v1.2) */
(function(){
  'use strict';

  var POS = 'above'; // 'above' após a chama | 'below' antes dos botões
  var done = false;
  var obs  = null;

  function q(sel, root){ return (root||document).querySelector(sel); }
  function byId(id){ return document.getElementById(id); }

  function findBadge(){
    return byId('jprog-pct') || byId('badgeProgressoBlocos'); // aceita ambos
  }
  function findBar(){
    // prioriza seletor do controller
    return q('.j-progress__fill') || q('.progress-bar');
  }
  function findMeta(){
    // prioriza seletor do controller
    return byId('j-meta') || q('.j-progress');
  }

  function ensureWrap(){
    var wrap = byId('progress-inline');
    if (!wrap){
      wrap = document.createElement('div');
      wrap.id = 'progress-inline';
      wrap.className = 'progress-inline';
    } else {
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    }
    return wrap;
  }

  function alreadyPlaced(wrap, badge, bar, meta){
    return wrap && wrap.contains(badge) && wrap.contains(bar) && wrap.contains(meta);
  }

  function placeAbove(sec, wrap){
    // ancora após a “chama” se existir; senão, após o primeiro elemento da seção
    var anchorTop = byId('chama-perguntas') || sec.firstElementChild;
    if (anchorTop && anchorTop.parentNode){
      anchorTop.insertAdjacentElement('afterend', wrap);
    } else {
      sec.insertBefore(wrap, sec.firstChild);
    }
  }

  function placeBelow(sec, wrap){
    var footer = q('.footer-actions', sec);
    if (footer && footer.parentNode){
      footer.parentNode.insertBefore(wrap, footer);
    } else {
      sec.appendChild(wrap); // garante posicionamento mesmo sem footer
    }
  }

  function relocateOnce(){
    if (done) return;

    var sec   = byId('section-perguntas');
    var badge = findBadge();
    var bar   = findBar();
    var meta  = findMeta();
    if (!sec || !badge || !bar || !meta) return;

    var wrap = byId('progress-inline');

    if (alreadyPlaced(wrap, badge, bar, meta)){
      done = true;
      if (obs) { obs.disconnect(); obs = null; }
      return;
    }

    // monta o wrap e injeta na posição desejada
    wrap = ensureWrap();
    badge.classList.add('inline');

    if (obs) obs.disconnect(); // pausa enquanto mexe no DOM

    wrap.appendChild(badge);
    wrap.appendChild(bar);
    wrap.appendChild(meta);

    if (POS === 'below') placeBelow(sec, wrap);
    else placeAbove(sec, wrap);

    done = true;
    obs = null; // não religamos, é “one-shot”
  }

  function watch(){
    var sec = byId('section-perguntas');
    if (!sec) return;

    // se já está visível (#perguntas), move já e sai
    if (!sec.classList.contains('hidden')) {
      relocateOnce();
      return;
    }

    // observa somente mudança de classe (evita loops)
    obs = new MutationObserver(function(muts){
      for (var i=0;i<muts.length;i++){
        if (muts[i].type === 'attributes' && !sec.classList.contains('hidden')) {
          relocateOnce();
          break;
        }
      }
    });
    obs.observe(sec, { attributes:true, attributeFilter:['class'] });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }
})();
