(function () {
  'use strict';

  const MOD = 'section-perguntas.js';
  const SECTION_ID = 'section-perguntas';
  const NEXT_SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const log = (...a) => console.log('[PERGUNTAS]', ...a);
  const warn = (...a) => console.warn('[PERGUNTAS]', ...a);
  const err = (...a) => console.error('[PERGUNTAS]', ...a);
  const $ = (sel, root = document) => root.querySelector(sel);

  const State = {
    mounted: false,
    running: false,
    answers: null,
    meta: null,
  };

  function goNext() {
    if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else if (window.JC?.goNext) {
      window.JC.goNext();
    } else if (typeof window.showSection === 'function' && document.getElementById(NEXT_SECTION_ID)) {
      window.showSection(NEXT_SECTION_ID);
    } else {
      document.dispatchEvent(new CustomEvent('qa:completed', {
        detail: { answers: State.answers, meta: State.meta }
      }));
    }
  }

  async function startQA(root) {
    if (!root) return warn('Root para perguntas não encontrado.');
    if (State.running) return log('Fluxo QA já em execução.');
    State.running = true;

    const guia = window.JC?.state?.guia || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const startedAt = new Date().toISOString();

    const opts = {
      container: root,
      guia,
      selfie,
      i18n: window.i18n || null,
      onProgress: (p) => {},
      onComplete: (result) => {
        try {
          const finishedAt = new Date().toISOString();
          State.answers = result?.answers || result || null;
          State.meta = {
            startedAt,
            finishedAt,
            guia,
            selfieUsed: !!selfie,
            version: window.APP_CONFIG?.version || 'v1'
          };
          window.__QA_ANSWERS__ = State.answers;
          window.__QA_META__ = State.meta;
          log('QA finalizado. Respostas salvas em __QA_ANSWERS__.');
          window.toast?.('Jornada de perguntas concluída!');
          goNext();
        } catch (e) {
          err('Falha ao processar resultado do QA:', e);
          window.toast?.('Ops, algo falhou ao concluir as perguntas.');
        } finally {
          State.running = false;
        }
      }
    };

    try {
      if (window.JornadaPaperQA?.mount) {
        log('Usando JornadaPaperQA.mount');
        await window.JornadaPaperQA.mount(root, opts);
      } else if (window.JornadaPaperQA?.start) {
        log('Usando JornadaPaperQA.start');
        await window.JornadaPaperQA.start(opts);
      } else if (window.JornadaPaperQA?.run) {
        log('Usando JornadaPaperQA.run');
        await window.JornadaPaperQA.run(opts);
      } else if (window.JornadaPaperQA?.init) {
        log('Usando JornadaPaperQA.init + .begin');
        await window.JornadaPaperQA.init(opts);
        await window.JornadaPaperQA.begin?.();
      } else {
        warn('API do JornadaPaperQA não encontrada. Disparando evento qa:start.');
        document.dispatchEvent(new CustomEvent('qa:start', { detail: opts }));
      }
    } catch (e) {
      State.running = false;
      err('Erro ao iniciar QA:', e);
      window.toast?.('Não foi possível iniciar as perguntas.');
    }
  }

  function bindSection(node) {
    if (State.mounted) return log('Seção já montada; ignorando novo bind.');
    const root = $('#perguntas-root', node) || node;
    if (!root) return warn('Container de perguntas não encontrado.');
    State.mounted = true;
    log('Montando seção de perguntas...');
    startQA(root);
  }

  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    bindSection(node);
  });

  window.JPerguntas = {
    reset() {
      State.mounted = false;
      State.running = false;
      State.answers = null;
      State.meta = null;
      log('Reset concluído.');
    },
    start(root) {
      bindSection(root || document.getElementById(SECTION_ID));
    }
  };

  log('Carregado');
})();
