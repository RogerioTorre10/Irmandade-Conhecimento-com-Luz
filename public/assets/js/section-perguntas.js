/* /assets/js/section-perguntas.js — v3.0 FINAL
   - Remove qualquer bloqueio de "card confirmado"
   - Usa window.JPaperQA como fonte oficial das perguntas
   - Mantém fallback via evento qa:start (sem alarmismo)
   - Fluxo: selfie -> card -> perguntas -> final
*/

(function () {
  'use strict';

  const MOD = 'section-perguntas.js';
  const SECTION_ID = 'section-perguntas';
  const NEXT_SECTION_ID = 'section-final';
  const VIDEO_SRC = '/assets/videos/filme-0-ao-encontro-da-jornada.mp4';

  const log  = (...a) => console.log('[PERGUNTAS]', ...a);
  const warn = (...a) => console.warn('[PERGUNTAS]', ...a);
  const err  = (...a) => console.error('[PERGUNTAS]', ...a);
  const $    = (sel, root = document) => root.querySelector(sel);

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
    // 1) Preferir vídeo de transição configurado
    if (typeof window.playTransitionVideo === 'function' && VIDEO_SRC) {
      window.playTransitionVideo(VIDEO_SRC, NEXT_SECTION_ID);
      return;
    }

    // 2) Usar controlador geral da jornada
    if (window.JC?.goNext) {
      window.JC.goNext();
      return;
    }

    // 3) Fallback por ID
    if (typeof window.showSection === 'function' && document.getElementById(NEXT_SECTION_ID)) {
      window.showSection(NEXT_SECTION_ID);
      return;
    }

    // 4) Último recurso: só notifica conclusão
    document.dispatchEvent(new CustomEvent('qa:completed', {
      detail: { answers: State.answers, meta: State.meta }
    }));
  }

  // --------------------------------------
  // Helper opcional: aguardar transições
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
      await Promise.race([p, t]);
    } catch {
      // qualquer erro aqui é ignorado para não travar o fluxo
    }
  }

  // --------------------------------------
  // Descobrir API das perguntas
  // --------------------------------------
  function getPaperApi() {
    // Padrão oficial da Jornada:
    if (window.JPaperQA) return window.JPaperQA;

    // Fallbacks se em algum momento você expor com outro nome:
    if (window.JCPaperQA) return window.JCPaperQA;
    if (window.JornadaPaperQA) return window.JornadaPaperQA;
    if (window.PaperQA) return window.PaperQA;

    return null;
  }

  // -------------------------------
  // Inicialização do bloco de Q&A
  // -------------------------------
  async function startQA(root) {
    if (!root) {
      warn('Root para perguntas não encontrado.');
      return;
    }
    if (State.running) {
      log('Fluxo QA já em execução, ignorando novo start.');
      return;
    }

    State.running = true;

    await waitForTransitionUnlock();

    const guia   = (window.JC?.state?.guia) || {};
    const selfie = window.__SELFIE_DATA_URL__ || null;
    const startedAt = new Date().toISOString();

    const opts = {
      container: root,
      guia,
      selfie,
      i18n: window.i18n || null,
      onProgress: () => {
        // hook opcional para barra de progresso no futuro
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

          // Exporta para a jornada-final/pdf/hq
          window.__QA_ANSWERS__ = State.answers;
          window.__QA_META__    = State.meta;

          log('QA finalizado. Respostas disponíveis em __QA_ANSWERS__ / __QA_META__.');
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
      const api = getPaperApi();

      if (api && typeof api.loadDynamicBlocks === 'function') {
        log('Usando JPaperQA.loadDynamicBlocks');
        await api.loadDynamicBlocks(root, opts);
      } else if (api && typeof api.mount === 'function') {
        log('Usando JPaperQA.mount');
        await api.mount(root, opts);
      } else if (api && typeof api.start === 'function') {
        log('Usando JPaperQA.start');
        await api.start(opts);
      } else if (api && typeof api.run === 'function') {
        log('Usando JPaperQA.run');
        await api.run(opts);
      } else if (api && typeof api.init === 'function') {
        log('Usando JPaperQA.init (+begin se existir)');
        await api.init(opts);
        if (typeof api.begin === 'function') {
          await api.begin();
        }
      } else {
        // Fluxo padrão: JornadaPaperQA não está em uso direto, então avisa via evento.
        log('API direta não encontrada. Disparando evento qa:start (fluxo padrão da Jornada).');
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
      log('Seção perguntas já montada; ignorando novo bind.');
      return;
    }

    const root = $('#perguntas-root', node) || node;
    if (!root) {
      warn('Container de perguntas não encontrado (#perguntas-root).');
      return;
    }

    State.mounted = true;
    log('Montando seção de perguntas...');
    startQA(root);
  }

  // Chamado quando o controlador carregar a seção
  document.addEventListener('sectionLoaded', (e) => {
    if (!e?.detail || e.detail.sectionId !== SECTION_ID) return;
    const node = e.detail.node || document.getElementById(SECTION_ID);
    bindSection(node);
  });

  // Segurança extra: se a página já veio com a seção carregada
  document.addEventListener('DOMContentLoaded', () => {
    const sec = document.getElementById(SECTION_ID);
    if (sec && !State.mounted) {
      bindSection(sec);
    }
  });

  // API pública opcional para debug
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
