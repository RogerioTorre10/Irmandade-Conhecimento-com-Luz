/* /assets/js/section-perguntas.js — v2.0
   - Bloqueio de "card confirmado" removido
   - Mantém fluxo suave: selfie -> card -> perguntas -> final
*/

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

  // -------------------------------
  // Navegação para a próxima seção
  // -------------------------------
  function goNext() {
    if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
      // Usa vídeo de transição, se existir
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
    } else if (window.JC?.goNext) {
      // Usa controlador genérico da jornada
      window.JC.goNext();
    } else if (typeof window.showSection === 'function' && document.getElementById(NEXT_SECTION_ID)) {
      // Fallback simples
      window.showSection(NEXT_SECTION_ID);
    } else {
      // Último fallback: só avisa que concluiu
      document.dispatchEvent(new CustomEvent('qa:completed', {
        detail: { answers: State.answers, meta: State.meta }
      }));
    }
  }

  // --------------------------------------
  // Helper opcional: respeitar transições
  // --------------------------------------
  async function waitForTransitionUnlock(timeoutMs = 15000) {
    try {
      if (!window.__TRANSITION_LOCK) return;

      let resolved = false;

      const p = new Promise(resolve => {
        const onEnd = () => {
          if (!resolved) {
            resolved = true;
            document.removeEventListener('transition:ended', onEnd);
            resolve();
          }
        };
        document.addEventListener('transition:ended', onEnd, { once: true });
      });

      const t = new Promise(resolve => setTimeout(resolve, timeoutMs));

      await Promise.race([p, t]); // não trava pra sempre
    } catch {
      // silêncio elegante: se algo der errado aqui, não bloqueia o fluxo
    }
  }

  // -------------------------------
  // Inicialização do bloco de Q&A
  // -------------------------------
  async function startQA(root) {
    if (!root) return warn('Root para perguntas não encontrado.');
    if (State.running) return log('Fluxo QA já em execução.');
    State.running = true;

    // Garante que qualquer transição anterior finalize antes de começar as perguntas
    await waitForTransitionUnlock();

    const guia = window.JC?.state?.guia || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const startedAt = new Date().toISOString();

    const opts = {
      container: root,
      guia,
      selfie,
      i18n: window.i18n || null,
      onProgress: (p) => {
        // hook opcional para barra de progresso se quiser no futuro
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
            version: window.APP_CONFIG?.version || 'v1'
          };

          // Expor globalmente para o PDF/HQ e jornada-final
          window.__QA_ANSWERS__ = State.answers;
          window.__QA_META__ = State.meta;

          log('QA finalizado. Respostas salvas em __QA_ANSWERS__ / __QA_META__.');
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

  // -------------------------------
  // Bind da seção às events da jornada
  // -------------------------------
  function bindSection(node) {
    if (State.mounted) {
      return log('Seção já montada; ignorando novo bind.');
    }

    const root = $('#perguntas-root', node) || node;
    if (!root) return warn('Container de perguntas não encontrado.');

    State.mounted = true;
    log('Montando seção de perguntas...');
    startQA(root);
  }

  // Quando a seção "perguntas" for carregada pelo controlador da jornada
  document.addEventListener('sectionLoaded', (e) => {
    if (!e?.detail || e.detail.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    bindSection(node);
  });

  // API pública opcional
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
