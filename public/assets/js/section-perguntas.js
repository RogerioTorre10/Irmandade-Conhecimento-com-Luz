// /assets/js/jornada-perguntas.js
(function () {
  'use strict';

  const NS = '[PERGUNTAS]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  // Ajuste aqui se os IDs forem diferentes
  const SECTION_ID = 'section-perguntas';
  const ROOT_SEL = '#perguntas-root';

  // Estado simples desta seção
  const State = {
    mounted: false,
    running: false,
    answers: null,
    meta: null,
  };

  // Helpers DOM
  const $ = (sel, root = document) => root.querySelector(sel);

  // Navegação segura
  function goNext() {
    if (window.JC?.goNext) return window.JC.goNext();
    if (typeof window.showSection === 'function' && document.getElementById('section-final')) {
      return window.showSection('section-final');
    }
    // fallback: emitir evento
    document.dispatchEvent(new CustomEvent('qa:completed', { detail: { answers: State.answers, meta: State.meta } }));
  }

  // Normaliza API do Paper QA (tentando funções conhecidas)
  async function startQA(root) {
    if (!root) { warn('Root para perguntas não encontrado.'); return; }
    if (State.running) { log('Fluxo QA já em execução.'); return; }
    State.running = true;

    // Metadados úteis
    const guia = (window.JC?.state?.guia) || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const startedAt = new Date().toISOString();

    // Opções padrão que passaremos ao motor
    const opts = {
      container: root,
      guia,
      selfie,
      i18n: window.i18n || null,
      onProgress: (p) => {
        // você pode usar p.current, p.total, p.key etc.
        // log('Progresso QA:', p);
      },
      onComplete: (result) => {
        try {
          const finishedAt = new Date().toISOString();
          State.answers = result?.answers || result || null;
          State.meta = {
            startedAt,
            finishedAt,
            guia,
            selfieUsed: !!selfie,
            version: (window.APP_CONFIG?.version || 'v1'),
          };

          // Exportar global para o final
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

    // Tentativas de integração — escolha suave de APIs
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
        // como último recurso, emita um evento para outro script iniciar
        document.dispatchEvent(new CustomEvent('qa:start', { detail: opts }));
      }
    } catch (e) {
      State.running = false;
      err('Erro ao iniciar QA:', e);
      window.toast?.('Não foi possível iniciar as perguntas.');
    }
  }

  // Bind da seção
  function bindSection(node) {
    if (State.mounted) {
      log('Seção já montada; ignorando novo bind.');
      return;
    }
    const root = $(ROOT_SEL, node) || node;
    if (!root) {
      warn('Contêiner de perguntas não encontrado, verifique o seletor:', ROOT_SEL);
      return;
    }
    State.mounted = true;
    log('Montando seção de perguntas…');
    startQA(root);
  }

  // Entrada: quando a seção é carregada
  document.addEventListener('sectionLoaded', (e) => {
    if (e?.detail?.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    bindSection(node);
  });

  // Expor uma API mínima para reset/start manual (opcional)
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
})();
