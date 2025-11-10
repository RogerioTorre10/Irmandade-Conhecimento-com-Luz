/* Progress inline sem loop: move uma única vez quando as perguntas ficam visíveis (v1.2) */
(function(){
  'use strict';

  // O POSICIONAMENTO AGORA É CONTROLADO VIA CSS/HTML, NÃO PRECISAMOS DA REALOCAÇÃO.
  var done = true; // Força a flag 'done' para verdadeiro imediatamente.
  var obs  = null;

  function q(sel, root){ return (root||document).querySelector(sel); }
  function byId(id){ return document.getElementById(id); }

  // Manter as funções find, caso algum outro script dependa delas para 'ler' o progresso.
  function findBadge(){
    return byId('jprog-pct') || byId('badgeProgressoBlocos');
  }
  function findBar(){
    // prioriza seletor do controller
    return q('.j-progress__fill') || q('.progress-bar');
  }
  function findMeta(){
    // prioriza seletor do controller
    return byId('j-meta') || q('.j-progress');
  }

  // A função relocateOnce agora simplesmente verifica se está 'done' e sai.
  function relocateOnce(){
    if (done) return; 

    // Se você precisar que este script faça alguma coisa *além* de mover 
    // (como atualizar o progresso), o código de atualização deve ser inserido aqui.
    // Como a atualização de progresso geralmente está nos scripts 'jornada-chama.js' ou 'jornada-micro.js',
    // podemos deixar essa função vazia e confiando no 'done = true' logo no início.

    // Apenas para garantir que o 'done' seja setado:
    done = true;
    if (obs) { obs.disconnect(); obs = null; }
  }

  function watch(){
    // Não precisamos de um observer, já que a realocação está desativada.
    // Apenas chame relocateOnce uma vez, que agora não fará nada.
    relocateOnce(); 
  }

  // Inicializa o watch, mas como 'done' é true, nada acontece.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watch);
  } else {
    watch();
  }
})();
