/* =========================================================
   jornada-controller.js
   Controla a navegação e estado da jornada
   ========================================================= */
;(function () {
  'use strict';
  console.log('[JORNADA_CONTROLLER] Iniciando carregamento do script...');

  const JC = (window.JC = window.JC || {});
  JC._state = { blocoIndex: 0, perguntaIndex: 0 };

   // Evita múltiplas inicializações do Controller
   if (window.__JC_INIT_DONE) {
   console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
   return;
  }
   window.__JC_INIT_DONE = true;
   // === EXPOSE: torna o controller visível pro bootstrap ===
(function(){
  // Se já exposto, não faz nada
  if (window.__JC_EXPOSED) return;

  // Namespace global que o bootstrap espera
  window.JC = window.JC || {};

  // Anexa a função de init do controller (idempotente)
  window.JC.init = window.JC.init || function(){
    // guarda-vida: evita executar 2x
    if (window.__JC_INIT_DONE) {
      console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
      return;
    }
    window.__JC_INIT_DONE = true;

    // *** CHAME A SUA FUNÇÃO REAL AQUI ***
    // se a sua função real se chama initJornada, delega para ela:
    try {
      initJornada && initJornada();
    } catch (e) {
      console.error('[JORNADA_CONTROLLER] erro no init real:', e);
      // se falhar, libera para tentativa futura:
      window.__JC_INIT_DONE = false;
      throw e;
    }
  };

  // Sinaliza que o JC está pronto para o bootstrap começar
  window.__JC_READY = true;
  window.__JC_EXPOSED = true;
  console.log('[JORNADA_CONTROLLER] sinalizado READY ao bootstrap (JC.init disponível)');
})();


   // Seletores e utilitários
  const S = {
    blocos() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        return [];
      }
      return Array.from(section.querySelectorAll('.j-bloco,[data-bloco]'));
    },
    perguntasDo(bloco) {
      if (!bloco || !(bloco instanceof Element)) {
        console.error('[JORNADA_CONTROLLER] Bloco inválido em perguntasDo:', bloco);
        return [];
      }
      return Array.from(bloco.querySelectorAll('.j-pergunta,[data-pergunta]'));
    },
    perguntaAtual() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        return null;
      }
      return section.querySelector('.j-pergunta.active,[data-pergunta].active');
    }
  };

  // Carrega blocos dinâmicos
  function loadDynamicBlocks() {
    console.log('[JORNADA_CONTROLLER] Iniciando loadDynamicBlocks...');
    const content = document.getElementById('perguntas-container');
    if (!content) {
      console.error('Erro: #perguntas-container não encontrado no DOM!');
      return;
    }
    console.log('[JORNADA_CONTROLLER] #perguntas-container encontrado:', content);
    if (!Array.isArray(window.JORNADA_BLOCKS) || !window.JORNADA_BLOCKS.length) {
      console.error('Erro: JORNADA_BLOCKS não definido, não é array ou está vazio!', window.JORNADA_BLOCKS);
      return;
    }
    console.log('[JORNADA_CONTROLLER] Conteúdo de JORNADA_BLOCKS:', window.JORNADA_BLOCKS);
    const validBlocks = window.JORNADA_BLOCKS.filter(block => Array.isArray(block?.questions) && block.questions.length);
    if (!validBlocks.length) {
      console.error('Erro: Nenhum bloco válido com perguntas encontrado em JORNADA_BLOCKS!', window.JORNADA_BLOCKS);
      return;
    }
    content.innerHTML = '';
    console.log('[JORNADA_CONTROLLER] #perguntas-container limpo');
    window.JORNADA_BLOCKS.forEach((block, idx) => {
      if (!Array.isArray(block?.questions)) {
        console.warn(`Bloco ${idx} inválido: sem perguntas ou perguntas não é um array`, block);
        return;
      }
      const bloco = document.createElement('section');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = idx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = 'none';
      console.log(`[JORNADA_CONTROLLER] Criando bloco ${idx} com ${block.questions.length} perguntas`);
      block.questions.forEach((q, qIdx) => {
        if (!q?.label) {
          console.warn(`Pergunta ${qIdx} no bloco ${idx} inválida: sem label`, q);
          return;
        }
        const pergunta = document.createElement('div');
        pergunta.className = 'j-pergunta';
        pergunta.dataset.pergunta = qIdx;
        pergunta.innerHTML = `
          <label class="pergunta-enunciado"
                 data-typing
                 data-text="<b>Pergunta ${qIdx + 1}:</b> ${q.label}"
                 data-speed="40" data-cursor="true"></label>
          <textarea rows="4" class="input" placeholder="Digite sua resposta..." oninput="handleInput(this)"></textarea>
        `;
        bloco.appendChild(pergunta);
        console.log(`[JORNADA_CONTROLLER] Pergunta ${qIdx} adicionada ao bloco ${idx}`);
      });
      content.appendChild(bloco);
      console.log(`[JORNADA_CONTROLLER] Bloco ${idx} adicionado ao DOM`);
    });
    const blocos = document.querySelectorAll('.j-bloco');
    console.log('[JORNADA_CONTROLLER] Blocos no DOM após loadDynamicBlocks:', blocos.length, Array.from(blocos));
    const firstBloco = content.querySelector('.j-bloco');
    if (!firstBloco) {
      console.error('Nenhum bloco criado após loadDynamicBlocks!');
      return;
    }
    firstBloco.style.display = 'block';
    const firstPergunta = firstBloco.querySelector('.j-pergunta');
    if (firstPergunta) {
      firstPergunta.classList.add('active');
      try {
        if (window.JORNADA_TYPE?.run) {
          console.log('[JORNADA_CONTROLLER] Chamando JORNADA_TYPE.run para primeira pergunta');
          window.JORNADA_TYPE.run(firstPergunta);
        }
      } catch (e) {
        console.error('[JORNADA_CONTROLLER] Erro ao chamar JORNADA_TYPE.run:', e);
      }
      const firstTa = firstPergunta.querySelector('textarea');
      if (firstTa) {
        console.log('[JORNADA_CONTROLLER] Chamando handleInput para primeira textarea');
        handleInput(firstTa);
      }
    } else {
      console.error('Nenhuma primeira pergunta encontrada no primeiro bloco!');
    }
    try {
      if (window.loadAnswers) {
        console.log('[JORNADA_CONTROLLER] Chamando loadAnswers');
        window.loadAnswers();
      }
    } catch (e) {
      console.error('[JORNADA_CONTROLLER] Erro ao chamar loadAnswers:', e);
    }
    console.log('[JORNADA_CONTROLLER] Blocos carregados com sucesso!');
  }

  // Navegação para a próxima seção/pergunta
  function goNext() {
    console.log('[JORNADA_CONTROLLER] Iniciando goNext...');
    const state = JC._state || { blocoIndex: 0, perguntaIndex: 0 };
    const currentSection = document.querySelector('.j-section:not(.hidden)')?.id;
    console.log('[JORNADA_CONTROLLER] Seção atual:', currentSection);

    const flow = [
      { from: 'section-intro', to: 'section-termos' },
      { from: 'section-termos', to: 'section-senha' },
      { from: 'section-senha', to: 'section-guia' },
      { from: 'section-guia', to: 'section-selfie' },
      { from: 'section-selfie', to: 'section-perguntas' },
      { from: 'section-perguntas', to: null }, // Tratado separadamente
      { from: 'section-final', to: null }
    ];
     function initJornada() {
  // evita múltiplas inicializações
  if (window.__JC_INIT_DONE) {
    console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
    return;
  }
  window.__JC_INIT_DONE = true;

  const btnNext = document.getElementById('btnNextPerguntas') ||
                  document.querySelector('[data-action="next"]');
  if (btnNext) {
    btnNext.removeEventListener('click', window.__JC_onNext);
    window.__JC_onNext = function(e){
      e.preventDefault();
      console.log('[JORNADA_CONTROLLER] Clique no botão avançar detectado: btn',
                  'Seção atual:', window.__currentSectionId || 'desconhecida');
      window.showSection && window.showSection('section-termos');
    };
    btnNext.addEventListener('click', window.__JC_onNext, { passive:false });
  }

    if (currentSection === 'section-perguntas') {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada em goNext');
        window.showSection('section-final');
        return;
      }
      const blocos = S.blocos();
      if (!blocos.length) {
        console.error('[JORNADA_CONTROLLER] Nenhum bloco encontrado em goNext');
        window.showSection('section-final');
        return;
      }
      const bloco = blocos[state.blocoIndex];
      if (!bloco) {
        console.error('[JORNADA_CONTROLLER] Bloco não encontrado no índice:', state.blocoIndex);
        window.showSection('section-final');
        return;
      }
      const perguntas = S.perguntasDo(bloco);
      if (!perguntas.length) {
        console.error('[JORNADA_CONTROLLER] Nenhuma pergunta encontrada no bloco:', state.blocoIndex);
        window.showSection('section-final');
        return;
      }
      const current = perguntas[state.perguntaIndex];
      if (current) {
        current.classList.remove('active');
      }
      if (state.perguntaIndex + 1 < perguntas.length) {
        state.perguntaIndex++;
        const next = perguntas[state.perguntaIndex];
        next.classList.add('active');
        console.log('[JORNADA_CONTROLLER] Exibindo pergunta:', state.perguntaIndex, 'no bloco:', state.blocoIndex);
        try {
          if (window.JORNADA_TYPE?.run) {
            window.JORNADA_TYPE.run(next);
          }
        } catch (e) {
          console.error('[JORNADA_CONTROLLER] Erro ao chamar JORNADA_TYPE.run em goNext:', e);
        }
      } else if (state.blocoIndex + 1 < blocos.length) {
        state.blocoIndex++;
        state.perguntaIndex = 0;
        blocos.forEach(b => b.style.display = 'none');
        const nextBloco = blocos[state.blocoIndex];
        nextBloco.style.display = 'block';
        const firstPergunta = S.perguntasDo(nextBloco)[0];
        if (firstPergunta) {
          firstPergunta.classList.add('active');
          console.log('[JORNADA_CONTROLLER] Exibindo primeira pergunta do bloco:', state.blocoIndex);
          try {
            if (window.JORNADA_TYPE?.run) {
              window.JORNADA_TYPE.run(firstPergunta);
            }
          } catch (e) {
            console.error('[JORNADA_CONTROLLER] Erro ao chamar JORNADA_TYPE.run em goNext:', e);
          }
        }
      } else {
        console.log('[JORNADA_CONTROLLER] Fim dos blocos, navegando para section-final');
        window.showSection('section-final');
      }
    } else {
      const nextSection = flow.find(f => f.from === currentSection)?.to;
      if (nextSection) {
        console.log('[JORNADA_CONTROLLER] Navegando de', currentSection, 'para', nextSection);
        window.showSection(nextSection);
      } else {
        console.log('[JORNADA_CONTROLLER] Nenhuma seção seguinte definida para:', currentSection);
        window.toast('Fim do fluxo. Tente recarregar.');
      }
    }
  }

  // Inicialização da jornada
  async function initJornada() {
    console.log('[JORNADA_CONTROLLER] Iniciando initJornada...');
    try {
      window.JORNADA_RENDER?.updateCanvasBackground('section-intro');
      window.JORNADA_CHAMA?.ensureHeroFlame('section-intro');
      const section = document.getElementById('section-intro');
      if (section) {
        window.showSection('section-intro');
      } else {
        console.error('[JORNADA_CONTROLLER] section-intro não encontrada');
        window.toast('Seção de introdução não encontrada. Tente recarregar.');
      }
      const startBtn = document.querySelector('#iniciar, [data-action="start"], [data-action="iniciar"], .btn-iniciar');
      if (startBtn) {
        startBtn.addEventListener('click', () => {
          console.log('[JORNADA_CONTROLLER] Botão Iniciar clicado');
          startJourney();
        }, { once: true });
        console.log('[JORNADA_CONTROLLER] Botão Iniciar inicializado em JC.init');
      } else {
        console.warn('[JORNADA_CONTROLLER] Botão Iniciar não encontrado');
      }
      loadDynamicBlocks();
    } catch (e) {
      console.error('[JORNADA_CONTROLLER] Erro em initJornada:', e);
      window.toast('Erro ao inicializar a jornada. Tente recarregar.');
    }
  }

  // Iniciar jornada
  function startJourney() {
    console.log('[JORNADA_CONTROLLER] Iniciando jornada... Verificando dependências:', {
      JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
      JORNADA_QA: !!window.JORNADA_QA,
      JORNADA_PAPER: !!window.JORNADA_PAPER,
      JORNADA_TYPE: !!window.JORNADA_TYPE,
      JORNADA_RENDER: !!window.JORNADA_RENDER,
      JC: !!window.JC
    });
    if (window.JORNADA_BLOCKS && window.JORNADA_QA && window.JORNADA_PAPER && window.JORNADA_TYPE) {
      console.log('[JORNADA_CONTROLLER] Todas as dependências estão presentes, iniciando...');
      window.showSection('section-perguntas');
      loadDynamicBlocks();
      JC._state.blocoIndex = 0;
      JC._state.perguntaIndex = 0;
      setTimeout(() => {
        try {
          window.JORNADA_RENDER?.renderPerguntas(0);
        } catch (e) {
          console.error('[JORNADA_CONTROLLER] Erro ao chamar JORNADA_RENDER.renderPerguntas:', e);
        }
      }, 100);
      console.log('[JORNADA_CONTROLLER] Jornada iniciada com sucesso, exibindo primeira pergunta');
    } else {
      console.error('[JORNADA_CONTROLLER] Dependências não carregadas para iniciar:', {
        JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
        JORNADA_QA: !!window.JORNADA_QA,
        JORNADA_PAPER: !!window.JORNADA_PAPER,
        JORNADA_TYPE: !!window.JORNADA_TYPE,
        JORNADA_RENDER: !!window.JORNADA_RENDER,
        JC: !!window.JC
      });
    }
  }

  // Eventos globais
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next');
    if (btn) {
      console.log('[JORNADA_CONTROLLER] Clique no botão avançar detectado:', btn.id || btn.className, 'Seção atual:', document.querySelector('.j-section:not(.hidden)')?.id || 'desconhecida');
      e.preventDefault();
      goNext();
    }
  }, true);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      const activeEl = document.activeElement;
      if (activeEl && activeEl.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next')) {
        console.log('[JORNADA_CONTROLLER] Tecla Enter/Espaço no botão avançar:', activeEl.id || activeEl.className);
        e.preventDefault();
        goNext();
      }
    }
  });

 // Inicialização (bind uma vez)
function _bindBoot() {
  if (window.__JC_BIND_DONE) return;
  window.__JC_BIND_DONE = true;

  // DOMContentLoaded
  document.removeEventListener('DOMContentLoaded', window.__JC_onDomC);
  window.__JC_onDomC = () => {
    console.log('[JORNADA_CONTROLLER] Forçando inicialização no DOMContentLoaded...');
    (window.JC && typeof window.JC.init === 'function') ? window.JC.init() : initJornada();
  };
  document.addEventListener('DOMContentLoaded', window.__JC_onDomC, { once: true });

  // load
  window.removeEventListener('load', window.__JC_onLoadC);
  window.__JC_onLoadC = () => {
    console.log('[JORNADA_CONTROLLER] Forçando inicialização no load...');
    (window.JC && typeof window.JC.init === 'function') ? window.JC.init() : initJornada();
  };
  window.addEventListener('load', window.__JC_onLoadC, { once: true });
}
_bindBoot();

// Exports globais (que o bootstrap usa)
window.JC = window.JC || {};
window.JC.init = window.JC.init || initJornada;
window.JC.startJourney = startJourney;
window.JC.goNext = goNext;

console.log('[JORNADA_CONTROLLER] pronto');
