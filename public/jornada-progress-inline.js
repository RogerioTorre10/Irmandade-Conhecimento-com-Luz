/* Progress inline sem loop: move uma única vez quando as perguntas ficam visíveis */
(function(){
  // 'above' = acima das perguntas (após a chama) | 'below' = antes dos botões (abaixo das respostas)
  var POS = 'above'; // troque para 'below' se quiser

  var done = false;       // garante que só roda uma vez
  var obs  = null;        // guardamos o observer pra desconectar

  function relocateOnce(){
    if (done) return;
    var sec   = document.getElementById('section-perguntas');
    var badge = document.getElementById('jprog-pct');         // 0% concluído (já existente)
    var bar   = document.querySelector('.progress-bar');      // barra (já existente)
    var meta  = document.querySelector('.j-progress');        // "Respondidas: X de Y" (já existente)
    if (!sec || !badge || !bar || !meta) return;

    // Se já estão dentro do wrapper no lugar certo, não faz nada
    var wrap = document.getElementById('progress-inline');
    if (wrap && wrap.contains(badge) && wrap.contains(bar) && wrap.contains(meta)) {
      done = true;
      if (obs) { obs.disconnect(); obs = null; }
      return;
    }

    // Criar (ou reaproveitar) um wrapper limpo
    if (!wrap) {
      wrap = document.createElement('div');
      wrap.id = 'progress-inline';
      wrap.className = 'progress-inline';
    } else {
      // evita re-appends causarem novas mutações
      while (wrap.firstChild) wrap.removeChild(wrap.firstChild);
    }

    // % deixa de ser FIXO
    badge.classList.add('inline');

    // Pausa o observer enquanto mexemos no DOM para não disparar em cascata
    if (obs) { obs.disconnect(); }

    // Ordem final: selo %, barra, meta
    wrap.appendChild(badge);
    wrap.appendChild(bar);
    wrap.appendChild(meta);

    if (POS === 'below') {
      var anchorBottom = sec.querySelector('.footer-actions') || sec.lastChild;
      anchorBottom.parentNode.insertBefore(wrap, anchorBottom);
    } else {
      var anchorTop = sec.querySelector('#chama-perguntas') || sec.firstChild;
      anchorTop.insertAdjacentElement('afterend', wrap);
    }

    done = true; // nunca mais mexe
    // Não religamos o observer — missão cumprida
    obs = null;
  }

  function watch(){
    var sec = document.getElementById('section-perguntas');
    if (!sec) return;

    // Se já está visível (rota #perguntas), move já e sai
    if (!sec.classList.contains('hidden')) {
      relocateOnce();
      return;
    }

    // Observa SOMENTE a mudança de classe da section (evita loop)
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
