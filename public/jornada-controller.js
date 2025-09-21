/* =========================================================
   jornada-controller.js
   Controla a navegação e estado da jornada
   ========================================================= */
(function () {
  'use strict';
  console.log('[JORNADA_CONTROLLER] Script iniciado');

  // Evita múltiplas inicializações
  if (window.__JC_INIT_DONE) {
    console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
    return;
  }
  window.__JC_INIT_DONE = true;

  // Define namespace JC
  const JC = (window.JC = window.JC || {});
  JC.state = JC.state || { route: 'intro', booted: false, blocoIndex: 0, perguntaIndex: 0 };
  console.log('[JORNADA_CONTROLLER] JC.state definido:', JC.state);

  // Define JC.init imediatamente
  if (typeof JC.init !== 'function') {
    JC.init = function initJornada() {
      if (JC.state.booted) {
        console.log('[JORNADA_CONTROLLER] init já feito — ignorando.');
        return;
      }
      JC.state.booted = true;
      JC.state.route = 'intro';
      JC.ready = true;
      console.log('[JORNADA_CONTROLLER] JC.init executado');

      try {
        if (window.JORNADA_RENDER && window.JORNADA_RENDER.updateCanvasBackground) {
          window.JORNADA_RENDER.updateCanvasBackground('section-intro');
          console.log('[JORNADA_CONTROLLER] updateCanvasBackground chamado');
        }
        if (window.JORNADA_CHAMA && window.JORNADA_CHAMA.ensureHeroFlame) {
          window.JORNADA_CHAMA.ensureHeroFlame('section-intro');
          console.log('[JORNADA_CONTROLLER] ensureHeroFlame chamado');
        }
        const section = document.getElementById('section-intro');
        if (section && window.showSection) {
          window.showSection('section-intro');
          console.log('[JORNADA_CONTROLLER] showSection chamado para section-intro');
        } else {
          console.error('[JORNADA_CONTROLLER] section-intro não encontrada ou showSection ausente');
          window.toast && window.toast('Seção de introdução não encontrada.');
        }
        const startBtn = document.querySelector('#iniciar, [data-action="start"], [data-action="iniciar"], .btn-iniciar');
        if (startBtn) {
          startBtn.removeEventListener('click', window.__JC_startJourney);
          window.__JC_startJourney = () => {
            console.log('[JORNADA_CONTROLLER] Botão Iniciar clicado');
            startJourney();
          };
          startBtn.addEventListener('click', window.__JC_startJourney, { once: true });
          console.log('[JORNADA_CONTROLLER] Evento de clique adicionado ao botão Iniciar');
        }
        loadDynamicBlocks();
        if (JC._onReady && Array.isArray(JC._onReady)) {
          JC._onReady.forEach(fn => { try { fn(); } catch (e) {} });
          JC._onReady = [];
          console.log('[JORNADA_CONTROLLER] Callbacks onReady executados');
        }
      } catch (e) {
        console.error('[JORNADA_CONTROLLER] Erro em initJornada:', e);
        window.toast && window.toast('Erro ao inicializar a jornada.');
      }
    };
    console.log('[JORNADA_CONTROLLER] JC.init definido');
  }

  // Seletores e utilitários
  const S = {
    blocos() {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        window.toast && window.toast('Seção de perguntas não encontrada.');
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
      console.error('[JORNADA_CONTROLLER] Erro: #perguntas-container não encontrado!');
      window.toast && window.toast('Container de perguntas não encontrado.');
      return;
    }
    if (!Array.isArray(window.JORNADA_BLOCKS) || !window.JORNADA_BLOCKS.length) {
      console.error('[JORNADA_CONTROLLER] Erro: JORNADA_BLOCKS não definido ou vazio!', window.JORNADA_BLOCKS);
      window.toast && window.toast('Blocos de perguntas não encontrados.');
      return;
    }
    const validBlocks = window.JORNADA_BLOCKS.filter(block => Array.isArray(block?.questions) && block.questions.length);
    if (!validBlocks.length) {
      console.error('[JORNADA_CONTROLLER] Erro: Nenhum bloco válido com perguntas encontrado!', window.JORNADA_BLOCKS);
      window.toast && window.toast('Nenhum bloco de perguntas válido.');
      return;
    }
    content.innerHTML = '';
    window.JORNADA_BLOCKS.forEach((block, idx) => {
      if (!Array.isArray(block?.questions)) {
        console.warn(`[JORNADA_CONTROLLER] Bloco ${idx} inválido: sem perguntas`, block);
        return;
      }
      const bloco = document.createElement('section');
      bloco.className = 'j-bloco';
      bloco.dataset.bloco = idx;
      bloco.dataset.video = block.video_after || '';
      bloco.style.display = 'none';
      block.questions.forEach((q, qIdx) => {
        if (!q?.label) {
          console.warn(`[JORNADA_CONTROLLER] Pergunta ${qIdx} no bloco ${idx} inválida: sem label`, q);
          return;
        }
        const pergunta = document.createElement('div');
        pergunta.className = 'j-pergunta';
        pergunta.dataset.pergunta = qIdx;
        pergunta.innerHTML = `
          <label class="pergunta-enunciado text"
                 data-typing="true"
                 data-text="<b>Pergunta ${qIdx + 1}:</b> ${q.label}"
                 data-speed="40" data-cursor="true"></label>
          <textarea rows="4" class="input" placeholder="Digite sua resposta..." oninput="window.handleInput && window.handleInput(this)"></textarea>
          <div class="accessibility-controls">
            <button class="btn-mic" data-action="start-mic">🎤 Falar Resposta</button>
            <button class="btn-audio" data-action="read-question">🔊 Ler Pergunta</button>
            <button class="btn-avancar" data-action="avancar">Avançar</button>
          </div>
        `;
        bloco.appendChild(pergunta);
      });
      content.appendChild(bloco);
    });
    const blocos = document.querySelectorAll('.j-bloco');
    const firstBloco = content.querySelector('.j-bloco');
    if (!firstBloco) {
      console.error('[JORNADA_CONTROLLER] Nenhum bloco criado após loadDynamicBlocks!');
      return;
    }
    firstBloco.style.display = 'block';
    const firstPergunta = firstBloco.querySelector('.j-pergunta');
    if (firstPergunta) {
      firstPergunta.classList.add('active');
      if (window.runTyping) {
        window.runTyping(firstPergunta);
      }
      const firstTa = firstPergunta.querySelector('textarea');
      if (firstTa && window.handleInput) {
        window.handleInput(firstTa);
      }
    }
    if (window.loadAnswers) {
      window.loadAnswers();
    }
    console.log('[JORNADA_CONTROLLER] loadDynamicBlocks concluído');
  }

  // Navegação para a próxima seção/pergunta
  function goNext() {
    console.log('[JORNADA_CONTROLLER] Iniciando goNext...');
    const state = JC.state;
    let currentSection = document.querySelector('.j-section:not(.hidden)')?.id;
    if (!currentSection) {
      console.error('[JORNADA_CONTROLLER] Nenhuma seção ativa encontrada');
      window.toast && window.toast('Nenhuma seção ativa encontrada. Tente recarregar.');
      return;
    }
    // Corrigir truncamento
    if (currentSection.startsWith('section-int') || currentSection === 'section-00') {
      currentSection = 'section-intro';
      console.log('[JORNADA_CONTROLLER] Corrigido truncamento: section-intro');
    }

    const flow = [
      { from: 'section-intro', to: 'section-termos' },
      { from: 'section-termos', to: 'section-senha' },
      { from: 'section-senha', to: 'section-guia' },
      { from: 'section-guia', to: 'section-selfie' },
      { from: 'section-selfie', to: 'section-perguntas' },
      { from: 'section-perguntas', to: 'section-final' },
      { from: 'section-final', to: null }
    ];

    if (currentSection === 'section-perguntas') {
      const section = document.getElementById('section-perguntas');
      if (!section) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada em goNext');
        window.showSection && window.showSection('section-final');
        return;
      }
      const blocos = S.blocos();
      if (!blocos.length) {
        console.error('[JORNADA_CONTROLLER] Nenhum bloco encontrado em goNext');
        window.showSection && window.showSection('section-final');
        return;
      }
      const bloco = blocos[state.blocoIndex];
      if (!bloco) {
        console.error('[JORNADA_CONTROLLER] Bloco não encontrado no índice:', state.blocoIndex);
        window.showSection && window.showSection('section-final');
        return;
      }
      const perguntas = S.perguntasDo(bloco);
      if (!perguntas.length) {
        console.error('[JORNADA_CONTROLLER] Nenhuma pergunta encontrada no bloco:', state.blocoIndex);
        window.showSection && window.showSection('section-final');
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
        if (window.runTyping) {
          window.runTyping(next);
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
          if (window.runTyping) {
            window.runTyping(firstPergunta);
          }
        }
      } else {
        window.showSection && window.showSection('section-final');
      }
    } else {
      const nextSection = flow.find(f => f.from === currentSection)?.to;
      if (nextSection && window.showSection) {
        const nextSectionEl = document.getElementById(nextSection) || document.querySelector(`[data-section="${nextSection.replace('section-', '')}"], .${nextSection}`);
        if (nextSectionEl) {
          window.showSection(nextSection);
          console.log('[JORNADA_CONTROLLER] Navegando de', currentSection, 'para', nextSection);
        } else {
          console.error('[JORNADA_CONTROLLER] Seção seguinte não encontrada:', nextSection);
          window.toast && window.toast(`Seção ${nextSection} não encontrada. Tente recarregar.`);
        }
      } else {
        console.log('[JORNADA_CONTROLLER] Nenhuma seção seguinte definida para:', currentSection);
        window.toast && window.toast('Fim do fluxo. Tente recarregar.');
      }
    }
  }

  // Iniciar jornada
  function startJourney() {
    console.log('[JORNADA_CONTROLLER] Iniciando jornada... Dependências:', {
      JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
      JORNADA_QA: !!window.JORNADA_QA,
      JORNADA_PAPER: !!window.JORNADA_PAPER,
      JORNADA_TYPE: !!window.JORNADA_TYPE,
      JORNADA_RENDER: !!window.JORNADA_RENDER
    });
    if (window.JORNADA_BLOCKS && window.JORNADA_QA && window.JORNADA_PAPER && window.JORNADA_TYPE) {
      const sectionPerguntas = document.getElementById('section-perguntas');
      if (!sectionPerguntas) {
        console.error('[JORNADA_CONTROLLER] Seção #section-perguntas não encontrada');
        window.toast && window.toast('Seção de perguntas não encontrada.');
        return;
      }
      window.showSection && window.showSection('section-perguntas');
      loadDynamicBlocks();
      JC.state.blocoIndex = 0;
      JC.state.perguntaIndex = 0;
      if (window.JORNADA_RENDER && window.JORNADA_RENDER.renderPerguntas) {
        window.JORNADA_RENDER.renderPerguntas(0);
      }
    } else {
      console.error('[JORNADA_CONTROLLER] Dependências ausentes:', {
        JORNADA_BLOCKS: !!window.JORNADA_BLOCKS,
        JORNADA_QA: !!window.JORNADA_QA,
        JORNADA_PAPER: !!window.JORNADA_PAPER,
        JORNADA_TYPE: !!window.JORNADA_TYPE,
        JORNADA_RENDER: !!window.JORNADA_RENDER
      });
      window.toast && window.toast('Erro: Dependências não carregadas.');
    }
  }

  // Eventos globais
  function bindEvents() {
    if (window.__JC_EVENTS_BOUND) return;
    window.__JC_EVENTS_BOUND = true;

    document.removeEventListener('click', window.__JC_clickHandler);
    window.__JC_clickHandler = (e) => {
      const btn = e.target.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next');
      if (btn) {
        console.log('[JORNADA_CONTROLLER] Clique no botão avançar:', btn.id || btn.className);
        e.preventDefault();
        goNext();
      }
    };
    document.addEventListener('click', window.__JC_clickHandler, { capture: true });

    document.removeEventListener('keydown', window.__JC_keydownHandler);
    window.__JC_keydownHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.closest('[data-action="next"], [data-action="avancar"], .btn-avancar, .next-section, #avancar, #next')) {
          console.log('[JORNADA_CONTROLLER] Tecla Enter/Espaço no botão avançar:', activeEl.id || activeEl.className);
          e.preventDefault();
          goNext();
        }
      }
    };
    document.addEventListener('keydown', window.__JC_keydownHandler);
  }

  // Inicialização
  function bindBoot() {
    if (window.__JC_BIND_DONE) return;
    window.__JC_BIND_DONE = true;

    document.removeEventListener('DOMContentLoaded', window.__JC_onDomC);
    window.__JC_onDomC = () => {
      console.log('[JORNADA_CONTROLLER] Inicialização no DOMContentLoaded...');
      JC.init();
    };
    document.addEventListener('DOMContentLoaded', window.__JC_onDomC, { once: true });
  }

  // Exports globais
  JC.onReady = (cb) => {
    if (JC.ready) {
      try { cb(); } catch (e) {}
      return;
    }
    JC._onReady = JC._onReady || [];
    JC._onReady.push(cb);
  };
  JC.startJourney = startJourney;
  JC.goNext = goNext;

  // Inicializar
  bindEvents();
  bindBoot();

  console.log('[JORNADA_CONTROLLER] pronto');
})();
