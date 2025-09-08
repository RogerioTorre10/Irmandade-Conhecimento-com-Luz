/* Move barra + selo % + meta para dentro de #section-perguntas */
(function(){
  // 'above' = acima das perguntas (após a chama) | 'below' = abaixo das respostas
  var POS = 'below';

  function relocateProgress(){
    var sec   = document.getElementById('section-perguntas');
    var badge = document.getElementById('jprog-pct');             // 0% concluído
    var bar   = document.querySelector('.progress-bar');          // barra visual
    var meta  = document.querySelector('.j-progress');            // "Respondidas: X de Y"
    if(!sec || !badge || !bar || !meta) return;

    // wrapper para manter tudo junto
    var wrap = document.getElementById('progress-inline');
    if(!wrap){
      wrap = document.createElement('div');
      wrap.id = 'progress-inline';
      wrap.className = 'progress-inline';
    }

    // selo de % deixa de ser FIXO
    badge.classList.add('inline');

    // monta a ordem
    wrap.appendChild(badge);
    wrap.appendChild(bar);
    wrap.appendChild(meta);

    if(POS === 'below'){
      // antes dos botões de navegação
      var anchorBottom = sec.querySelector('.footer-actions') || sec.lastChild;
      anchorBottom.parentNode.insertBefore(wrap, anchorBottom);
    }else{
      // acima das perguntas (logo após a chama)
      var anchorTop = sec.querySelector('#chama-perguntas') || sec.firstChild;
      anchorTop.insertAdjacentElement('afterend', wrap);
    }
  }

  function perguntasVisiveis(){
    var s = document.getElementById('section-perguntas');
    return s && !s.classList.contains('hidden');
  }

  // reposiciona quando a seção perguntas ficar visível
  var root = document.getElementById('jornada-conteudo') || document.body;
  var obs = new MutationObserver(function(){ if(perguntasVisiveis()) relocateProgress(); });
  obs.observe(root, { childList:true, subtree:true, attributes:true, attributeFilter:['class'] });

  // checagem inicial (rota #perguntas)
  if(perguntasVisiveis()) relocateProgress();
})();
